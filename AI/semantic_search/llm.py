import os

import cohere



# =========================================================
# ENVIRONMENT
# =========================================================




COHERE_API_KEY = 'OPJ5W3QIS98JY4bls7TqzwJ2v4DWES7X3B5BBXDg'



if not COHERE_API_KEY:

    raise RuntimeError(
        "COHERE_API_KEY is not configured."
    )


# =========================================================
# COHERE CLIENT
# =========================================================

co = cohere.Client(
    api_key=COHERE_API_KEY
)


MODEL_NAME = "command-a-03-2025"


# =========================================================
# GENERATE AI ANSWER
# =========================================================

def generate_answer(
    student_query,
    rag_context
):

    print("\n========================================")
    print("GENERATING AI ANSWER")
    print("========================================")

    if not rag_context:

        raise ValueError(
            "RAG context is empty."
        )

    system_instruction = """
You are the AI academic assistant
for DeptConnect.

Your task is to answer a student's
academic query using the retrieved
information from previously resolved
academic queries.

Rules:

1. Answer the student's actual question
   directly.

2. Use the retrieved academic information
   as the primary source.

3. Do not invent academic policies,
   dates, procedures, fees, rules,
   or other information.

4. If the retrieved information is
   insufficient, clearly say that the
   available information is insufficient.

5. Do not mention FAISS, embeddings,
   RAG, similarity scores, or internal
   AI processes.

6. Do not claim to be a faculty member.

7. Keep the response clear, concise,
   and student-friendly.

8. Do not make assumptions to fill
   missing academic information.
""".strip()


    user_message = f"""
STUDENT QUERY:

{student_query}


RETRIEVED ACADEMIC CONTEXT:

{rag_context}


Generate the answer that should be
shown to the student.
""".strip()


    print(
        "Sending request to Cohere..."
    )

    try:

        response = co.chat(

            model=MODEL_NAME,

            preamble=system_instruction,

            message=user_message,

            temperature=0.2,

            max_tokens=500

        )

    except Exception as error:

        print(
            "\nCOHERE ERROR:"
        )

        print(
            str(error)
        )

        raise


    answer = response.text.strip()


    print(
        "\nAI answer generated successfully."
    )

    print(
        f"Answer length: "
        f"{len(answer)} characters"
    )

    print("========================================")


    return answer