import os
import pickle

import faiss

from sentence_transformers import SentenceTransformer


# =========================================================
# CONFIGURATION
# =========================================================

INDEX_FILE = os.path.join(
    "faiss_index",
    "responses.index"
)

METADATA_FILE = os.path.join(
    "faiss_index",
    "metadata.pkl"
)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


TOP_K = 5


# =========================================================
# LOAD MODEL
# =========================================================

print("Loading Sentence Transformer...")

model = SentenceTransformer(
    MODEL_NAME
)

print("Model loaded.")


# =========================================================
# LOAD FAISS INDEX
# =========================================================

print("Loading FAISS index...")

index = faiss.read_index(
    INDEX_FILE
)

print(
    f"Loaded {index.ntotal} vectors."
)


# =========================================================
# LOAD METADATA
# =========================================================

with open(
    METADATA_FILE,
    "rb"
) as file:

    metadata = pickle.load(
        file
    )


# =========================================================
# SEARCH FUNCTION
# =========================================================

def search_similar_queries(
    query,
    top_k=TOP_K
):

    # -----------------------------------------------------
    # CREATE QUERY EMBEDDING
    # -----------------------------------------------------

    query_embedding = model.encode(
        [query],
        convert_to_numpy=True,
        normalize_embeddings=True
    )


    # -----------------------------------------------------
    # SEARCH FAISS
    # -----------------------------------------------------

    scores, indices = index.search(
        query_embedding.astype("float32"),
        top_k
    )


    results = []


    # -----------------------------------------------------
    # PROCESS RESULTS
    # -----------------------------------------------------

    for score, index_position in zip(
        scores[0],
        indices[0]
    ):

        if index_position < 0:
            continue


        result = metadata[
            index_position
        ].copy()


        result["similarity"] = float(
            score
        )


        results.append(
            result
        )


    return results


# =========================================================
# INTERACTIVE SEARCH
# =========================================================

print("\n========================================")
print("DEPTCONNECT SEMANTIC SEARCH")
print("========================================")

print(
    "Type 'exit' to stop."
)


while True:

    query = input(
        "\nEnter student query: "
    ).strip()


    if query.lower() == "exit":

        print(
            "Exiting..."
        )

        break


    if not query:

        print(
            "Please enter a query."
        )

        continue


    results = search_similar_queries(
        query
    )


    print(
        "\n----------------------------------------"
    )

    print(
        "SIMILAR RESOLVED QUERIES"
    )

    print(
        "----------------------------------------"
    )


    for number, result in enumerate(
        results,
        start=1
    ):

        print(
            f"\n#{number}"
        )

        print(
            f"Similarity : "
            f"{result['similarity']:.4f}"
        )

        print(
            f"Question   : "
            f"{result['queryTitle']}"
        )

        print(
            f"Description: "
            f"{result['queryDescription']}"
        )

        print(
            f"Course     : "
            f"{result['course']}"
        )

        print(
            f"Department : "
            f"{result['department']}"
        )

        print(
            f"Faculty    : "
            f"{result['facultyName']}"
        )

        print(
            f"Answer     : "
            f"{result['response']}"
        )

        print(
            f"Document ID: "
            f"{result['document_id']}"
        )