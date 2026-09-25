from collections import Counter
from firebase_admin import firestore


def get_faculty_workloads(db):

    workload_counter = Counter()

    docs = (
        db.collection("queries")
        .where(
            filter=firestore.FieldFilter(
                "status",
                "==",
                "pending"
            )
        )
        .stream()
    )

    for doc in docs:

        data = doc.to_dict()

        faculty_uid = data.get(
            "assignedFacultyId"
        )

        if (
            faculty_uid
            and faculty_uid != "nil"
        ):
            workload_counter[faculty_uid] += 1

    return workload_counter