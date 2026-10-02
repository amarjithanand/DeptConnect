# =========================================================
# RAG CONTEXT BUILDER
# =========================================================

def build_rag_context(
    student_query,
    retrieved_results
):

    print("\n========================================")
    print("BUILDING RAG CONTEXT")
    print("========================================")

    if not retrieved_results:

        print(
            "No retrieved results available for RAG."
        )

        return None

    print(
        f"Retrieved results: "
        f"{len(retrieved_results)}"
    )

    context_parts = []

    for number, result in enumerate(
        retrieved_results,
        start=1
    ):

        context = f"""
REFERENCE {number}

Similarity Score:
{result.get("similarity", 0):.4f}

Previous Student Question:
{result.get("queryTitle", "")}

Question Description:
{result.get("queryDescription", "")}

Course:
{result.get("course", "")}

Department:
{result.get("department", "")}

Faculty Response:
{result.get("response", "")}
""".strip()

        context_parts.append(
            context
        )

    final_context = "\n\n".join(
        context_parts
    )

    rag_context = f"""
STUDENT QUESTION:

{student_query}

RELEVANT RESOLVED ACADEMIC QUERIES:

{final_context}
""".strip()

    print("\nRAG context created successfully.")

    print(
        f"Context length: "
        f"{len(rag_context)} characters"
    )

    print("========================================")

    return rag_context