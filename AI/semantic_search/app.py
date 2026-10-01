from fastapi import FastAPI
from pydantic import BaseModel


from firestore_service import (
    get_query
)


from semantic_search_service import (
    search_similar_queries
)


from rag import (
    build_rag_context
)


from llm import (
    generate_answer
)


# --------------------------------------------------
# FastAPI application
# --------------------------------------------------

app = FastAPI(

    title="DeptConnect AI",

    description=(
        "AI-powered academic query "
        "processing system"
    ),

    version="1.0.0"
)


# --------------------------------------------------
# Request model
# --------------------------------------------------

class QueryRequest(BaseModel):

    queryId: str


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/")
def root():

    return {

        "status": "online",

        "service": "DeptConnect AI"
    }


# --------------------------------------------------
# Process student query
# --------------------------------------------------

@app.post(
    "/process-query"
)
def process_query(
    request: QueryRequest
):

    # ----------------------------------------------
    # STEP 1
    # Get query from Firestore
    # ----------------------------------------------

    query_data = get_query(
        request.queryId
    )


    if not query_data:

        return {

            "success": False,

            "message": "Query not found"
        }


    # ----------------------------------------------
    # STEP 2
    # Build semantic query
    # ----------------------------------------------

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


    semantic_query = (
        f"{title}. {description}"
    )


    # ----------------------------------------------
    # STEP 3
    # FAISS semantic search
    # ----------------------------------------------

    results = search_similar_queries(

        semantic_query,

        top_k=5,

        department=query_data.get(
            "department"
        ),

        course=query_data.get(
            "course"
        )
    )


    # ----------------------------------------------
    # STEP 4
    # Check if similar query exists
    # ----------------------------------------------

    if not results:

        return {

            "success": True,

            "aiAnswered": False,

            "message": (
                "No similar resolved "
                "query found."
            ),

            "queryId": request.queryId,

            "results": []
        }


    # ----------------------------------------------
    # STEP 5
    # Select best result
    # ----------------------------------------------

    best_result = results[0]


    similarity_score = (
        best_result.get(
            "similarity",
            0
        )
    )


    # ----------------------------------------------
    # STEP 6
    # Build RAG context
    # ----------------------------------------------

    rag_context = build_rag_context(

        semantic_query,

        results
    )


    # ----------------------------------------------
    # STEP 7
    # Generate LLM answer
    # ----------------------------------------------

    ai_answer = generate_answer(

        semantic_query,

        rag_context
    )


    # ----------------------------------------------
    # STEP 8
    # Return AI result
    # ----------------------------------------------

    return {

        "success": True,

        "aiAnswered": True,

        "queryId": request.queryId,

        "similarity": similarity_score,

        "similarQueryId":
            best_result.get(
                "document_id"
            ),

        "aiAnswer": ai_answer,

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