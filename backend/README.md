# ScamRoad — Backend Architecture & API Guide

FastAPI backend providing ONNX computer vision inference, SQLAlchemy persistence, work-order workflows, and repair comparison endpoints.

---

## Directory Layout

```text
backend/
├── app/
│   ├── api/v1/          # REST API v1 endpoints
│   │   ├── infer.py         # 70/30 multi-model inference endpoint (/api/v1/infer)
│   │   ├── defects.py       # Defect queries, filtering, and severity overrides
│   │   ├── complaints.py    # Citizen report triage workflow
│   │   ├── maintenance.py   # Work orders, contractor assignment, SLA tracking
│   │   ├── verification.py  # Before/after repair alignment and comparison
│   │   ├── benchmarks.py    # Stored evaluation metrics and confusion matrix
│   │   ├── drift.py         # Input distribution drift (PSI / KS tests)
│   │   ├── forecasts.py     # Corridor deterioration projections
│   │   ├── reports.py       # CSV and PDF export endpoints
│   │   ├── auth.py          # JWT authentication and role checks
│   │   └── router.py        # APIRouter aggregation
│   ├── core/            # Application settings, hashing, and JWT utilities
│   ├── db/              # Async SQLAlchemy engine and session management
│   ├── models/          # 44 SQLAlchemy ORM tables
│   ├── schemas/         # Pydantic validation schemas
│   ├── services/        # Severity scoring, alignment, drift, PDF export
│   └── main.py          # FastAPI entrypoint
├── alembic/             # Database schema migrations
└── tests/               # 78 backend unit and integration tests (20 files)
```

---

## Running the Backend

### Standalone Inference Server (Local Development)

```bash
set PYTHONPATH=.
python scripts\serve_inference.py
```

Listens on `http://localhost:8000` with persistent ONNX Runtime session caching for `/api/v1/infer`.

### Full FastAPI Stack

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## Running Backend Tests

```bash
pytest backend/tests/ -v
```
