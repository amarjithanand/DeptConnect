import os
import pickle

import faiss
import firebase_admin

from firebase_admin import credentials
from firebase_admin import firestore

from sentence_transformers import SentenceTransformer


# =========================================================
# CONFIGURATION
# =========================================================

SERVICE_ACCOUNT_FILE = "serviceAccountKey.json"

INDEX_FOLDER = "faiss_index"

INDEX_FILE = os.path.join(
    INDEX_FOLDER,
    "responses.index"
)

METADATA_FILE = os.path.join(
    INDEX_FOLDER,
    "metadata.pkl"
)

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


# =========================================================
# FIREBASE INITIALIZATION
# =========================================================

if not firebase_admin._apps:

    cred = credentials.Certificate(
        SERVICE_ACCOUNT_FILE
    )

    firebase_admin.initialize_app(
        cred
    )


db = firestore.client()


# =========================================================
# LOAD SENTENCE TRANSFORMER
# =========================================================

print("\nLoading Sentence Transformer...")

model = SentenceTransformer(
    MODEL_NAME
)

print("Sentence Transformer loaded.")


# =========================================================
# HELPER
# CREATE SEARCHABLE TEXT
# =========================================================

def create_search_text(data):

    query_title = str(
        data.get(
            "queryTitle",
            ""
        )
    ).strip()

    query_description = str(
        data.get(
            "queryDescription",
            ""
        )
    ).strip()

    response = str(
        data.get(
            "response",
            ""
        )
    ).strip()

    course = str(
        data.get(
            "course",
            ""
        )
    ).strip()

    department = str(
        data.get(
            "department",
            ""
        )
    ).strip()


    text = f"""
Course: {course}

Department: {department}

Question: {query_title}

Description: {query_description}

Faculty Answer: {response}
""".strip()


    return text


# =========================================================
# HELPER
# CREATE METADATA
# =========================================================

def create_metadata(
    document_id,
    data
):

    query_title = str(
        data.get(
            "queryTitle",
            ""
        )
    ).strip()

    query_description = str(
        data.get(
            "queryDescription",
            ""
        )
    ).strip()

    response = str(
        data.get(
            "response",
            ""
        )
    ).strip()

    course = str(
        data.get(
            "course",
            ""
        )
    ).strip()

    department = str(
        data.get(
            "department",
            ""
        )
    ).strip()


    return {

        "document_id":
            document_id,

        "queryId":
            data.get(
                "queryId"
            ),

        "queryTitle":
            query_title,

        "queryDescription":
            query_description,

        "response":
            response,

        "course":
            course,

        "department":
            department,

        "facultyId":
            data.get(
                "facultyId"
            ),

        "facultyName":
            data.get(
                "facultyName"
            ),

        "studentId":
            data.get(
                "studentId"
            ),

        "priority":
            data.get(
                "priority"
            ),

        "status":
            data.get(
                "status"
            ),

        "respondedAt":
            data.get(
                "respondedAt"
            )

    }


# =========================================================
# FULL FAISS INDEX BUILD
# =========================================================
#
# Used for:
#
# 1. First-time index creation
# 2. Rebuilding the complete index
# 3. Recovering a corrupted/missing index
#
# DO NOT call this for every student query.
#
# =========================================================

def build_faiss_index():

    print("\n")
    print("========================================")
    print("STARTING FAISS FULL INDEX BUILD")
    print("========================================")


    # =====================================================
    # CREATE INDEX DIRECTORY
    # =====================================================

    os.makedirs(
        INDEX_FOLDER,
        exist_ok=True
    )


    # =====================================================
    # READ RESPONSE COLLECTION
    # =====================================================

    print(
        "\nReading resolved responses from Firestore..."
    )


    responses_ref = db.collection(
        "responses"
    )

    documents = responses_ref.stream()


    search_texts = []

    metadata = []


    # =====================================================
    # PROCESS RESPONSES
    # =====================================================

    for document in documents:

        data = document.to_dict()


        # -------------------------------------------------
        # ONLY INDEX RESOLVED RESPONSES
        # -------------------------------------------------

        if data.get(
            "status"
        ) != "resolved":

            continue


        # -------------------------------------------------
        # CREATE SEARCH TEXT
        # -------------------------------------------------

        text = create_search_text(
            data
        )


        # -------------------------------------------------
        # SKIP EMPTY RECORDS
        # -------------------------------------------------

        query_title = str(
            data.get(
                "queryTitle",
                ""
            )
        ).strip()

        query_description = str(
            data.get(
                "queryDescription",
                ""
            )
        ).strip()

        response = str(
            data.get(
                "response",
                ""
            )
        ).strip()


        if not (
            query_title
            or query_description
            or response
        ):

            continue


        # -------------------------------------------------
        # STORE SEARCH TEXT
        # -------------------------------------------------

        search_texts.append(
            text
        )


        # -------------------------------------------------
        # STORE METADATA
        # -------------------------------------------------

        metadata.append(
            create_metadata(
                document.id,
                data
            )
        )


    print(
        f"Found {len(search_texts)} "
        f"resolved responses."
    )


    # =====================================================
    # STOP IF NOTHING FOUND
    # =====================================================

    if len(search_texts) == 0:

        print(
            "\nNo resolved responses available "
            "for indexing."
        )

        return False


    # =====================================================
    # CREATE EMBEDDINGS
    # =====================================================

    print(
        "\nCreating embeddings..."
    )


    embeddings = model.encode(

        search_texts,

        convert_to_numpy=True,

        normalize_embeddings=True,

        show_progress_bar=True

    )


    print(
        "\nEmbedding shape:",
        embeddings.shape
    )


    # =====================================================
    # CREATE FAISS INDEX
    # =====================================================

    dimension = embeddings.shape[1]


    print(
        f"\nCreating FAISS index "
        f"with dimension {dimension}..."
    )


    # -----------------------------------------------------
    # IndexFlatIP + normalized embeddings
    #
    # Inner Product becomes cosine similarity
    # -----------------------------------------------------

    index = faiss.IndexFlatIP(
        dimension
    )


    index.add(
        embeddings.astype(
            "float32"
        )
    )


    print(
        f"FAISS index contains "
        f"{index.ntotal} vectors."
    )


    # =====================================================
    # SAVE FAISS INDEX
    # =====================================================

    faiss.write_index(
        index,
        INDEX_FILE
    )


    # =====================================================
    # SAVE METADATA
    # =====================================================

    with open(
        METADATA_FILE,
        "wb"
    ) as file:

        pickle.dump(
            metadata,
            file
        )


    # =====================================================
    # SUCCESS
    # =====================================================

    print(
        "\n========================================"
    )

    print(
        "FAISS FULL INDEX CREATED SUCCESSFULLY"
    )

    print(
        "========================================"
    )

    print(
        f"Index: {INDEX_FILE}"
    )

    print(
        f"Metadata: {METADATA_FILE}"
    )

    print(
        f"Documents indexed: {index.ntotal}"
    )

    print(
        "========================================"
    )


    return True


# =========================================================
# INCREMENTAL FAISS INDEXING
# =========================================================
#
# Adds ONE newly resolved response to the existing
# FAISS index.
#
# This is what we will call automatically when
# a faculty member resolves a query.
#
# =========================================================

def add_response_to_faiss(
    response_id
):

    print("\n")
    print("========================================")
    print("ADDING RESPONSE TO FAISS")
    print("========================================")

    print(
        f"Response ID: {response_id}"
    )


    # =====================================================
    # GET RESPONSE FROM FIRESTORE
    # =====================================================

    response_ref = db.collection(
        "responses"
    ).document(
        response_id
    )


    response_snapshot = response_ref.get()


    if not response_snapshot.exists:

        print(
            "\nResponse document not found."
        )

        return False


    data = response_snapshot.to_dict()


    # =====================================================
    # ONLY INDEX RESOLVED RESPONSES
    # =====================================================

    if data.get(
        "status"
    ) != "resolved":

        print(
            "\nResponse is not resolved."
        )

        return False


    # =====================================================
    # CHECK REQUIRED CONTENT
    # =====================================================

    query_title = str(
        data.get(
            "queryTitle",
            ""
        )
    ).strip()

    query_description = str(
        data.get(
            "queryDescription",
            ""
        )
    ).strip()

    response = str(
        data.get(
            "response",
            ""
        )
    ).strip()


    if not (
        query_title
        or query_description
        or response
    ):

        print(
            "\nResponse contains no searchable content."
        )

        return False


    # =====================================================
    # CHECK WHETHER INDEX EXISTS
    # =====================================================

    if not os.path.exists(
        INDEX_FILE
    ):

        print(
            "\nFAISS index does not exist."
        )

        print(
            "Creating full index first..."
        )


        return build_faiss_index()


    # =====================================================
    # LOAD EXISTING FAISS INDEX
    # =====================================================

    print(
        "\nLoading existing FAISS index..."
    )


    index = faiss.read_index(
        INDEX_FILE
    )


    print(
        f"Current FAISS vectors: "
        f"{index.ntotal}"
    )


    # =====================================================
    # CREATE SEARCH TEXT
    # =====================================================

    search_text = create_search_text(
        data
    )


    # =====================================================
    # CREATE SINGLE EMBEDDING
    # =====================================================

    print(
        "\nCreating embedding for new response..."
    )


    embedding = model.encode(

        [search_text],

        convert_to_numpy=True,

        normalize_embeddings=True

    )


    embedding = embedding.astype(
        "float32"
    )


    # =====================================================
    # VERIFY DIMENSION
    # =====================================================

    if embedding.shape[1] != index.d:

        print(
            "\nEmbedding dimension mismatch."
        )

        print(
            f"FAISS dimension: {index.d}"
        )

        print(
            f"Embedding dimension: "
            f"{embedding.shape[1]}"
        )

        return False


    # =====================================================
    # PREVENT DUPLICATE INDEXING
    # =====================================================

    if os.path.exists(
        METADATA_FILE
    ):

        with open(
            METADATA_FILE,
            "rb"
        ) as file:

            metadata = pickle.load(
                file
            )

    else:

        metadata = []


    # -----------------------------------------------------
    # Check whether this Firestore document is already
    # indexed.
    # -----------------------------------------------------

    for item in metadata:

        if item.get(
            "document_id"
        ) == response_id:

            print(
                "\nResponse is already indexed."
            )

            return True


    # =====================================================
    # ADD VECTOR TO FAISS
    # =====================================================

    index.add(
        embedding
    )


    print(
        f"\nNew FAISS vector added."
    )

    print(
        f"Total vectors: {index.ntotal}"
    )


    # =====================================================
    # ADD METADATA
    # =====================================================

    metadata.append(
        create_metadata(
            response_id,
            data
        )
    )


    # =====================================================
    # SAVE UPDATED FAISS INDEX
    # =====================================================

    faiss.write_index(
        index,
        INDEX_FILE
    )


    # =====================================================
    # SAVE UPDATED METADATA
    # =====================================================

    with open(
        METADATA_FILE,
        "wb"
    ) as file:

        pickle.dump(
            metadata,
            file
        )


    # =====================================================
    # SUCCESS
    # =====================================================

    print(
        "\n========================================"
    )

    print(
        "RESPONSE ADDED TO FAISS SUCCESSFULLY"
    )

    print(
        "========================================"
    )

    print(
        f"Response ID: {response_id}"
    )

    print(
        f"Total indexed responses: "
        f"{index.ntotal}"
    )

    print(
        "========================================"
    )


    return True


# =========================================================
# RUN DIRECTLY
# =========================================================
#
# Running:
#
#     python build_index.py
#
# performs a COMPLETE rebuild.
#
# =========================================================

if __name__ == "__main__":

    build_faiss_index()