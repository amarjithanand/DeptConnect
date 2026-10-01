import os

import cohere


# --------------------------------------------------
# Load environment variables
# --------------------------------------------------



COHERE_API_KEY = 'OPJ5W3QIS98JY4bls7TqzwJ2v4DWES7X3B5BBXDg'


if not COHERE_API_KEY:

    raise RuntimeError(
        "COHERE_API_KEY is not configured."
    )


# --------------------------------------------------
# Cohere client
# --------------------------------------------------

co = cohere.Client(
    api_key=COHERE_API_KEY
)


MODEL_NAME = (
    "command-a-03-2025"
)


# --------------------------------------------------
# Generate AI answer
# --------------------------------------------------

def generate_answer(
    student_query,
    rag_context
):

    system_instruction = """
You are the AI academic assistant for DeptConnect.

Your task is to answer a student's academic query
using the provided retrieved information from
previously resolved academic queries.

Rules:

1. Answer the student's actual question directly.

2. Use the retrieved information as the primary
   source of academic knowledge.

3. Do not invent policies, dates, procedures,
   fees, rules, or other academic information.

4. If the retrieved information does not provide
   enough information to answer confidently,
   clearly state that the information is insufficient.

5. Do not mention FAISS, embeddings, RAG,
   similarity scores, or internal AI processes.

6. Do not claim to be a faculty member.

7. Keep the response clear, concise, and
   student-friendly.

8. If the retrieved faculty response contains
   incomplete information, do not fill the missing
   information with assumptions.
""".strip()


    user_message = f"""
STUDENT QUERY:

{student_query}


RETRIEVED ACADEMIC CONTEXT:

{rag_context}


Generate the answer that should be shown to
the student.
""".strip()


    response = co.chat(

        model=MODEL_NAME,

        preamble=system_instruction,

        message=user_message,

        temperature=0.2,

        max_tokens=500
    )


    return response.text.strip()