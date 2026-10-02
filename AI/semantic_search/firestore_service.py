import firebase_admin

from firebase_admin import credentials
from firebase_admin import firestore


# =========================================================
# FIREBASE CONFIGURATION
# =========================================================

SERVICE_ACCOUNT_FILE = "serviceAccountKey.json"


if not firebase_admin._apps:

    cred = credentials.Certificate(
        SERVICE_ACCOUNT_FILE
    )

    firebase_admin.initialize_app(
        cred
    )


db = firestore.client()


# =========================================================
# GET QUERY
# =========================================================

def get_query(query_id):

    query_ref = (
        db.collection("queries")
        .document(query_id)
    )

    query_snapshot = query_ref.get()

    if not query_snapshot.exists:

        return None

    data = query_snapshot.to_dict()

    # Add Firestore document ID
    data["document_id"] = (
        query_snapshot.id
    )

    return data


# =========================================================
# GET RESPONSE
# =========================================================

def get_response(response_id):

    response_ref = (
        db.collection("responses")
        .document(response_id)
    )

    response_snapshot = (
        response_ref.get()
    )

    if not response_snapshot.exists:

        return None

    data = (
        response_snapshot.to_dict()
    )

    # Add Firestore document ID
    data["document_id"] = (
        response_snapshot.id
    )

    return data


# =========================================================
# MARK AI PROCESSED
# =========================================================

def mark_ai_processed(
    query_id,
    ai_answered,
    ai_confidence,
    similar_query_id
):

    query_ref = (
        db.collection("queries")
        .document(query_id)
    )

    query_ref.update({

        "aiProcessed":
            True,

        "aiAnswered":
            ai_answered,

        "aiConfidence":
            ai_confidence,

        "similiarQueryId":
            similar_query_id

    })


# =========================================================
# SAVE AI RESPONSE
# =========================================================

def save_ai_response(
    query_data,
    ai_answer,
    similarity_score,
    source_response
):

    response_data = {

        # =================================================
        # ORIGINAL QUERY INFORMATION
        # =================================================

        "queryId":
            query_data.get(
                "document_id"
            ),

        "studentId":
            query_data.get(
                "studentId"
            ),

        "studentUid":
            query_data.get(
                "uid"
            ),

        "queryTitle":
            query_data.get(
                "title"
            ),

        "queryDescription":
            query_data.get(
                "description"
            ),

        "course":
            query_data.get(
                "course"
            ),

        "department":
            query_data.get(
                "department"
            ),

        "priority":
            query_data.get(
                "priority"
            ),


        # =================================================
        # AI RESPONSE
        # =================================================

        "response":
            ai_answer,

        "responseType":
            "AI",

        "respondedBy":
            "AI",

        "aiGenerated":
            True,


        # =================================================
        # AI INFORMATION
        # =================================================

        "similarityScore":
            similarity_score,

        "sourceResponseId":
            (
                source_response.get(
                    "document_id"
                )
                if source_response
                else None
            ),

        "sourceQueryId":
            (
                source_response.get(
                    "queryId"
                )
                if source_response
                else None
            ),


        # =================================================
        # AI ACTS AS RESPONSE PROVIDER
        # =================================================

        "facultyId":
            "AI",

        "facultyName":
            "DeptConnect AI",

        "uid":
            "AI",


        # =================================================
        # RESPONSE STATUS
        # =================================================

        "status":
            "resolved",

        "respondedAt":
            firestore.SERVER_TIMESTAMP

    }


    # =====================================================
    # CREATE RESPONSE DOCUMENT
    # =====================================================

    response_ref = (
        db.collection("responses")
        .add(
            response_data
        )
    )

    return response_ref


# =========================================================
# UPDATE QUERY STATUS
# =========================================================

def update_query_status(
    query_id,
    status,
    extra_data=None
):

    query_ref = (
        db.collection("queries")
        .document(query_id)
    )

    update_data = {

        "status":
            status

    }

    # Add additional fields if provided
    if extra_data:

        update_data.update(
            extra_data
        )

    query_ref.update(
        update_data
    )