def calculate_features(query, faculty, assigned_queries):

    # --------------------------------------------------
    # Query subject
    # --------------------------------------------------

    query_subject = (
        query.get("course", "")
        .strip()
        .lower()
    )


    # --------------------------------------------------
    # Faculty subjects
    # --------------------------------------------------

    faculty_subjects = [
        str(subject).strip().lower()
        for subject in faculty.get("subjects", [])
    ]


    # --------------------------------------------------
    # Subject match
    # --------------------------------------------------

    subject_match = int(
        query_subject in faculty_subjects
    )


    # --------------------------------------------------
    # Department match
    # --------------------------------------------------

    query_department = (
        query.get("department", "")
        .strip()
        .lower()
    )

    faculty_department = (
        faculty.get("department", "")
        .strip()
        .lower()
    )

    department_match = int(
        query_department == faculty_department
    )


    # --------------------------------------------------
    # Designation score
    # --------------------------------------------------

    designation_scores = {

        "professor": 1.0,

        "associate professor": 0.85,

        "assistant professor": 0.70,

        "lecturer": 0.55
    }

    designation = (
        faculty.get("designation", "")
        .strip()
        .lower()
    )

    designation_score = designation_scores.get(
        designation,
        0.50
    )


    # --------------------------------------------------
    # Workload score
    # --------------------------------------------------

    MAX_WORKLOAD = 15

    workload_score = max(
        0,
        1 - assigned_queries / MAX_WORKLOAD
    )


    # --------------------------------------------------
    # Return model features
    # --------------------------------------------------

    return {

        "query_subject":
            query.get("course", ""),

        "faculty_department":
            faculty.get("department", ""),

        "faculty_designation":
            faculty.get("designation", ""),

        "subject_match":
            subject_match,

        "department_match":
            department_match,

        "designation_score":
            designation_score,

        "assigned_queries":
            assigned_queries,

        "workload_score":
            workload_score
    }