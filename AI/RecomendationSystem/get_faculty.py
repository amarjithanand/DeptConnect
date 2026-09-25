import firebase_admin
from firebase_admin import credentials, firestore

# Firebase initialization
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()


def get_active_faculty():
    faculty_list = []

    docs = db.collection("faculty") \
             .where("account_status", "==", True) \
             .where("faculty_status", "==", True) \
             .stream()

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


faculty = get_active_faculty()

print(f"Active faculty count: {len(faculty)}")

for f in faculty:
    print("\nFaculty:")
    print(f)