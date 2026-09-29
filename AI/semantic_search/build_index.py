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

    firebase_admin.initialize_app(cred)


db = firestore.client()


# =========================================================
# LOAD MODEL
# =========================================================

print("\nLoading Sentence Transformer...")

model = SentenceTransformer(
    MODEL_NAME
)

print("Model loaded.")


# =========================================================
# CREATE INDEX DIRECTORY
# =========================================================

os.makedirs(
    INDEX_FOLDER,
    exist_ok=True
)


# =========================================================
# READ RESPONSE COLLECTION
# =========================================================

print("\nReading resolved responses from Firestore...")

responses_ref = db.collection("response")

documents = responses_ref.stream()


search_texts = []

metadata = []


for document in documents:

    data = document.to_dict()


    # -----------------------------------------------------
    # ONLY RESOLVED RESPONSES
    # -----------------------------------------------------

    if data.get("status") != "resolved":
        continue


    query_title = str(
        data.get("queryTitle", "")
    ).strip()


    query_description = str(
        data.get("queryDescription", "")
    ).strip()


    response = str(
        data.get("response", "")
    ).strip()


    course = str(
        data.get("course", "")
    ).strip()


    department = str(
        data.get("department", "")
    ).strip()


    # -----------------------------------------------------
    # CREATE SEARCHABLE TEXT
    # -----------------------------------------------------

    text = f"""
Course: {course}

Department: {department}

Question: {query_title}

Description: {query_description}

Faculty Answer: {response}
""".strip()


    # Don't index completely empty records

    if not (
        query_title
        or query_description
        or response
    ):
        continue


    search_texts.append(text)


    # -----------------------------------------------------
    # STORE METADATA
    # -----------------------------------------------------

    metadata.append({

        "document_id": document.id,

        "queryId":
            data.get("queryId"),

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
            data.get("facultyId"),

        "facultyName":
            data.get("facultyName"),

        "studentId":
            data.get("studentId"),

        "priority":
            data.get("priority"),

        "status":
            data.get("status"),

        "respondedAt":
            data.get("respondedAt")

    })


print(
    f"Found {len(search_texts)} resolved responses."
)


# =========================================================
# STOP IF NOTHING FOUND
# =========================================================

if len(search_texts) == 0:

    print(
        "No resolved responses available for indexing."
    )

    exit()


# =========================================================
# CREATE EMBEDDINGS
# =========================================================

print("\nCreating embeddings...")

embeddings = model.encode(
    search_texts,
    convert_to_numpy=True,
    normalize_embeddings=True,
    show_progress_bar=True
)


print(
    "Embedding shape:",
    embeddings.shape
)


# =========================================================
# CREATE FAISS INDEX
# =========================================================

dimension = embeddings.shape[1]


print(
    f"\nCreating FAISS index with dimension {dimension}..."
)


# Inner Product on normalized vectors
# is equivalent to cosine similarity.

index = faiss.IndexFlatIP(
    dimension
)


index.add(
    embeddings.astype("float32")
)


print(
    f"FAISS index contains {index.ntotal} vectors."
)


# =========================================================
# SAVE INDEX
# =========================================================

faiss.write_index(
    index,
    INDEX_FILE
)


# =========================================================
# SAVE METADATA
# =========================================================

with open(
    METADATA_FILE,
    "wb"
) as file:

    pickle.dump(
        metadata,
        file
    )


print("\n========================================")
print("FAISS INDEX CREATED SUCCESSFULLY")
print("========================================")

print(
    f"Index: {INDEX_FILE}"
)

print(
    f"Metadata: {METADATA_FILE}"
)

print(
    f"Documents indexed: {index.ntotal}"
)