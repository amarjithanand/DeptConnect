import os
import pickle

import faiss

from sentence_transformers import SentenceTransformer


# =========================================================
# CONFIGURATION
# =========================================================

INDEX_FOLDER = "faiss_index"

INDEX_FILE = os.path.join(
    INDEX_FOLDER,
    "responses.index"
)

METADATA_FILE = os.path.join(
    INDEX_FOLDER,
    "metadata.pkl"
)

MODEL_NAME = (
    "sentence-transformers/"
    "all-MiniLM-L6-v2"
)


# =========================================================
# LOAD SENTENCE TRANSFORMER
# =========================================================

print("\n========================================")
print("LOADING SENTENCE TRANSFORMER")
print("========================================")

model = SentenceTransformer(
    MODEL_NAME
)

print(
    "Sentence Transformer loaded successfully."
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


    print("\n========================================")
    print("LOADING FAISS INDEX")
    print("========================================")


    # =====================================================
    # CHECK INDEX FILE
    # =====================================================

    if not os.path.exists(
        INDEX_FILE
    ):

        raise FileNotFoundError(
            f"FAISS index not found: "
            f"{INDEX_FILE}\n"
            f"Run 'python build_index.py' "
            f"to create the initial index."
        )


    # =====================================================
    # CHECK METADATA FILE
    # =====================================================

    if not os.path.exists(
        METADATA_FILE
    ):

        raise FileNotFoundError(
            f"Metadata file not found: "
            f"{METADATA_FILE}\n"
            f"Run 'python build_index.py' "
            f"to create the initial metadata."
        )


    # =====================================================
    # LOAD FAISS INDEX
    # =====================================================

    print(
        "\nReading FAISS index..."
    )

    loaded_index = faiss.read_index(
        INDEX_FILE
    )


    # =====================================================
    # LOAD METADATA
    # =====================================================

    print(
        "Reading metadata..."
    )

    with open(
        METADATA_FILE,
        "rb"
    ) as file:

        loaded_metadata = pickle.load(
            file
        )


    # =====================================================
    # VALIDATE METADATA
    # =====================================================

    if not isinstance(
        loaded_metadata,
        list
    ):

        raise RuntimeError(
            "Invalid metadata format. "
            "Expected a list."
        )


    # =====================================================
    # VALIDATE INDEX / METADATA COUNT
    # =====================================================

    if (
        loaded_index.ntotal
        != len(loaded_metadata)
    ):

        raise RuntimeError(

            "FAISS index and metadata "
            "count do not match.\n"

            f"FAISS vectors: "
            f"{loaded_index.ntotal}\n"

            f"Metadata records: "
            f"{len(loaded_metadata)}"
        )


    # =====================================================
    # UPDATE GLOBAL OBJECTS
    # =====================================================

    index = loaded_index

    metadata = loaded_metadata


    # =====================================================
    # SUCCESS
    # =====================================================

    print(
        f"\nFAISS vectors loaded: "
        f"{index.ntotal}"
    )

    print(
        f"Metadata records loaded: "
        f"{len(metadata)}"
    )

    print(
        "\nFAISS index loaded successfully."
    )

    print(
        "========================================"
    )


# =========================================================
# INITIAL LOAD
# =========================================================
#
# FastAPI imports this module.
#
# The FAISS index is loaded ONCE when the
# application starts.
#
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

    global index
    global metadata


    # =====================================================
    # VALIDATE INDEX
    # =====================================================

    if index is None:

        raise RuntimeError(
            "FAISS index is not loaded."
        )


    # =====================================================
    # EMPTY INDEX
    # =====================================================

    if index.ntotal == 0:

        print(
            "\nFAISS index is empty."
        )

        return []


    # =====================================================
    # VALIDATE METADATA
    # =====================================================

    if len(metadata) != index.ntotal:

        raise RuntimeError(

            "FAISS index and metadata "
            "are out of sync.\n"

            f"FAISS vectors: "
            f"{index.ntotal}\n"

            f"Metadata records: "
            f"{len(metadata)}"
        )


    # =====================================================
    # CLEAN QUERY
    # =====================================================

    query = str(
        query
    ).strip()


    if not query:

        return []


    # =====================================================
    # CREATE QUERY EMBEDDING
    # =====================================================

    print(
        "\nCreating query embedding..."
    )


    query_embedding = model.encode(

        [query],

        convert_to_numpy=True,

        normalize_embeddings=True

    )


    query_embedding = (
        query_embedding
        .astype("float32")
    )


    # =====================================================
    # SEARCH ALL FAISS VECTORS
    # =====================================================
    #
    # We search all vectors first and then apply
    # department/course filters.
    #
    # This prevents relevant results from being
    # accidentally excluded by an arbitrary top-N
    # search window.
    #
    # =====================================================

    search_k = index.ntotal


    print(
        f"Searching FAISS across "
        f"{search_k} indexed responses..."
    )


    scores, indices = index.search(

        query_embedding,

        search_k

    )


    results = []


    # =====================================================
    # NORMALIZE DEPARTMENT FILTER
    # =====================================================

    requested_department = None


    if department:

        requested_department = (

            str(department)
            .strip()
            .lower()

        )


    # =====================================================
    # NORMALIZE COURSE FILTER
    # =====================================================

    requested_course = None


    if course:

        requested_course = (

            str(course)
            .strip()
            .lower()

        )


    # =====================================================
    # PROCESS SEARCH RESULTS
    # =====================================================

    for score, index_position in zip(

        scores[0],

        indices[0]

    ):


        # =================================================
        # INVALID FAISS POSITION
        # =================================================

        if index_position < 0:

            continue


        # =================================================
        # SAFETY CHECK
        # =================================================

        if (
            index_position
            >= len(metadata)
        ):

            continue


        # =================================================
        # GET METADATA
        # =================================================

        result = metadata[
            index_position
        ].copy()


        # =================================================
        # DEPARTMENT FILTER
        # =================================================

        if requested_department:

            result_department = (

                str(
                    result.get(
                        "department",
                        ""
                    )
                )
                .strip()
                .lower()

            )


            if (
                result_department
                != requested_department
            ):

                continue


        # =================================================
        # COURSE FILTER
        # =================================================

        if requested_course:

            result_course = (

                str(
                    result.get(
                        "course",
                        ""
                    )
                )
                .strip()
                .lower()

            )


            if (
                result_course
                != requested_course
            ):

                continue


        # =================================================
        # ADD SIMILARITY SCORE
        # =================================================

        result["similarity"] = float(
            score
        )


        # =================================================
        # ADD RESULT
        # =================================================

        results.append(
            result
        )


        # =================================================
        # STOP WHEN TOP-K FILTERED RESULTS FOUND
        # =================================================

        if len(results) >= top_k:

            break


    # =====================================================
    # DEBUG INFORMATION
    # =====================================================

    print(
        f"Matching results after filters: "
        f"{len(results)}"
    )


    if results:

        print(
            "\n========================================"
        )

        print(
            "TOP SEMANTIC RESULT"
        )

        print(
            "========================================"
        )

        print(
            f"Similarity: "
            f"{results[0].get('similarity', 0):.4f}"
        )

        print(
            f"Question: "
            f"{results[0].get('queryTitle', '')}"
        )

        print(
            f"Department: "
            f"{results[0].get('department', '')}"
        )

        print(
            f"Course: "
            f"{results[0].get('course', '')}"
        )

        print(
            "========================================"
        )


    else:

        print(
            "\nNo matching results found "
            "after department/course filtering."
        )


    return results