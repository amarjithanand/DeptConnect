
# DeptConnect — Smart Academic Query Management Portal

**An AI-powered student–faculty academic query management system using Semantic Search, FAISS, Retrieval-Augmented Generation (RAG), and Large Language Models.**

DeptConnect provides a centralized platform for students to submit, track, and resolve academic queries. Faculty members can manage queries, provide responses, and maintain resolved academic information for future retrieval.

By combining semantic similarity search with AI-assisted response generation, DeptConnect aims to reduce repetitive queries, improve access to existing academic information, and make academic communication more organized and efficient.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [AI Processing Workflow](#ai-processing-workflow)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [System Modules](#system-modules)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Running the Application](#running-the-application)
- [Security Considerations](#security-considerations)
- [Testing](#testing)
- [Limitations](#limitations)
- [Future Enhancements](#future-enhancements)
- [References](#references)

## Overview

Traditional academic query handling often relies on emails, messaging applications, and direct communication with faculty. These methods can make query tracking difficult and result in repeated questions that have already been answered.

DeptConnect addresses these challenges through a centralized web application supported by an AI-based query-processing pipeline.

The system uses **Sentence Transformers** to convert query text into semantic embeddings and **FAISS** to retrieve semantically similar resolved queries. Relevant information is retrieved from the knowledge base and supplied to a Large Language Model (LLM) through a **Retrieval-Augmented Generation (RAG)** workflow.

When a query cannot be reliably resolved using the available information, it can be routed to faculty for further assistance.

## Key Features

- **Centralized Query Management** — Students can submit academic queries, track their status, and view responses.
- **Faculty Query Management** — Faculty members can review assigned queries, provide answers, and manage query resolution.
- **Administrative Management** — Supports management of users and academic information such as departments and subjects.
- **Semantic Search** — Identifies previously resolved queries based on meaning rather than exact keyword matching.
- **FAISS Vector Retrieval** — Searches semantic embeddings to retrieve relevant academic information.
- **RAG-Based Response Generation** — Supplies retrieved knowledge as context to an LLM to generate context-aware responses.
- **AI-Assisted Query Resolution** — Helps answer queries using relevant information from the existing knowledge base.
- **Faculty Escalation** — Queries that cannot be reliably resolved through AI processing can be forwarded for faculty assistance.
- **Knowledge Base Reuse** — Resolved queries and faculty responses can be reused to support future queries.
- **Notifications and Status Tracking** — Supports communication of query updates and responses.

## AI Processing Workflow

```text
Student Submits Academic Query
              |
              v
      Query Preprocessing
              |
              v
  Sentence Transformer Model
              |
              v
       Query Embedding
              |
              v
      FAISS Similarity Search
              |
              v
 Retrieve Similar Resolved Queries
              |
              v
   Retrieve Context from Firestore
              |
              v
    RAG Context Construction
              |
              v
      Large Language Model
              |
              v
     Response Evaluation
              |
       +------+------+
       |             |
       v             v
  AI Response    Faculty Assistance
       |             |
       +------+------+
              |
              v
   Store and Deliver Response
```

### Workflow Explanation

1. A student submits an academic query through the web interface.
2. The query text is converted into a semantic embedding using a Sentence Transformer model.
3. FAISS searches the vector index for similar previously resolved queries.
4. Relevant query records and responses are retrieved from Cloud Firestore.
5. The retrieved information is assembled into context for the RAG workflow.
6. An LLM generates a context-aware response based on the available information.
7. Queries that cannot be reliably resolved are routed to faculty for further assistance.
8. Resolved academic information can be reused by the knowledge retrieval component.

> **Note:** FAISS performs vector similarity search; it is not the primary database. Cloud Firestore stores structured academic data, while the FAISS index supports semantic retrieval.

## System Architecture

DeptConnect follows a modular architecture with four main components:

| Component | Responsibility |
|---|---|
| Web Frontend | User interface, forms, dashboards, query submission, and dynamic content |
| Firebase Backend | Authentication and cloud-based academic data management |
| AI Processing Layer | Embedding generation, semantic retrieval, RAG, and AI-assisted responses |
| API Layer | Communication between the frontend and Python-based AI processing |

The frontend communicates with Firebase for authentication and database operations. AI-related query processing is exposed through a FastAPI endpoint, which connects the web application to the Python-based semantic search and response-generation components.

## Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Web page structure |
| CSS3 | Styling and responsive interface |
| JavaScript (ES6+) | Frontend logic and Firebase integration |
| Python 3.12 | AI processing and semantic search |
| Sentence Transformers | Semantic embedding generation |
| FAISS | Vector similarity search |
| FastAPI | API for AI query processing |
| Firebase Authentication | User authentication |
| Cloud Firestore | NoSQL database |
| RAG | Retrieval-grounded context construction |
| Large Language Model (LLM) | Context-aware response generation |
| Git and GitHub | Version control and source-code management |

## System Modules

### 1. Student Module

- Student registration and authentication
- Academic query submission
- Query status tracking
- Viewing AI-generated or faculty-provided responses
- Accessing notifications and academic information

### 2. Faculty Module

- Faculty registration and authentication
- Access to assigned academic queries
- Query review and response submission
- Query status management
- Maintenance of resolved academic information

### 3. Admin Module

- Administrative dashboard
- Student and faculty management
- Department management
- Subject and course management
- Administrative control over relevant academic data

### 4. AI and Semantic Search Module

- Query embedding generation
- Semantic similarity search using FAISS
- Retrieval of previously resolved queries
- RAG-based context construction
- LLM-assisted response generation
- Routing of queries requiring further assistance

## Database Design

DeptConnect uses **Cloud Firestore**, a NoSQL document database, to store application data.

Major collections used by the application include:

| Collection | Purpose |
|---|---|
| `students` | Student profiles and academic details |
| `faculty` | Faculty profiles and academic information |
| `queries` | Student-submitted academic queries |
| `response` | Query responses and resolved academic information |
| `departments` | Department information |
| `subjects` | Subject and course information |
| `student-notification` | Student notification records |
| `student-notification-status` | Notification read-status tracking |

The exact collection structure and fields should match the actual Firestore implementation.

### Semantic Knowledge Base

Resolved query responses are used to build a searchable knowledge base. The Python semantic search component generates embeddings for relevant text and stores them in a FAISS index.

Associated metadata preserves information needed to identify and retrieve the original Firestore records.

## Project Structure

The repository contains frontend pages, Firebase integration, and Python-based AI modules. The semantic search component is organized as follows:

```text
DeptConnect/
├── AI/
│   ├── RecommendationSystem/
│   │   ├── app.py
│   │   ├── feature_engineering.py
│   │   ├── get_faculty.py
│   │   ├── read_query.py
│   │   ├── recommend_faculty.py
│   │   ├── workload.py
│   │   └── requirements.txt
│   │
│   └── semantic_search/
│       ├── build_index.py
│       ├── search.py
│       ├── requirements.txt
│       └── faiss_index/
│
├── Frontend/
│   ├── HTML files
│   ├── CSS files
│   └── JavaScript files
│
└── README.md
```

*Update this structure to match the actual folder names and files in your repository.*

## Prerequisites

- Python 3.12
- pip
- Git
- A Firebase project configured with Authentication and Cloud Firestore
- A supported LLM provider and API credentials, if required by the AI processing module
- A modern web browser

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/amarjithanand/DeptConnect.git
cd DeptConnect
```

Replace the repository URL if your actual repository uses a different name or URL.

### 2. Set Up the Semantic Search Environment

```bash
cd AI/semantic_search
```

Create a virtual environment:

```bash
py -3.12 -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

On Linux or macOS:

```bash
source .venv/bin/activate
```

Upgrade pip and install dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Firebase Credentials

Configure the Firebase project and the required service-account credentials for the Python backend.

- Place credentials only in the appropriate local backend environment.
- Update credential file paths or environment-variable references as required.
- Never commit service-account private keys to GitHub.
- Configure the frontend Firebase settings for your project where necessary.

### 4. Build the Semantic Index

After configuring Firebase access and installing the required dependencies, run:

```bash
python build_index.py
```

This script retrieves resolved response records, generates semantic embeddings, and creates the FAISS index and associated metadata files.

Rebuild the index when the knowledge base changes and your implementation requires it.

### 5. Configure AI Services

Provide the LLM API credentials required by your implementation through environment variables or another secure backend configuration mechanism.

Never place secret API keys in frontend JavaScript or publish them in the repository.

## Running the Application

### Start the AI Processing API

From the directory containing the FastAPI application, activate the appropriate Python virtual environment and start the API using your actual module name.

For example, if the FastAPI application is defined in `process_query.py`:

```bash
uvicorn process_query:app --reload
```

The documented frontend endpoint is:

```text
/process-query
```

During local development, ensure that the frontend API URL matches the address and port where FastAPI is running.

### Launch the Web Application

Open the frontend through your configured web server or local development server. Ensure that Firebase Authentication, Firestore, and the AI API are configured before testing the complete query workflow.

> The exact startup commands may differ depending on the FastAPI entry point, hosting configuration, and frontend directory structure.

## Security Considerations

- Use Firebase Authentication to authenticate users.
- Enforce role-based authorization through application logic and Firestore Security Rules.
- Restrict database access according to user roles and record ownership.
- Keep service-account credentials and LLM API keys out of public repositories.
- Use environment variables or a secure secrets-management mechanism for backend credentials.
- Never rely on frontend-only checks to protect sensitive database operations.
- Validate user input before processing or storing it.

## Testing

The project report describes unit testing, integration testing, and alpha testing.

Testing areas include:

- Student registration and account approval
- Student, faculty, and administrator authentication
- Academic query submission and status updates
- Faculty response submission
- Sentence Transformer embedding generation
- FAISS-based semantic retrieval
- RAG context construction and LLM response generation
- Faculty escalation for queries requiring further assistance
- Notification handling
- End-to-end query processing

Test results should reflect actual execution on the final environment. Re-run tests after configuration changes or deployment.

## Limitations

- AI response quality depends on the relevance and completeness of the knowledge base.
- LLM service availability and API limits can affect response generation.
- AI-generated responses may require faculty verification.
- Embedding generation, retrieval, and response generation introduce processing latency.
- Internet connectivity is required for Firebase and external AI services.
- Large-scale deployments may require further optimization of retrieval, database operations, and infrastructure.

## Future Enhancements

Potential improvements include:

- Domain-specific embedding models
- Improved AI confidence evaluation and response verification
- Multilingual academic query support
- Real-time notifications
- Automated query prioritization
- Expanded knowledge bases containing official academic documents, notices, regulations, and timetables
- Enhanced analytics and query-management insights
- Integration with institutional learning management and academic information systems

## References

1. P. Lewis et al., “Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks,” NeurIPS, 2020.
2. N. Reimers and I. Gurevych, “Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks,” EMNLP-IJCNLP, 2019.
3. J. Johnson, M. Douze, and H. Jégou, “Billion-scale Similarity Search with GPUs,” 2017.
4. [Sentence Transformers Documentation](https://www.sbert.net/)
5. [FAISS Documentation](https://faiss.ai/)
6. [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
7. [Cloud Firestore Documentation](https://firebase.google.com/docs/firestore)
8. [FastAPI Documentation](https://fastapi.tiangolo.com/)
9. [Python 3.12 Documentation](https://docs.python.org/3.12/)

---

## Author

**Amarjith Anand**  
MCA Student | Software Development and AI/ML

- GitHub: [@amarjithanand](https://github.com/amarjithanand)

---

*DeptConnect — Making academic query resolution more organized, intelligent, and accessible.*
