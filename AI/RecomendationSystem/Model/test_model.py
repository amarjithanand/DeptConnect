import joblib
import pandas as pd

model = joblib.load("faculty_recommendation_model.pkl")

test_data = pd.DataFrame([{
    "query_subject": "Data Science",
    "faculty_department": "MCA",
    "faculty_designation": "Assistant Professor",
    "subject_match": 1,
    "department_match": 1,
    "designation_score": 0.70,
    "assigned_queries": 2,
    "workload_score": 0.8667
}])

prediction = model.predict(test_data)[0]
probability = model.predict_proba(test_data)[0][1]

print("Suitable:", prediction)
print("Suitability Probability:", probability)