# ScamRoad — Backend Architecture & API Guide

FastAPI-powered asynchronous backend providing REST API services, real-time computer vision inference orchestration, and municipal work order lifecycle management.

---

## 🏗️ Directory Layout

```
backend/
├── app/
│   ├── api/v1/          # REST API Version 1 Endpoints
│   │   ├── infer.py         # 🧠 70/30 Multi-Model AI Inference Endpoint (/api/v1/infer)
│   │   ├── defects.py       # Defect database records, query filtering, and engineer overrides
│   │   ├── complaints.py    # Citizen incident reporting and municipal triage
│   │   ├── maintenance.py   # Work order generation, contractor dispatch, and SLA tracking
│   │   ├── verification.py  # Repair verification before/after image comparison
│   │   ├── benchmarks.py    # Model evaluation metrics and confusion matrix
│   │   ├── drift.py         # Data drift & concept drift monitoring (PSI / KS tests)
│   │   ├── forecasts.py     # Deterioration curve forecasts and health index
│   │   ├── reports.py       # Municipal CSV / PDF report export
│   │   ├── auth.py          # JWT authentication and user profile management
│   │   └── router.py        # Centralized APIRouter aggregation
│   ├── core/            # Configuration settings, security hashing, JWT tokens
│   ├── db/              # Async SQLAlchemy session and database engine
│   ├── models/          # 39 SQLAlchemy database models (audit logs, defects, work orders)
│   ├── schemas/         # Pydantic v2 request and response validation contracts
│   ├── services/        # Domain business logic (severity scoring, sensor fusion)
│   └── main.py          # Main FastAPI application entry point
├── alembic/             # Database schema migrations
├── tests/               # 78 Backend unit and integration test suites
└── requirements.txt     # Python dependency specifications
```

---

## 🚀 Running the Backend

### Option A: High-Speed AI Inference Server (Recommended for Local Dev)
```bash
set PYTHONPATH=.
python scripts\serve_inference.py
```
*Listens on `http://localhost:8000`. Supports ONNX Runtime session pooling, dynamic image formats (AVIF, WebP, JPEG, PNG), and sub-millisecond route dispatching.*

### Option B: Full Application Stack via Uvicorn
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🧪 Running Backend Tests

```bash
pytest backend/tests/ -v
```
*Executes all 78 backend tests covering authentication, RBAC security matrix, work order state machines, sensor fusion, spatial deduplication, and repair verification.*
