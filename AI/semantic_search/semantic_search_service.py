import os
import pickle

import faiss

from sentence_transformers import SentenceTransformer


# --------------------------------------------------
# Configuration
# --------------------------------------------------

INDEX_FILE = os.path.join(
    "faiss_index",
    "responses.index"
)

METADATA_FILE = os.path.join(
    "faiss_index",
    "metadata.pkl"
)

MODEL_NAME = (
    "sentence-transformers/"
    "all-MiniLM-L6-v2"
)


# --------------------------------------------------
# Load Sentence Transformer
# --------------------------------------------------

print(
    "Loading Sentence Transformer..."
)

model = SentenceTransformer(
    MODEL_NAME
)

print(
    "Sentence Transformer loaded."
)


# --------------------------------------------------
# Load FAISS index
# --------------------------------------------------

print(
    "Loading FAISS index..."
)

index = faiss.read_index(
    INDEX_FILE
)

print(
    f"FAISS loaded: {index.ntotal} vectors."
)


# --------------------------------------------------
# Load metadata
# --------------------------------------------------

with open(
    METADATA_FILE,
    "rb"
) as file:

    metadata = pickle.load(
        file
    )


print(
    f"Metadata loaded: {len(metadata)} records."
)


# --------------------------------------------------
# Search similar queries
# --------------------------------------------------

def search_similar_queries(
    query,
    top_k=5,
    department=None,
    course=None
):

    # ----------------------------------------------
    # Create query embedding
    # ----------------------------------------------

    query_embedding = model.encode(

        [query],

        convert_to_numpy=True,

        normalize_embeddings=True
    )


    # ----------------------------------------------
    # Search FAISS
    # ----------------------------------------------

    search_k = min(
        max(top_k * 3, top_k),
        index.ntotal
    )


    scores, indices = index.search(

        query_embedding.astype(
            "float32"
        ),

        search_k
    )


    results = []


    # ----------------------------------------------
    # Process results
    # ----------------------------------------------

    for score, index_position in zip(

        scores[0],

        indices[0]
    ):

        if index_position < 0:
            continue


        result = metadata[
            index_position
        ].copy()


        # ------------------------------------------
        # Optional department filtering
        # ------------------------------------------

        if department:

            result_department = str(
                result.get(
                    "department",
                    ""
                )
            ).strip().lower()


            if (
                result_department
                != str(
                    department
                ).strip().lower()
            ):

                continue


        # ------------------------------------------
        # Optional course filtering
        # ------------------------------------------

        if course:

            result_course = str(
                result.get(
                    "course",
                    ""
                )
            ).strip().lower()


            if (
                result_course
                != str(
                    course
                ).strip().lower()
            ):

                continue


        result[
            "similarity"
        ] = float(score)


        results.append(
            result
        )


        if len(results) >= top_k:
            break


    return results