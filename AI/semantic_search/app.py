import os

import requests

from fastapi import FastAPI

from pydantic import BaseModel

from fastapi.middleware.cors import CORSMiddleware

from firebase_admin import firestore


from firestore_service import (
    get_query,
    get_response,
    save_ai_response,
    update_query_status
)


from build_index import (
    build_faiss_index
)


from semantic_search_service import (
    search_similar_queries,
    reload_index
)


from rag import (
    build_rag_context
)


from llm import (
    generate_answer
)


# =========================================================
# ENVIRONMENT
# =========================================================

RECOMMENDATION_API_URL = "http://127.0.0.1:8001"

RECOMMENDATION_API_KEY = "7f3c9a1e8b624d4a91f7c2e6a5b83012"



# =========================================================
# FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="DeptConnect AI",
    description=(
        "AI-powered academic query "
        "processing system"
    ),
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",

        "http://127.0.0.1:5501",
        "http://localhost:5501",

        "http://127.0.0.1:5502",
        "http://localhost:5502"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# REQUEST MODELS
# =========================================================


class QueryRequest(BaseModel):

    queryId: str


class AIConfirmRequest(BaseModel):

    queryId: str

    aiAnswer: str

    similarity: float

    similarQueryId: str


class AIEscalateRequest(BaseModel):

    queryId: str

    similarity: float

    similarQueryId: str


# =========================================================
# ROOT / HEALTH CHECK
# =========================================================


@app.get("/")
def root():

    return {

        "status": "online",

        "service": "DeptConnect AI",

        "version": "1.0.0"

    }


# =========================================================
# PROCESS QUERY
# =========================================================


@app.post("/process-query")
def process_query(
    request: QueryRequest
):

    # =====================================================
    # 1. GET QUERY FROM FIRESTORE
    # =====================================================

    query_data = get_query(
        request.queryId
    )


    if not query_data:

        return {

            "success": False,

            "message": "Query not found"

        }


    # =====================================================
    # 2. EXTRACT QUERY INFORMATION
    # =====================================================

    title = str(

        query_data.get(
            "title",
            ""
        )

    ).strip()


    description = str(

        query_data.get(
            "description",
            ""
        )

    ).strip()


    course = query_data.get(
        "course"
    )


    department = query_data.get(
        "department"
    )


    # =====================================================
    # 3. CREATE SEMANTIC QUERY
    # =====================================================

    semantic_query = (
        f"{title}. {description}"
    )


    # =====================================================
    # 4. REBUILD FAISS INDEX
    #
    # Every time a new query is processed:
    #
    # Firestore
    #     ↓
    # build_faiss_index()
    #     ↓
    # Updated FAISS files
    #     ↓
    # reload_index()
    #     ↓
    # Semantic Search
    #
    # This keeps the mini-project implementation simple
    # and ensures newly resolved responses are available
    # for subsequent searches.
    # =====================================================

    try:

        index_built = build_faiss_index()


        if not index_built:

            return {

                "success": True,

                "aiAnswered": False,

                "message": (
                    "No resolved academic "
                    "responses are available "
                    "for semantic search."
                ),

                "queryId":
                    request.queryId,

                "results": []

            }


        # -------------------------------------------------
        # Reload the newly created FAISS index
        # into the running FastAPI process.
        # -------------------------------------------------

        reload_index()


    except Exception as error:

        return {

            "success": False,

            "message": (
                "FAISS index rebuild failed"
            ),

            "error": str(error),

            "queryId":
                request.queryId

        }


    # =====================================================
    # 5. SEARCH FAISS
    # =====================================================

    results = search_similar_queries(

        semantic_query,

        top_k=5,

        department=department,

        course=course

    )


    # =====================================================
    # 6. NO SIMILAR QUERY FOUND
    # =====================================================

    if not results:

        return {

            "success": True,

            "aiAnswered": False,

            "message": (
                "No similar resolved "
                "query found."
            ),

            "queryId":
                request.queryId,

            "results": []

        }


    # =====================================================
    # 7. BEST SIMILAR RESULT
    # =====================================================

    best_result = results[0]


    similarity_score = float(

        best_result.get(
            "similarity",
            0
        )

    )


    # =====================================================
    # 8. BUILD RAG CONTEXT
    # =====================================================

    rag_context = build_rag_context(

        semantic_query,

        results

    )


    # =====================================================
    # 9. GENERATE AI ANSWER
    # =====================================================

    try:

        ai_answer = generate_answer(

            semantic_query,

            rag_context

        )

    except Exception as error:

        return {

            "success": False,

            "message":
                "AI answer generation failed",

            "error":
                str(error),

            "queryId":
                request.queryId

        }


    # =====================================================
    # 10. RETURN AI RESULT
    # =====================================================

    return {

        "success": True,

        "aiAnswered": True,

        "queryId":
            request.queryId,

        "similarity":
            similarity_score,

        "similarQueryId":
            best_result.get(
                "document_id"
            ),

        "aiAnswer":
            ai_answer,

        "source": {

            "question":
                best_result.get(
                    "queryTitle"
                ),

            "response":
                best_result.get(
                    "response"
                ),

            "course":
                best_result.get(
                    "course"
                ),

            "department":
                best_result.get(
                    "department"
                ),

            "faculty":
                best_result.get(
                    "facultyName"
                )

        }

    }


# =========================================================
# AI CONFIRMATION
# =========================================================


@app.post("/ai-confirm")
def ai_confirm(
    request: AIConfirmRequest
):

    # =====================================================
    # 1. GET ORIGINAL QUERY
    # =====================================================

    query_data = get_query(
        request.queryId
    )


    if not query_data:

        return {

            "success": False,

            "message":
                "Query not found",

            "queryId":
                request.queryId

        }


    # =====================================================
    # 2. CHECK WHETHER ALREADY RESOLVED
    # =====================================================

    if query_data.get(
        "status"
    ) == "resolved":

        return {

            "success": False,

            "message":
                "Query is already resolved",

            "queryId":
                request.queryId

        }


    # =====================================================
    # 3. GET SOURCE RESPONSE
    # =====================================================

    source_response = get_response(

        request.similarQueryId

    )


    # =====================================================
    # 4. SAVE AI RESPONSE
    # =====================================================

    save_ai_response(

        query_data=query_data,

        ai_answer=request.aiAnswer,

        similarity_score=request.similarity,

        source_response=source_response

    )


    # =====================================================
    # 5. UPDATE ORIGINAL QUERY
    #
    # Store the AI answer directly in the query document
    # so the student "My Queries" page can display it.
    # =====================================================

    update_query_status(

        query_id=request.queryId,

        status="resolved",

        extra_data={

            "aiProcessed": True,

            "aiAnswered": True,

            "aiAnswer":
                request.aiAnswer,

            "aiConfidence":
                request.similarity,

            "similiarQueryId":
                request.similarQueryId,

            "resolvedAt":
                firestore.SERVER_TIMESTAMP

        }

    )


    # =====================================================
    # 6. RETURN SUCCESS
    # =====================================================

    return {

        "success": True,

        "message":
            "AI answer confirmed "
            "and query resolved",

        "queryId":
            request.queryId,

        "status":
            "resolved",

        "aiAnswered":
            True,

        "aiConfidence":
            request.similarity,

        "similarQueryId":
            request.similarQueryId

    }


# =========================================================
# AI ESCALATION
# =========================================================


@app.post("/ai-escalate")
def ai_escalate(
    request: AIEscalateRequest
):

    # =====================================================
    # 1. GET ORIGINAL QUERY
    # =====================================================

    query_data = get_query(
        request.queryId
    )


    if not query_data:

        return {

            "success": False,

            "message":
                "Query not found",

            "queryId":
                request.queryId

        }


    # =====================================================
    # 2. CHECK IF ALREADY RESOLVED
    # =====================================================

    if query_data.get(
        "status"
    ) == "resolved":

        return {

            "success": False,

            "message":
                "Query is already resolved",

            "queryId":
                request.queryId

        }


    # =====================================================
    # 3. CHECK IF ALREADY ASSIGNED
    # =====================================================

    existing_faculty = query_data.get(
        "assignedFacultyId"
    )


    if (

        existing_faculty

        and existing_faculty != "nil"

    ):

        return {

            "success": True,

            "message":
                "Query is already assigned",

            "queryId":
                request.queryId,

            "assignedFacultyId":
                existing_faculty

        }


    # =====================================================
    # 4. MARK AI AS PROCESSED
    #
    # Student rejected AI answer.
    #
    # Keep status = pending because
    # recommendation system expects pending queries.
    # =====================================================

    update_query_status(

        query_id=request.queryId,

        status="pending",

        extra_data={

            "aiProcessed": True,

            "aiAnswered": False,

            "aiConfidence":
                request.similarity,

            "similiarQueryId":
                request.similarQueryId,

            "aiEscalationReason":
                "student_not_satisfied"

        }

    )


    # =====================================================
    # 5. CHECK INTERNAL API KEY
    # =====================================================

    if not RECOMMENDATION_API_KEY:

        return {

            "success": False,

            "message":
                "RECOMMENDATION_API_KEY "
                "is not configured",

            "queryId":
                request.queryId

        }


    # =====================================================
    # 6. BUILD RECOMMENDATION URL
    # =====================================================

    assignment_url = (

        RECOMMENDATION_API_URL.rstrip("/")

        + "/assign-faculty-internal"

    )


    # =====================================================
    # 7. CALL ML RECOMMENDATION SYSTEM
    #
    # NO FIREBASE TOKEN IS SENT.
    #
    # Instead, a server-to-server
    # internal API key is used.
    # =====================================================

    try:

        assignment_response = requests.post(

            assignment_url,

            headers={

                "X-Internal-Key":
                    RECOMMENDATION_API_KEY,

                "Content-Type":
                    "application/json"

            },

            json={

                "queryId":
                    request.queryId

            },

            timeout=60

        )


    except requests.exceptions.RequestException as error:

        return {

            "success": False,

            "message":
                "Faculty recommendation "
                "service is unavailable",

            "error":
                str(error),

            "queryId":
                request.queryId

        }


    # =====================================================
    # 8. READ RECOMMENDATION RESPONSE
    # =====================================================

    try:

        assignment_result = (

            assignment_response.json()

        )

    except ValueError:

        return {

            "success": False,

            "message":
                "Invalid response from "
                "faculty recommendation service",

            "queryId":
                request.queryId

        }


    # =====================================================
    # 9. HANDLE HTTP FAILURE
    # =====================================================

    if not assignment_response.ok:

        return {

            "success": False,

            "message":
                "Faculty assignment failed",

            "queryId":
                request.queryId,

            "httpStatus":
                assignment_response.status_code,

            "recommendationResponse":
                assignment_result

        }


    # =====================================================
    # 10. CHECK ASSIGNMENT SUCCESS
    # =====================================================

    if not assignment_result.get(
        "success",
        False
    ):

        return {

            "success": False,

            "message":
                "Faculty assignment "
                "was not successful",

            "queryId":
                request.queryId,

            "recommendationResponse":
                assignment_result

        }


    # =====================================================
    # 11. RETURN ASSIGNMENT RESULT
    # =====================================================

    return {

        "success": True,

        "message":
            "AI answer rejected. "
            "Query assigned through "
            "ML faculty recommendation system.",

        "queryId":
            request.queryId,

        "aiAnswered":
            False,

        "aiEscalated":
            True,

        "assignedFaculty":
            assignment_result.get(
                "assignedFaculty"
            ),

        "assignmentConfidence":
            assignment_result.get(
                "confidence"
            ),

        "workload":
            assignment_result.get(
                "workload"
            ),

        "assignmentMethod":
            "ML"

    }