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

    add_response_to_faiss

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


# =========================================================
# FIRESTORE
# =========================================================

db = firestore.client()


# =========================================================
# FAISS AUTOMATIC RESPONSE INDEXING
# =========================================================

response_watch = None


def watch_resolved_responses(
    collection_snapshot,
    changes,
    read_time
):
    """
    Automatically add newly resolved Firestore responses
    to the FAISS index.

    This listener adds individual vectors. It does not
    rebuild the complete FAISS index.
    """

    index_changed = False

    for change in changes:

        change_type = getattr(
            change.type,
            "name",
            str(change.type)
        )

        if change_type not in (
            "ADDED",
            "MODIFIED"
        ):
            continue

        document = change.document
        data = document.to_dict()

        if data.get("status") != "resolved":
            continue

        try:

            print("\n========================================")
            print("NEW RESOLVED RESPONSE DETECTED")
            print("========================================")
            print(
                f"Response ID: {document.id}"
            )

            added = add_response_to_faiss(
                document.id
            )

            if added:
                index_changed = True

        except Exception as error:

            print(
                "\nFAISS AUTO-INDEX ERROR:"
            )
            print(str(error))

    if index_changed:

        try:

            print(
                "\nReloading in-memory FAISS index..."
            )

            reload_index()

            print(
                "In-memory FAISS index updated."
            )

        except Exception as error:

            print(
                "\nFAISS RELOAD ERROR:"
            )
            print(str(error))


def start_response_listener():

    global response_watch

    print(
        "\nStarting Firestore response listener..."
    )

    response_watch = (
        db
        .collection("responses")
        .on_snapshot(
            watch_resolved_responses
        )
    )

    print(
        "Firestore response listener started."
    )


def stop_response_listener():

    global response_watch

    if response_watch is not None:

        try:

            response_watch.unsubscribe()

            print(
                "Firestore response listener stopped."
            )

        except Exception as error:

            print(
                "Error stopping Firestore listener:"
            )
            print(str(error))

        finally:

            response_watch = None


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

# =========================================================
# START / STOP AUTOMATIC FAISS LISTENER
# =========================================================

@app.on_event("startup")
def startup_event():

    start_response_listener()


@app.on_event("shutdown")
def shutdown_event():

    stop_response_listener()


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



    print("\n")

    print("========================================")

    print("PROCESSING STUDENT QUERY")

    print("========================================")



    # =====================================================

    # 1. GET QUERY

    # =====================================================



    print(

        f"Query ID: {request.queryId}"

    )



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





    print(

        f"Title: {title}"

    )



    print(

        f"Description: {description}"

    )



    print(

        f"Department: {department}"

    )



    print(

        f"Course: {course}"

    )





    # =====================================================

    # 3. CREATE SEMANTIC QUERY

    # =====================================================



    semantic_query = (

        f"{title}. {description}"

    )





    print(

        f"\nSemantic query: "

        f"{semantic_query}"

    )







    # =====================================================

    # 4. SEMANTIC SEARCH
    #
    # IMPORTANT:
    # FAISS is already loaded in memory.
    # We DO NOT rebuild the complete index here.
    #
    # Newly resolved responses are added automatically
    # by the Firestore response listener.

    # =====================================================



    print(

        "\nRunning semantic search..."

    )





    results = search_similar_queries(



        semantic_query,



        top_k=5,



        department=department,



        course=course



    )





    print(

        f"\nSemantic search returned "

        f"{len(results)} result(s)."

    )





    # =====================================================

    # 6. NO RESULT

    # =====================================================



    if not results:



        print(

            "\nNo semantic search result."

        )



        return {



            "success": True,



            "aiAnswered": False,



            "message":

                "No similar resolved query found.",



            "queryId":

                request.queryId,



            "results": []



        }





    # =====================================================

    # 7. BEST RESULT

    # =====================================================



    best_result = results[0]





    similarity_score = float(

        best_result.get(

            "similarity",

            0

        )

    )





    print(

        "\nBest semantic result:"

    )



    print(

        f"Similarity: "

        f"{similarity_score:.4f}"

    )



    print(

        f"Question: "

        f"{best_result.get('queryTitle', '')}"

    )





    # =====================================================

    # 8. BUILD RAG CONTEXT

    # =====================================================



    try:



        rag_context = build_rag_context(



            semantic_query,



            results



        )





    except Exception as error:



        print(

            "\nRAG ERROR:"

        )



        print(

            str(error)

        )



        return {



            "success": False,



            "message":

                "RAG context generation failed",



            "error":

                str(error),



            "queryId":

                request.queryId



        }





    if not rag_context:



        return {



            "success": True,



            "aiAnswered": False,



            "message":

                "RAG context is empty.",



            "queryId":

                request.queryId,



            "results":

                results



        }





    # =====================================================

    # 9. GENERATE AI ANSWER

    # =====================================================



    try:



        ai_answer = generate_answer(



            semantic_query,



            rag_context



        )





    except Exception as error:



        print(

            "\nLLM ERROR:"

        )



        print(

            str(error)

        )



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

    # 10. RETURN RESULT

    # =====================================================



    print("\n")

    print("========================================")

    print("AI QUERY PROCESSING COMPLETED")

    print("========================================")





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