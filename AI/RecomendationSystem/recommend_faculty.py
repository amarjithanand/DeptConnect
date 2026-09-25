import firebase_admin
from firebase_admin import credentials, firestore
import joblib
import pandas as pd

from feature_engineering import calculate_features
from workload import get_faculty_workload


# -----------------------------------
# Firebase initialization
# -----------------------------------

if not firebase_admin._apps:

    cred = credentials.Certificate(
        "serviceAccountKey.json"
    )

    firebase_admin.initialize_app(cred)

db = firestore.client()


# -----------------------------------
# Load trained ML model
# -----------------------------------

model = joblib.load(
    "Model/faculty_recommendation_model.pkl"
)


# -----------------------------------
# Get active faculty
# -----------------------------------

def get_active_faculty():

    faculty_list = []

    docs = (
        db.collection("faculty")
        .where("account_status", "==", True)
        .where("faculty_status", "==", True)
        .stream()
    )

    for doc in docs:

        data = doc.to_dict()

        faculty_list.append({
            "documentId": doc.id,
            "uid": data.get("uid"),
            "facultyId": data.get("facultyId"),
            "name": data.get("name"),
            "department": data.get("department"),
            "designation": data.get("designation"),
            "subjects": data.get("subjects", [])
        })

    return faculty_list


# -----------------------------------
# Get pending queries
# -----------------------------------

def get_pending_queries():

    queries = []

    docs = (
        db.collection("queries")
        .where("status", "==", "pending")
        .stream()
    )

    for doc in docs:

        data = doc.to_dict()

        queries.append({
            "queryId": doc.id,
            "title": data.get("title"),
            "description": data.get("description"),
            "course": data.get("course"),
            "department": data.get("department"),
            "priority": data.get("priority"),
            "assignedFacultyId": data.get(
                "assignedFacultyId"
            )
        })

    return queries


# -----------------------------------
# Recommend faculty for one query
# -----------------------------------

def recommend_faculty(query):

    faculty_list = get_active_faculty()

    recommendations = []

    for faculty in faculty_list:

        # Get REAL workload from Firestore
        assigned_queries = get_faculty_workload(
            db,
            faculty["uid"]
        )

        # Generate ML features
        features = calculate_features(
            query,
            faculty,
            assigned_queries
        )

        # Convert to DataFrame
        input_data = pd.DataFrame([features])

        # ML prediction
        probability = model.predict_proba(
            input_data
        )[0][1]

        recommendations.append({

            "uid": faculty["uid"],

            "facultyId": faculty["facultyId"],

            "name": faculty["name"],

            "department": faculty["department"],

            "designation": faculty["designation"],

            "subjects": faculty["subjects"],

            "assignedQueries": assigned_queries,

            "probability": float(probability)
        })


    # -----------------------------------
    # Rank faculty
    # -----------------------------------

    recommendations.sort(
        key=lambda x: x["probability"],
        reverse=True
    )

    return recommendations

def assign_faculty(query_id, faculty):

    query_ref = db.collection("queries").document(query_id)

    query_ref.update({
        "assignedFacultyId": faculty["uid"]
    })

    print(
        f"\nQuery {query_id} assigned to "
        f"{faculty['name']}"
    )


# -----------------------------------
# Test with pending query
# -----------------------------------
queries = get_pending_queries()

if not queries:

    print("No pending queries found.")

else:

    query = queries[0]

    print("\nStudent Query:")
    print(query)

    results = recommend_faculty(query)

    if not results:

        print("No suitable faculty found.")

    else:

        # Highest probability faculty
        selected_faculty = results[0]

        print("\nSelected Faculty:")
        print(
            f"{selected_faculty['name']} | "
            f"Probability: "
            f"{selected_faculty['probability']:.4f} | "
            f"Workload: "
            f"{selected_faculty['assignedQueries']}"
        )

        # Actually assign faculty in Firestore
        assign_faculty(
            query["queryId"],
            selected_faculty
        )