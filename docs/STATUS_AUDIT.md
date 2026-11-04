# ScamRoad (scam_road) ? Independent Technical Audit Report

> **Auditor Role:** Independent Technical Auditor  
> **Date of Audit:** 2026-11-04  
> **Repository Commit:** `1f71675` (branch: `main`)  
> **Audit Principle:** Rule R1 (Truth over appearance). Read-only evidence-based audit. Zero speculation.

---

## 1. Executive Summary

ScamRoad possesses a fully developed, working municipal backend (42 FastAPI endpoints, 39 PostGIS tables), an operational edge runtime (capture, IOU tracker, privacy blur, SQLite WAL outbox), and a modern React dashboard (10 pages, real-time AI scanner). 161 automated unit and integration tests pass across Python, Web, and Mobile test suites. However, the machine learning pipeline is fundamentally unvalidated: the local training dataset consists of only 30 sample images (21 train, 9 val, 0 test) with 24 perceptual duplicate pairs; all training runs completed only 1 to 3 epochs on CPU (<40s runtime); hard negative mining synthesizes noise blocks; and documented mAP metrics (0.8575 to 0.9950) are inflated artifacts from evaluating on 9 validation images. Mobile is an Expo-configured React scaffold without an actual React Native/Expo toolchain or compiled APK. The project is effectively in Phase 4 / Stage 4 (Baselines on Sample Data) disguised by documentation as Stage 12 (Frozen Production).

---

## 2. Real Architecture and Tech Stack (Verified) vs Planned

| Layer | Planned in `docs/SPEC.md` | Actually Built & Verified in Code | Key Differences / Deviations |
|---|---|---|---|
| **Deep Learning Engine** | YOLOv8/YOLO11 Nano + Small, YOLO-Seg segmentation, RT-DETR server baseline | Ultralytics YOLOv8n, YOLOv8s, YOLO11n object detection (`ml/training/train_detect.py`). INT8 ONNX export (`runs/export/best_int8.onnx`). | No segmentation model trained (no YOLO-Seg weights). No RT-DETR trained. Models trained only for 2-3 epochs on 21 images. |
| **Datasets** | RDD2022 full (~9,665 India, 10,506 Japan), MakeML, IIT Bombay, local Punjab video | Sample of 30 images from India (`data/sample/splits/`: 21 train, 9 val, 0 test). Empty string placeholder SHA-256 in `ml/configs/data_checksums.yaml`. | Full ~20,000+ image dataset was never downloaded locally. Local Punjab video is uncollected (`HT-01` queued). |
| **Edge Agent Runtime** | Python agent: V4L2 capture, OpenCV quality gate, ONNX Runtime/TFLite, Kalman tracker, GPS geotag, SQLite WAL outbox, sync | Modular Python edge agent in `edge/agent/` (`capture.py`, `infer.py`, `track.py`, `geotag.py`, `outbox.py`, `sync.py`, `blur.py`). Verified with ONNX Runtime. | Fully built and working in code. Tested on synthetic video streams; untargeted to real physical hardware (`HT-03` queued). |
| **Backend API** | FastAPI, PostgreSQL 16 + PostGIS 3.4, SQLAlchemy Async, Redis, MinIO, Celery | FastAPI 0.115 (`backend/app/main.py`), SQLAlchemy 2.0 (`Base.metadata` with 39 tables), Alembic 1.14, Redis 5.2, MinIO 7.2. | 42 endpoints functional. Celery worker tasks are scaffolded (`backend/app/workers/`). |
| **Database Schema** | 39 PostGIS tables with spatial indexes and immutable audit logs | 39 tables registered on `Base.metadata`. Single Alembic revision `backend/alembic/versions/20261031_0001_initial_schema.py` creates PostGIS extension + tables. | Schema matches specification. However, migration uses `Base.metadata.create_all()` instead of discrete Alembic DDL operations. |
| **Web Dashboard** | React 18, TypeScript, Tailwind CSS, Leaflet, Recharts, Vite | React 18.3, TypeScript 5.6, Tailwind CSS 3.4, Vite 5.4 (`web/`). 10 pages in `web/src/pages/`. Real-time multi-pothole scanner with dual API + Edge CV fallback. | High fidelity UI. When backend database is offline, `web/src/api/client.ts:213` falls back to hardcoded demo data (`is_demo: true`). |
| **Mobile App** | Android-first React Native / Expo app for OPPO K13 (Android API 34) with native on-device ONNX Runtime | TypeScript/React scaffold (`mobile/src/App.tsx`, `screens/`, `services/`). `mobile/package.json` has only `react`, `react-dom`, `vite`, `vitest`. | Lacks `expo`, `react-native`, and native modules in `package.json`. No Android build pipeline (no Gradle, no APK). Vitest tests run against web DOM mocks. |
| **Ops & Packaging** | Docker compose, GitHub Actions CI, pre-commit hooks, GCP Cloud Build | `docker-compose.yml` (db, redis, minio, api), `.github/workflows/ci.yml` (lint, test with PostGIS/Redis containers, docker build). | CI workflow is verified and active. Local Docker daemon is currently stopped on Windows host. |

---

## 3. Module Status Table

Scale: `NOT_STARTED` (0) | `SCAFFOLD` (1) | `PARTIAL` (2) | `WORKING` (3) | `VERIFIED` (4)

| Module | Status | Evidence (Paths / Commands) | What is Missing / What Remains |
|---|:---:|---|---|
| **dataset download** | `PARTIAL` | `ml/data/download.py`, `data/datasets/raw/India/` (30 items) | Full RDD2022 (~20,000 images) not downloaded. `ml/configs/data_checksums.yaml` has empty-string SHA-256 (`e3b0c44...`). |
| **data audit/cleaning** | `WORKING` | `ml/data/audit.py`, `docs/DATASET_AUDIT.md`, `runs/audit/audit_latest.json` | Tested on 30 sample images only; needs execution on full multi-gigabyte dataset. |
| **label conversion** | `WORKING` | `ml/data/convert.py`, `ml/tests/test_convert.py` (passed), `data/sample/yolo_labels/` | Full Pascal VOC conversion needs to run across all RDD2022 countries. |
| **splits + leakage test** | `WORKING` | `ml/data/split.py`, `ml/tests/test_split.py` (passed), `data/sample/splits/` | Split currently has 21 train, 9 val, 0 test. Real test holdout and local Punjab holdout are missing. |
| **training scripts** | `WORKING` | `ml/training/train_detect.py`, `cloud_orchestrator.py`, `ml/tests/test_train.py` | Training script is robust with self-healing paths, but has never been allowed to train a full 100-epoch run. |
| **training runs done** | `PARTIAL` | `runs/baselines/yolov8n/results.csv` (3 epochs), `runs/ablations/ablation_A2_yolo11n_640/` (2 epochs) | No complete training run (>3 epochs) exists. Runs took 30-40 seconds on CPU. |
| **evaluation + metrics** | `PARTIAL` | `ml/evaluation/evaluate.py`, `runs/baselines/yolov8n/metrics.json` | Metrics in docs (mAP=0.8575 to 0.9950) are inflated from 9-image val set. Invalid class metric: mAP50=0.0 but mAP50-95=0.7913. |
| **hard-negative mining** | `PARTIAL` | `ml/training/hard_negative_workflow.py:34-54`, `docs/HARD_NEGATIVES.md` | Generates synthetic random noise blocks (`np.random.randint`) when negatives missing. Model `ml/runs/hard_negatives/.../best.pt` does not exist on disk. |
| **segmentation** | `SCAFFOLD` | `ml/stages/stage7_segmentation_measurement.py` | No trained YOLO-Seg model weights (`yolov8n-seg.pt`) or real polygon annotations exist. Only synthetic circular masks are tested. |
| **measurement** | `PARTIAL` | `ml/measurement/geometry.py`, `ml/tests/test_forecast.py` | Pixel area math works. Real-world metric conversion ($m^2$, cm) requires physical camera pitch/height calibration on vehicle. |
| **severity engine** | `WORKING` | `backend/app/services/severity.py`, `backend/tests/test_severity.py` (5 passed) | Complete implementation of IRC:SP:84-2019 / ASTM D6433 weighted severity with factor renormalization. |
| **export (ONNX/TFLite/TensorRT)** | `WORKING` | `runs/export/best_int8.onnx` (3.32 MB), `runs/baselines/yolov8n/weights/best.onnx` | ONNX opset 17 export verified. TFLite and TensorRT engines are not generated. |
| **quantization** | `WORKING` | `ml/export/quantize.py`, `ml/tests/test_quantize.py` (passed), `runs/export/best_int8.onnx` | Static QDQ ONNX quantization functional; calibration set was small (sample images only). |
| **edge agent** | `WORKING` | `edge/agent/main.py`, `edge/tests/test_pipeline.py` (passed) | Python edge agent pipeline complete and verified against synthetic video streams. Untested on physical embedded Linux hardware. |
| **tracking + dedup** | `WORKING` | `edge/agent/track.py`, `backend/app/api/v1/sync.py`, `edge/tests/test_track.py` | IOU tracker, ego-motion gating, and PostGIS `ST_DWithin` spatial deduplication working and tested. |
| **backend API** | `WORKING` | `backend/app/main.py` (42 routes), `backend/tests/` (21 passed) | Fully functional FastAPI endpoints for auth, defects, complaints, work orders, maps, stats, reports, and inference. |
| **database + migrations + PostGIS** | `WORKING` | `backend/app/models/` (39 tables), `backend/alembic/versions/20261031_0001_initial_schema.py` | 39 tables and PostGIS spatial indexes defined and verified. Migrations need refactoring to individual DDL calls. |
| **auth + RBAC** | `WORKING` | `backend/app/api/v1/auth.py`, `backend/tests/test_security_matrix.py` (passed) | JWT bearer auth, argon2 hashing, role checks (Admin, Manager, Contractor, Citizen, Inspector) enforced. |
| **web app pages** | `WORKING` | `web/src/pages/` (10 pages), `web/src/App.tsx`, `npm run build` (0 errors, 7.55s) | All 10 dashboards render. Fallback demo data in `client.ts` needs to be replaced with real backend connectivity indicators. |
| **mobile app** | `SCAFFOLD` | `mobile/app.json`, `mobile/src/App.tsx`, `mobile/src/__tests__/` (15 passed) | No native mobile framework installed (`package.json` has web react only). No APK build, no Expo native camera/location binding. |
| **citizen reporting** | `WORKING` | `backend/app/api/v1/complaints.py`, `web/src/pages/ComplaintsPage.tsx` | 6-stage complaint state machine enforced with rejection validation. Tested and passing. |
| **maintenance + work orders** | `WORKING` | `backend/app/api/v1/maintenance.py`, `web/src/pages/MaintenancePage.tsx` | Work order Kanban lifecycle, contractor assignment, SLA tracking, and repair record submission operational. |
| **repair verification** | `WORKING` | `backend/app/api/v1/maintenance.py:verify_repair`, Rule R8 logic | Before/after photo pairing and human sign-off workflow operational. |
| **notifications** | `WORKING` | `backend/app/api/v1/notifications.py`, `test_notifications_api.py` | In-app notification center operational. External SMS/WhatsApp adapters remain disabled. |
| **reports** | `WORKING` | `backend/app/api/v1/reports.py`, `test_reports_api.py` | CSV defect export and executive summary with number-parity assertions operational. |
| **forecasting** | `PARTIAL` | `backend/app/api/v1/forecasts.py`, `ml/tests/test_forecast.py` | Endpoints exist and adhere to Rule R7 (`INSUFFICIENT_DATA`), but real time-series forecasting requires months of physical road history. |
| **weather** | `PARTIAL` | `backend/app/services/weather.py` | Open-Meteo client implemented with caching. Needs live external network verification. |
| **Docker/compose** | `WORKING` | `docker-compose.yml`, `docker-compose.gpu.yml`, `infra/docker/Dockerfile.api` | Compose configurations are syntactically valid YAML. Daemon currently stopped on local host. |
| **CI/CD** | `WORKING` | `.github/workflows/ci.yml` | Linting, formatting, schema validation, and PostGIS/Redis backend test pipeline configured. |
| **tests** | `WORKING` | 144 pytest passed (`docs/STATUS_AUDIT_evidence/pytest_results.txt`), 2 web passed, 15 mobile passed | 161 automated unit/integration tests passing. End-to-end multi-cloud and pipeline tests passing. |
| **docs** | `PARTIAL` | 56 Markdown files in `docs/` | Comprehensive structure, but plagued by inconsistent and inflated claims (e.g. claiming mAP 0.9950, non-existent retrained models). |
| **privacy blur** | `WORKING` | `edge/agent/blur.py`, `edge/tests/test_blur_privacy.py` (passed) | Haar cascade face/plate redaction + Gaussian blur + SHA-256 redaction log operational. |
| **security checks** | `WORKING` | `backend/tests/test_security_matrix.py` (passed) | Boundary validation, MIME/magic byte checks, SHA-256 integrity, 10x replay idempotency verified. |

---

## 4. Phase / Stage Progress Table Against Plan

| Phase / Stage | Description | Status | Exit Criteria Assessment |
|---|---|:---:|---|
| **Stage 0** | Environment & Hardware Verification | **DONE** | GPU probe, Python 3.12, PyTorch, CUDA checks passed (`runs/env_check/env_report.json`). |
| **Stage 1** | Data Acquisition & Manifests | **PARTIAL** | Manifests created (`ml/configs/data_checksums.yaml`), but full datasets not downloaded; checksums are placeholder empty string hashes. |
| **Stage 2** | Data Audit & Label Cleaning | **PARTIAL** | Audit script runs (`ml/data/audit.py`), but only audited 30 sample images with 24 perceptual duplicates. |
| **Stage 3** | Splits & Evaluation Protocol | **PARTIAL** | Sequence-aware splitter works (`ml/data/split.py`), but split has 0 test samples. |
| **Stage 4** | Baselines (YOLOv8n/s, YOLO11n) | **PARTIAL** | Baseline scripts run, but models only trained for 2-3 epochs on 21 images. |
| **Stage 5** | Systematic Improvement & Ablations | **PARTIAL** | Ablation script ran (`ablation_matrix.json`), but `ablation_G_hard_negatives` references non-existent retrained weights file. |
| **Stage 6** | Multi-Cloud & Architecture Comparison | **PARTIAL** | Comparison scripts exist, but evaluation was on 9 validation samples. Cloud failover simulation verified. |
| **Stage 7** | Segmentation & Measurement | **PARTIAL** | Geometric measurement math implemented; segmentation model untrained (no mask annotations). |
| **Stage 8** | Local Punjab / India Pipeline | **NOT STARTED** | CVAT tool configured, but zero local Punjab road footage collected (`HT-01` queued). |
| **Stage 9** | Export, Quantization, Edge Benchmarks | **WORKING** | ONNX FP32 and INT8 exported and benchmarked on host CPU. Real embedded device benchmark pending (`HT-03` queued). |
| **Stage 10** | Video Tracking & Real-World Testing | **PARTIAL** | Synthetic video pipeline passes (`test_pipeline.py`). Real-world continuous video test with ground truth pending (`HT-04` queued). |
| **Stage 11** | Robustness, Corruptions, Safety | **WORKING** | Synthetic corruption suite (motion blur, low light, rain noise) implemented in `stage11_robustness_safety.py`. |
| **Stage 12** | Model Freeze & Final Reporting | **NOT MET** | `ml/STATE.json` claims "FROZEN_V1_0_0", but the underlying model has only seen 21 training images. Production freeze is premature. |

---

## 5. Real Results Found on Disk

| Artifact Category | Files Actually Present | Real Counts / Measurements from Files | File Paths |
|---|---|---|---|
| **Model Weights** | `best.pt`, `best.onnx`, `best_int8.onnx`, `yolo11n.pt`, `yolov8n.pt`, `yolov8s.pt` | 5.61 MB (`yolo11n.pt`), 6.55 MB (`yolov8n.pt`), 22.59 MB (`yolov8s.pt`), 3.32 MB (`best_int8.onnx`) | `runs/baselines/yolov8n/weights/best.pt`<br>`runs/ablations/ablation_A2_yolo11n_640/weights/best.pt`<br>`runs/export/best_int8.onnx` |
| **Datasets (Local)** | 30 JPEG images, 30 XML annotations, 30 YOLO label files | Train: 21 images, Val: 9 images, Test: 0 images. Class counts: 18 Potholes, 15 Longitudinal Cracks. | `data/sample/splits/images/train/`<br>`data/sample/splits/images/val/`<br>`data/sample/splits/labels/` |
| **Training History** | `results.csv` files across baseline and ablation folders | All runs completed only 1, 2, or 3 epochs.<br>Baseline YOLOv8n: 3 epochs, elapsed 38.8s on CPU.<br>Ablation A2 YOLO11n: 2 epochs, elapsed 29.2s on CPU. | `runs/baselines/yolov8n/results.csv`<br>`runs/ablations/ablation_A2_yolo11n_640/results.csv` |
| **Evaluation Metrics** | `metrics.json` across baseline folders | Measured on 9 val images. Overall: P=0.812, R=0.900, mAP50=0.8575, mAP50-95=0.7913.<br>Unobserved classes (CRACK_TRANS, CRACK_ALLIGATOR): mAP50=0.0. | `runs/baselines/yolov8n/metrics.json`<br>`runs/ablations/ablation_A2_yolo11n_640/eval/metrics.json` |

---

## 6. Problems Found: Broken, Fake, Risky, Inconsistent

| Severity | Issue Description | File & Line | Technical Evidence & Risk | Fix Hint |
|:---:|---|---|---|---|
| **HIGH** | **Untrained Production Model Claim** | `ml/STATE.json:133-145` | Claims `pipeline_status: "FROZEN_V1_0_0"` with `val_mAP50: 0.8575` and `val_mAP50_95: 0.7913`. The model only trained for 3 epochs on 21 images. Evaluators will immediately spot this as a toy baseline. | Change `pipeline_status` to `DEVELOPMENT_SAMPLE_BASELINE`. Train on cloud GPU with full RDD2022 dataset for $\ge 50$ epochs. |
| **HIGH** | **Non-Existent Retrained Model Cited in Docs** | `docs/HARD_NEGATIVES.md:6`<br>`runs/experiments/ablation_matrix.json:58` | Documents `ml/runs/hard_negatives/retrain_run/weights/best.pt` with a claimed precision jump (+0.042). This directory and weights file **do not exist on disk**. | Remove false claims from docs or execute the actual hard negative retraining workflow and generate the weights file. |
| **HIGH** | **Synthetic Random Noise Used for Negative Mining** | `ml/training/hard_negative_workflow.py:34-54` | When background images are missing, generates synthetic colored squares using `np.random.randint(60, 90, (320, 320, 3))` as negative training samples. | Disable synthetic noise generation; mine real negative road tiles from unlabelled road video frames. |
| **HIGH** | **Mathematically Invalid Class Metrics in JSON** | `runs/baselines/yolov8n/metrics.json:19-27` | Reports `mAP50 = 0.0` but `mAP50_95 = 0.7913` for `CRACK_TRANS` and `CRACK_ALLIGATOR`. Mathematically, mAP@50-95 cannot be 0.7913 if mAP@50 is 0.0. | Re-evaluate metrics script to clamp per-class mAP@50-95 to 0.0 when class support is 0. |
| **MEDIUM** | **Hardcoded Demo Data in Frontend Client** | `web/src/api/client.ts:212-489` | When backend is offline, catches fetch errors and injects hardcoded records for Ludhiana NH-44 (`is_demo: true`). | Show a prominent, honest "Backend Offline / Reconnecting" banner in the UI rather than silent demo data fallback. |
| **MEDIUM** | **Mobile App is a Web React Scaffold, Not React Native** | `mobile/package.json:11-21`<br>`mobile/app.json` | `package.json` contains web `react` and `vite`, with zero Expo or React Native dependencies. It cannot build an APK for OPPO K13. | Initialize real Expo workflow with `npx create-expo-app` or install `expo`, `react-native`, and `expo-camera`. |
| **MEDIUM** | **Empty String Placeholder Checksums in Registry** | `ml/configs/data_checksums.yaml:11,21,41` | SHA-256 for all external datasets is set to `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` (SHA-256 of empty string). | Compute and insert actual SHA-256 checksums from downloaded dataset archives. |
| **LOW** | **Hardcoded Password in Web AuthContext** | `web/src/context/AuthContext.tsx:31,43` | Contains hardcoded demo login credentials (`password: "..."`). | Use environment variables (`VITE_DEFAULT_PASSWORD`) or empty inputs requiring user typing. |

---

## 7. Security and Licence Findings

### Licencing Analysis
1. **Ultralytics YOLO (AGPL-3.0):**
   - The project imports `ultralytics` in `backend/app/api/v1/infer.py` and `ml/training/train_detect.py`.
   - **Legal Implication:** AGPL-3.0 copyleft requires that any network-accessible software (such as ScamRoad's backend API) utilizing AGPL code must make its full source code available under AGPL-3.0 to all network users. For a closed-source municipal or commercial platform, a commercial license from Ultralytics or an export to standalone ONNX Runtime is required.
   - **Mitigation:** The edge agent (`edge/agent/infer.py`) correctly uses `onnxruntime` without importing `ultralytics`. The backend inference should strictly use `onnxruntime` with `best_int8.onnx` to isolate the AGPL dependency.
2. **Dataset Licences:**
   - **RDD2022 (India & Japan):** Licensed under **CC BY-SA 4.0**. Requires attribution (Arya et al., 2022) and derivative datasets must be released under ShareAlike.
   - **IIT Goa Dataset:** Listed in `docs/DATASETS.md` as **Research Use Only**. Commercial municipal use is prohibited without direct institutional licensing.

### Security Audit Findings
- **Secret Scanning:** Scanned the codebase for API keys, AWS tokens, GitHub tokens, and private keys. No leaked live cloud credentials found. Two demo passwords flagged in `web/src/context/AuthContext.tsx:31` and `:43`.
- **Backend Input Validation:** Tested and verified in `backend/tests/test_security_matrix.py`:
  - Latitude boundary rejection ($[-90, +90]$ enforced).
  - Media magic bytes validation (validates `\xFF\xD8\xFF` JPEG header, rejects polyglot files).
  - SHA-256 payload integrity matching enforced on media upload.
  - 10x replay idempotency verified on sync batch ingestion.
  - RBAC strictly verified (citizens and contractors forbidden from administrative and repair verification routes).

---

## 8. Test and Build Results

### Real Command Verification Results
All tests were run cleanly from disk:

1. **Python Test Suite (Pytest):**
   - **Command:** `pytest -v`
   - **Result:** **144 PASSED**, 0 failed, 3 deprecation warnings in 73.99 seconds.
   - **Coverage:** Backend API, database migrations, security matrix, severity calculation, edge capture, outbox WAL, tracking, blur privacy, and end-to-end 14-stage pipeline.
   - **Evidence Log:** `docs/STATUS_AUDIT_evidence/pytest_results.txt`.
2. **Web Frontend Test Suite (Vitest):**
   - **Command:** `npm test -- --run` (in `web/`)
   - **Result:** **1 test file passed, 2 tests passed** in 1.30 seconds.
   - **Evidence Log:** `docs/STATUS_AUDIT_evidence/web_test_results.txt`.
3. **Web Frontend Production Build (Vite):**
   - **Command:** `npm run build` (in `web/`)
   - **Result:** **PASSED (0 TypeScript errors)**. Built `dist/assets/index-Cn5a83Px.js` (925 kB) in 7.55 seconds.
4. **Mobile Test Suite (Vitest):**
   - **Command:** `npm test -- --run` (in `mobile/`)
   - **Result:** **5 test files passed, 15 tests passed** in 1.58 seconds (tracker, inference, outbox, location, i18n).
   - **Evidence Log:** `docs/STATUS_AUDIT_evidence/mobile_test_results.txt`.
5. **Docker Compose Configuration Validation:**
   - **Command:** Validated `docker-compose.yml` and `docker-compose.gpu.yml` via YAML schema parser.
   - **Result:** **PASSED**. Valid services: `db` (PostGIS), `redis`, `minio`, `api`.
6. **Code Quality Linting (Ruff):**
   - **Command:** `ruff check .`
   - **Result:** 647 errors (primarily line length E501 and import sorting I001; 111 auto-fixable).

---

## 9. Top 10 Next Actions (Ranked by Impact)

| Rank | Action | Target File / Command | Human vs Agent Responsibility |
|:---:|---|---|---|
| **1** | **Download Full RDD2022 India Dataset** | `python -m ml.data.download --kaggle-dataset aliabdelmenam/rdd-2022` | **Human:** Provide Kaggle API credentials (`kaggle.json`).<br>**Agent:** Execute download and verify extracted images. |
| **2** | **Execute Full Cloud GPU Training Run (50 Epochs)** | `python cloud_orchestrator.py --experiment scamroad_yolo11n_production --epochs 50 --batch 16` | **Human:** Start Colab or Kaggle GPU notebook with GPU accelerator active.<br>**Agent:** Run orchestrator with auto-resume checkpointing. |
| **3** | **Eliminate Synthetic Noise Generation in Negative Mining** | `ml/training/hard_negative_workflow.py:34-54` | **Agent:** Remove `create_mock_background_candidates` noise generator; harvest genuine unlabelled road frames. |
| **4** | **Clean Inflated and Discrepant Claims in Documentation** | `docs/EXPERIMENTS.md`, `docs/HARD_NEGATIVES.md`, `ml/STATE.json` | **Agent:** Align all tables with real files on disk. Remove references to non-existent retrained models. |
| **5** | **Fix Invalid Class Metrics Clamping** | `ml/evaluation/evaluate.py:120-145` | **Agent:** Ensure classes with 0 support report `0.0` for both mAP@50 and mAP@50-95. |
| **6** | **Collect Initial Real-World Punjab/Ludhiana Road Video (`HT-01`)** | Record 10-minute dashcam footage $\to$ `data/local_raw/` | **Human:** Drive local road with phone/camera mounted, record 1080p footage.<br>**Agent:** Run frame extraction and inference quality gating. |
| **7** | **Bootstrap Real Expo React Native Toolchain for Mobile** | `cd mobile && npx expo install expo-camera expo-location` | **Agent:** Add real Expo dependencies and update `mobile/package.json`.<br>**Human:** Run on physical Android device (OPPO K13). |
| **8** | **Isolate Backend Inference to ONNX Runtime (Remove AGPL Ultralytics)** | `backend/app/api/v1/infer.py` | **Agent:** Replace `ultralytics.YOLO` with `onnxruntime.InferenceSession("runs/export/best_int8.onnx")`. |
| **9** | **Replace Silent Web Fallback with Honest Offline Status** | `web/src/api/client.ts:212` | **Agent:** Remove silent demo injection; display explicit "Connecting to Municipal Node..." banner. |
| **10** | **Execute Database Migrations on Live PostGIS Container** | `docker compose up -d db redis && alembic upgrade head` | **Human:** Start Docker Desktop daemon on Windows host.<br>**Agent:** Apply migrations and seed verified municipal GIS data. |

---

## 10. Estimated Remaining Work per Module

> **Notice:** The following are engineering estimates based on project scope, not physical measurements.

| Module Area | Sub-Module | Estimated Remaining Effort | Justification |
|---|---|:---:|---|
| **ML & Data** | Dataset Download & Full Audit | **M** (Medium) | Download ~2 GB archive, run hash verification, convert VOC to YOLO. |
| | Full Cloud Training Run (YOLO11n) | **M** (Medium) | 50 epochs on Kaggle T4 GPU (~1.5 hours compute). |
| | Real Hard Negative Mining | **S** (Small) | Mine ~50 false alarm crops from unlabelled road frames, retrain 10 epochs. |
| | Pothole Segmentation Model | **L** (Large) | Requires polygon mask dataset (e.g. e-Yantra IIT Bombay) and YOLO-Seg training. |
| | Physical Measurement Calibration | **M** (Medium) | Calibrate camera height and lens intrinsics on vehicle test rig. |
| **Edge Runtime** | Embedded Device Porting (Pi / Jetson) | **L** (Large) | Physical hardware deployment, serial GPS setup, thermal throttling tests (`HT-03`). |
| **Mobile App** | Real Expo / React Native App | **L** (Large) | Migrate from web React mock to native Expo modules, build Android APK. |
| **Backend & Ops** | Live PostGIS Deployment & Seed | **S** (Small) | Start Docker, run Alembic migrations, verify spatial queries. |
| | AGPL License Decoupling | **S** (Small) | Port `infer.py` entirely to ONNX Runtime. |
| | Documentation Reconciliation | **S** (Small) | Update documentation to match real on-disk metrics honestly. |

---

## 11. Completion Rubric Score Summary

*Rubric: NOT_STARTED = 0, SCAFFOLD = 1, PARTIAL = 2, WORKING = 3, VERIFIED = 4.*  
*(Note: This is a rubric quality score, not a percentage of effort completed.)*

* **ML & Vision Area (12 modules):** **2.42 / 4.00**
* **Edge Runtime Area (3 modules):** **3.00 / 4.00**
* **Backend Subsystems (11 modules):** **2.82 / 4.00**
* **Web Dashboard (1 module):** **3.00 / 4.00**
* **Mobile App (1 module):** **1.00 / 4.00**
* **Ops, Testing & Quality (5 modules):** **2.80 / 4.00**

### **Overall Project Completion Score: 2.64 / 4.00**

