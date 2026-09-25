import firebase_admin
from firebase_admin import credentials, firestore

# Firebase initialization
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()


def get_pending_queries():

    queries = []

    docs = db.collection("queries") \
             .where("status", "==", "pending") \
             .stream()

    for doc in docs:

        data = doc.to_dict()

        queries.append({
            "queryId": doc.id,
            "title": data.get("title"),
            "description": data.get("description"),
            "course": data.get("course"),
            "department": data.get("department"),
            "priority": data.get("priority"),
            "assignedFacultyId": data.get("assignedFacultyId"),
            "studentId": data.get("studentId"),
            "uid": data.get("uid")
        })

    return queries


queries = get_pending_queries()

print(f"Pending queries: {len(queries)}")

for query in queries:

    print("\nQuery:")
    print("ID:", query["queryId"])
    print("Title:", query["title"])
    print("Description:", query["description"])
    print("Course:", query["course"])
    print("Department:", query["department"])
    print("Priority:", query["priority"])
    print("Assigned Faculty:", query["assignedFacultyId"])