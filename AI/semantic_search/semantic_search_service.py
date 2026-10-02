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

MODEL_NAME = (
    "sentence-transformers/"
    "all-MiniLM-L6-v2"
)


# =========================================================
# LOAD SENTENCE TRANSFORMER
# =========================================================

print(
    "Loading Sentence Transformer..."
)

model = SentenceTransformer(
    MODEL_NAME
)

print(
    "Sentence Transformer loaded."
)


# =========================================================
# GLOBAL FAISS OBJECTS
# =========================================================

index = None
metadata = []


# =========================================================
# LOAD / RELOAD FAISS INDEX
# =========================================================

def reload_index():

    global index
    global metadata


    # -----------------------------------------------------
    # Check FAISS index
    # -----------------------------------------------------

    if not os.path.exists(
        INDEX_FILE
    ):

        raise FileNotFoundError(
            f"FAISS index not found: {INDEX_FILE}"
        )


    # -----------------------------------------------------
    # Check metadata
    # -----------------------------------------------------

    if not os.path.exists(
        METADATA_FILE
    ):

        raise FileNotFoundError(
            f"Metadata file not found: {METADATA_FILE}"
        )


    # -----------------------------------------------------
    # Load FAISS index
    # -----------------------------------------------------

    print(
        "\nLoading FAISS index..."
    )


    index = faiss.read_index(
        INDEX_FILE
    )


    print(
        f"FAISS loaded: "
        f"{index.ntotal} vectors."
    )


    # -----------------------------------------------------
    # Load metadata
    # -----------------------------------------------------

    with open(
        METADATA_FILE,
        "rb"
    ) as file:

        metadata = pickle.load(
            file
        )


    print(
        f"Metadata loaded: "
        f"{len(metadata)} records."
    )


    # -----------------------------------------------------
    # Validate index and metadata
    # -----------------------------------------------------

    if index.ntotal != len(metadata):

        raise RuntimeError(
            "FAISS index and metadata count do not match. "
            f"Index vectors: {index.ntotal}, "
            f"Metadata records: {len(metadata)}"
        )


    print(
        "FAISS index reload completed."
    )


# =========================================================
# INITIAL LOAD
# =========================================================

reload_index()


# =========================================================
# SEARCH SIMILAR QUERIES
# =========================================================

def search_similar_queries(
    query,
    top_k=5,
    department=None,
    course=None
):

    # -----------------------------------------------------
    # Make sure index is available
    # -----------------------------------------------------

    if index is None:

        raise RuntimeError(
            "FAISS index is not loaded."
        )


    if index.ntotal == 0:

        return []


    # -----------------------------------------------------
    # Create query embedding
    # -----------------------------------------------------

    query_embedding = model.encode(

        [query],

        convert_to_numpy=True,

        normalize_embeddings=True

    )


    # -----------------------------------------------------
    # Determine number of vectors to search
    # -----------------------------------------------------

    search_k = min(

        max(
            top_k * 3,
            top_k
        ),

        index.ntotal

    )


    # -----------------------------------------------------
    # Search FAISS
    # -----------------------------------------------------

    scores, indices = index.search(

        query_embedding.astype(
            "float32"
        ),

        search_k

    )


    results = []


    # -----------------------------------------------------
    # Process search results
    # -----------------------------------------------------

    for score, index_position in zip(

        scores[0],

        indices[0]

    ):

        # -------------------------------------------------
        # Ignore invalid FAISS positions
        # -------------------------------------------------

        if index_position < 0:

            continue


        # -------------------------------------------------
        # Get metadata
        # -------------------------------------------------

        result = metadata[
            index_position
        ].copy()


        # -------------------------------------------------
        # Department filtering
        # -------------------------------------------------

        if department:

            result_department = str(

                result.get(
                    "department",
                    ""
                )

            ).strip().lower()


            requested_department = str(

                department

            ).strip().lower()


            if (
                result_department
                != requested_department
            ):

                continue


        # -------------------------------------------------
        # Course filtering
        # -------------------------------------------------

        if course:

            result_course = str(

                result.get(
                    "course",
                    ""
                )

            ).strip().lower()


            requested_course = str(

                course

            ).strip().lower()


            if (
                result_course
                != requested_course
            ):

                continue


        # -------------------------------------------------
        # Add similarity score
        # -------------------------------------------------

        result[
            "similarity"
        ] = float(
            score
        )


        # -------------------------------------------------
        # Add result
        # -------------------------------------------------

        results.append(
            result
        )


        # -------------------------------------------------
        # Stop when enough results are collected
        # -------------------------------------------------

        if len(results) >= top_k:

            break


    return results