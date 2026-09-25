import os
from pathlib import Path

import joblib
import pandas as pd

import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from firebase_admin import auth

from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Depends
from fastapi.security import HTTPBearer
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from feature_engineering import calculate_features
from workload import get_faculty_workloads


# =========================================================
# Paths
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = (
    BASE_DIR
    / "Model"
    / "faculty_recommendation_model.pkl"
)

SERVICE_ACCOUNT_PATH = (
    BASE_DIR
    / "serviceAccountKey.json"
)


# =========================================================
# FastAPI
# =========================================================

app = FastAPI(
    title="DeptConnect Faculty Assignment API",
    description=(
        "ML-based automatic faculty assignment "
        "service for DeptConnect"
    ),
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,

    # Local development frontend origins
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],

    allow_credentials=True,

    allow_methods=[
        "GET",
        "POST",
        "OPTIONS"
    ],

    allow_headers=[
        "Authorization",
        "Content-Type"
    ],
)


# =========================================================
# Firebase Initialization
# =========================================================

if not firebase_admin._apps:

    if not SERVICE_ACCOUNT_PATH.exists():
        raise RuntimeError(
            "serviceAccountKey.json not found."
        )

    credentials_object = (
        credentials.Certificate(
            str(SERVICE_ACCOUNT_PATH)
        )
    )

    firebase_admin.initialize_app(
        credentials_object
    )


db = firestore.client()


# =========================================================
# Load ML Model
# =========================================================

if not MODEL_PATH.exists():
    raise RuntimeError(
        f"Model not found: {MODEL_PATH}"
    )


model = joblib.load(
    MODEL_PATH
)


print(
    "Faculty recommendation model loaded successfully!"
)

print(
    "Firebase Admin connected successfully!"
)


# =========================================================
# Authentication
# =========================================================

security = HTTPBearer()


def verify_firebase_token(
    credentials_data: HTTPAuthorizationCredentials =
        Depends(security)
):

    token = credentials_data.credentials

    try:

        decoded_token = auth.verify_id_token(
            token
        )

        return decoded_token

    except Exception:

        raise HTTPException(
            status_code=401,
            detail="Invalid Firebase authentication token"
        )


# =========================================================
# Request Model
# =========================================================

class AssignmentRequest(BaseModel):

    queryId: str


# =========================================================
# Health Check
# =========================================================

@app.get("/")
def home():

    return {
        "service":
            "DeptConnect Faculty Assignment API",

        "status":
            "running",

        "model":
            "loaded"
    }


# =========================================================
# Get Active Faculty
# =========================================================

def get_active_faculty():

    faculty_list = []

    docs = (
        db.collection("faculty")

        .where(
            filter=firestore.FieldFilter(
                "account_status",
                "==",
                True
            )
        )

        .where(
            filter=firestore.FieldFilter(
                "faculty_status",
                "==",
                True
            )
        )

        .stream()
    )

    for doc in docs:

        data = doc.to_dict()

        faculty_list.append({

            "documentId":
                doc.id,

            "uid":
                data.get("uid"),

            "facultyId":
                data.get("facultyId"),

            "name":
                data.get("name"),

            "email":
                data.get("email"),

            "department":
                data.get("department"),

            "designation":
                data.get("designation"),

            "subjects":
                data.get("subjects", [])

        })

    return faculty_list


# =========================================================
# Get Query
# =========================================================
# =========================================================
# Get Query
# =========================================================

def get_query(query_id):

    # Create reference to the query document
    query_ref = (
        db.collection("queries")
        .document(query_id)
    )

    # Read the document from Firestore
    snapshot = query_ref.get()

    # Check whether the query exists
    if not snapshot.exists:

        print(
            f"ERROR: Query not found in Firestore: {query_id}"
        )

        raise HTTPException(
            status_code=404,
            detail=f"Query not found: {query_id}"
        )

    # Convert Firestore document to dictionary
    data = snapshot.to_dict()

    # Add the Firestore document ID
    data["queryId"] = query_id

    # Debug information
    print(
        "Query successfully loaded:"
    )

    print(
        "Query ID:",
        query_id
    )

    print(
        "Student UID:",
        data.get("uid")
    )

    print(
        "Department:",
        data.get("department")
    )

    print(
        "Course:",
        data.get("course")
    )

    print(
        "Status:",
        data.get("status")
    )

    print(
        "Assigned Faculty:",
        data.get("assignedFacultyId")
    )

    return data
# =========================================================
# Faculty Assignment
# =========================================================

@app.post("/assign-faculty")
def assign_faculty(

    request: AssignmentRequest,

    current_user: dict = Depends(
        verify_firebase_token
    )

):

    query_id = request.queryId


    # -----------------------------------------------------
    # 1. Read query
    # -----------------------------------------------------

    query = get_query(
        query_id
    )


    # -----------------------------------------------------
    # 2. Verify student ownership
    # -----------------------------------------------------

    query_uid = query.get(
        "uid"
    )

    if query_uid != current_user.get(
        "uid"
    ):

        raise HTTPException(
            status_code=403,
            detail=(
                "You are not authorized "
                "to assign this query"
            )
        )


    # -----------------------------------------------------
    # 3. Check query status
    # -----------------------------------------------------

    if query.get("status") != "pending":

        return {

            "success": False,

            "message":
                "Query is not pending",

            "queryId":
                query_id,

            "assignedFacultyId":
                query.get(
                    "assignedFacultyId"
                )
        }


    # -----------------------------------------------------
    # 4. Prevent duplicate assignment
    # -----------------------------------------------------

    existing_faculty = query.get(
        "assignedFacultyId"
    )

    if (
        existing_faculty
        and existing_faculty != "nil"
    ):

        return {

            "success": True,

            "message":
                "Query already assigned",

            "queryId":
                query_id,

            "assignedFacultyId":
                existing_faculty
        }


    # -----------------------------------------------------
    # 5. Get active faculty
    # -----------------------------------------------------

    faculty_list = (
        get_active_faculty()
    )


    # -----------------------------------------------------
    # 6. Same department only
    # -----------------------------------------------------

    query_department = (
        query.get("department", "")
        .strip()
        .lower()
    )


    eligible_faculty = [

        faculty

        for faculty in faculty_list

        if (
            faculty.get("department", "")
            .strip()
            .lower()
            ==
            query_department
        )

    ]


    if not eligible_faculty:

        raise HTTPException(
            status_code=404,
            detail=(
                "No active faculty found "
                "for this department"
            )
        )


    # -----------------------------------------------------
    # 7. Get workload ONCE
    # -----------------------------------------------------

    workloads = (
        get_faculty_workloads(db)
    )


    # -----------------------------------------------------
    # 8. Evaluate every faculty
    # -----------------------------------------------------

    recommendations = []


    for faculty in eligible_faculty:

        faculty_uid = faculty.get(
            "uid"
        )


        assigned_queries = workloads.get(
            faculty_uid,
            0
        )


        # -----------------------------------------------
        # Generate model features
        # -----------------------------------------------

        features = calculate_features(

            query,

            faculty,

            assigned_queries

        )


        # -----------------------------------------------
        # Convert to DataFrame
        # -----------------------------------------------

        input_data = pd.DataFrame(
            [features]
        )


        # -----------------------------------------------
        # ML prediction
        # -----------------------------------------------

        probability = (

            model.predict_proba(
                input_data
            )[0][1]

        )


        recommendations.append({

            "uid":
                faculty_uid,

            "facultyId":
                faculty.get("facultyId"),

            "name":
                faculty.get("name"),

            "department":
                faculty.get("department"),

            "designation":
                faculty.get("designation"),

            "subjects":
                faculty.get("subjects", []),

            "assignedQueries":
                assigned_queries,

            "probability":
                float(probability)

        })


    # -----------------------------------------------------
    # 9. Rank faculty
    # -----------------------------------------------------

    recommendations.sort(

        key=lambda faculty:
            faculty["probability"],

        reverse=True

    )


    if not recommendations:

        raise HTTPException(
            status_code=404,
            detail="No faculty recommendations found"
        )


    # -----------------------------------------------------
    # 10. Select faculty
    # -----------------------------------------------------

    selected = recommendations[0]


    # -----------------------------------------------------
    # 11. Update Firestore
    # -----------------------------------------------------

    query_ref = (

        db.collection("queries")
        .document(query_id)

    )


    query_ref.update({

        "assignedFacultyId":
            selected["uid"],

        "assignmentConfidence":
            selected["probability"],

        "assignmentMethod":
            "ML",

        "assignmentStatus":
            "assigned"

    })


    # -----------------------------------------------------
    # 12. Return result
    # -----------------------------------------------------

    return {

        "success":
            True,

        "message":
            "Faculty assigned successfully",

        "queryId":
            query_id,

        "assignedFaculty": {

            "uid":
                selected["uid"],

            "facultyId":
                selected["facultyId"],

            "name":
                selected["name"],

            "department":
                selected["department"],

            "designation":
                selected["designation"]

        },

        "confidence":
            selected["probability"],

        "workload":
            selected["assignedQueries"]

    }