def build_rag_context(
    student_query,
    retrieved_results
):

    if not retrieved_results:
        return None


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


    return f"""
STUDENT QUESTION:

{student_query}


RELEVANT RESOLVED ACADEMIC QUERIES:

{final_context}
""".strip()