# DeptConnect - Smart Academic Query Management Portal

An intelligent academic query management platform connecting students, faculty, and administrators with AI-powered query resolution, semantic search, and automated faculty recommendations.

---

## Architecture Overview

```
                   ┌──────────────────────────────────────────┐
                   │           Frontend (Web Client)          │
                   │  (Student, Faculty, Admin Dashboards)    │
                   └────────────────────┬─────────────────────┘
                                        │ HTTP :8000
                                        ▼
                   ┌──────────────────────────────────────────┐
                   │    Semantic Search & RAG AI Service      │
                   │   (FastAPI, Sentence-Transformers, FAISS)│
                   └────────────────────┬─────────────────────┘
                                        │ HTTP :8001
                                        ▼
                   ┌──────────────────────────────────────────┐
                   │      Faculty Recommendation System       │
                   │    (FastAPI, scikit-learn, Firebase)     │
                   └──────────────────────────────────────────┘
```

- **Frontend**: Pure modern client-side web application (HTML5, CSS3, ES Modules, Firebase SDK CDN).
- **Semantic Search AI Service (`AI/semantic_search`)**:
  - FastAPI service on port `8000`.
  - Sentence Transformers (`all-MiniLM-L6-v2`) + FAISS vector search.
  - Cohere LLM for query resolution and automated answer generation.
- **Faculty Recommendation Service (`AI/RecomendationSystem`)**:
  - FastAPI service on port `8001`.
  - Scikit-learn machine learning model for intelligent faculty assignment based on expertise and workload.

---

## Getting Started

### 1. Activate the Virtual Environment

```bash
source .venv/bin/activate
```

### 2. Install Dependencies

All required dependencies are specified in `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 3. Running the AI Services

#### Terminal 1: Faculty Recommendation Service (Port 8001)
```bash
cd AI/RecomendationSystem
uvicorn app:app --host 127.0.0.1 --port 8001 --reload
```

#### Terminal 2: Semantic Search & AI Resolution Service (Port 8000)
```bash
cd AI/semantic_search
uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Running the Frontend

You can serve the web client from the root directory using any local web server:

```bash
# Using Python's built-in HTTP server:
python -m http.server 3000
```
Then open `http://localhost:3000/index.html` in your browser.
