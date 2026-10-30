# Phase 1 Report: Repository Audit, Requirements, Architecture & Skeleton

**Phase:** 1 — Audit, Architecture, Skeleton  
**Date:** 2026-10-31  
**Status:** Completed  
**Gate:** Plan approved; skeleton created; Docker & CI configs ready; `/health` endpoint verified; `make lint test` passing with real outputs.

---

## 1. Executive Summary

Phase 1 established the complete baseline architecture and codebase skeleton for **ScamRoad** (pothole-first, edge-AI road-damage tracking system) following the Part A Global Rules and Part B Specification.

Key deliverables completed:
1. Environment detection & audit (Windows 11, RTX 3050 Laptop 6 GB VRAM, 15.2 GB RAM, 26.6 GB free disk, Python 3.12, OPPO K13 Android target).
2. Implementation Plan artifact with system architecture diagrams, ER diagrams for 39 tables, index/constraint plans, feature matrix, risk register, and 16-phase roadmap.
3. Full A4 layout directory tree and package initialisation.
4. Single-source `shared/taxonomy.yaml` with multilingual names (en/hi/pa) and status tracking.
5. Shared JSON schemas (`detection.schema.json`, `defect.schema.json`, `observation.schema.json`, `sync-batch.schema.json`) with strict validation rules.
6. FastAPI backend with `/health` and `/api/v1/health` endpoints, correlation ID middleware, and structured error envelopes.
7. Docker Compose configuration (`postgis/postgis:16-3.4-alpine`, `redis:7-alpine`, `minio/minio:latest`, `scamroad-api`) with healthchecks and memory limits, plus GPU override compose file.
8. GitHub Actions CI workflow for linting, schema validation, backend tests, and Docker container build.
9. Cross-platform task runners: GNU `Makefile`, Windows `make.bat`, and PowerShell `scripts/make.ps1`.
10. Contract tests and unit test suites passing 100%.

---

## 2. Verification Commands & Real Outputs

### 2.1 Linter Verification (`make.bat lint`)

```
> .\make.bat lint

=== Running Ruff Linter ===
All checks passed!
=== Running Black Formatter Check ===
All done! ✨ 🍰 ✨
45 files would be left unchanged.
All linter checks passed!
```

### 2.2 Test Suite Verification (`make.bat test`)

```
> .\make.bat test

Running all pytest suites...
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0 -- C:\Users\PRIYE RANJAN\AppData\Local\Programs\Python\Python312\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\PRIYE RANJAN\OneDrive\Desktop\COMPUTER VISION\scam_road
configfile: pyproject.toml
plugins: anyio-4.14.2, platformdirs-4.14.0, asyncio-1.4.0
asyncio: mode=Mode.STRICT, debug=False, asyncio_default_fixture_loop_scope=None, asyncio_default_test_loop_scope=function
collecting ... collected 8 items

backend/tests/test_health.py::test_health_root_endpoint PASSED           [ 12%]
backend/tests/test_health.py::test_health_api_v1_endpoint PASSED         [ 25%]
backend/tests/test_health.py::test_correlation_id_generated PASSED       [ 37%]
backend/tests/test_health.py::test_correlation_id_preserved PASSED       [ 50%]
shared/tests/test_schemas.py::test_taxonomy_valid_yaml PASSED            [ 62%]
shared/tests/test_schemas.py::test_json_schemas_are_valid PASSED         [ 75%]
shared/tests/test_schemas.py::test_detection_schema_instance_validation PASSED [ 87%]
shared/tests/test_schemas.py::test_detection_schema_calibrated_measurement_validation PASSED [100%]

============================== 8 passed in 0.26s ==============================
```

### 2.3 Health Endpoint Live Curl Verification

```
> curl.exe -i -s http://127.0.0.1:8000/health

HTTP/1.1 200 OK
date: Fri, 30 Oct 2026 21:00:25 GMT
server: uvicorn
content-length: 173
content-type: application/json
x-request-id: 2343cb08-5f15-491a-a979-24c6d8507bd8

{"status":"ok","version":"0.1.0","environment":"development","timestamp":"2026-10-30T21:00:26.383600Z","dependencies":{"api":{"status":"ok","message":"API engine running"}}}
```

```
> curl.exe -s http://127.0.0.1:8000/api/v1/health

{"status":"ok","version":"0.1.0","environment":"development","timestamp":"2026-10-30T21:00:26.348837Z","dependencies":{"api":{"status":"ok","message":"API engine running"}}}
```

---

## 3. Architecture Decision Records (ADRs) Logged

1. **ADR-001: Python 3.12 Runtime**: System Python is 3.12.10; full compatibility with FastAPI, Pydantic v2, PyTorch, and Ultralytics confirmed.
2. **ADR-002: Cross-Platform Make Support**: Provided `Makefile`, `make.bat`, and `scripts/make.ps1` for native command execution on Windows without third-party package managers.
3. **ADR-003: Disk Management Strategy**: 26.6 GB free disk requires starting with RDD2022-India subset (~2 GB) and utilizing Kaggle cloud for large-scale training and data storage.
4. **ADR-004: Primary Edge Hardware**: Verified OPPO K13 Android phone as target mobile device and laptop RTX 3050 as reference workstation edge device.

---

## 4. Issues Encountered & Resolutions

- **Pytest async fixture mismatch**: Replaced async transport in backend tests with standard `TestClient(app)` which runs synchronous, zero-overhead HTTP tests and guarantees deterministic assertion of status codes, JSON responses, and custom middleware headers.
- **Ruff line length and Python 3.12 typing**: Formatted all Python code to 100 character maximum line length and adopted Python 3.12 `from datetime import UTC` and standard collection generic annotations.
- **Docker Desktop on Windows**: The Docker compose configuration is complete and syntax-validated; on Windows, Docker Desktop requires the user to launch the Docker Desktop GUI app to initialize the WSL2 Linux daemon.

---

## 5. Next Steps (Phase 2 Entry)

Proceed to **Phase 2: Datasets and Audit**:
1. Implement checksummed dataset download scripts in `ml/data/download.py` for RDD2022-India.
2. Build data audit tool in `ml/data/audit.py` (duplicate detection with perceptual hashing, label format verification, class distributions).
3. Implement annotation conversion script in `ml/data/convert.py` (Pascal VOC XML → normalized YOLO format).
4. Run leakage checks between train/val/test splits.
5. Record dataset licenses and metrics in `docs/DATASETS.md` and generate `docs/DATASET_AUDIT.md`.
