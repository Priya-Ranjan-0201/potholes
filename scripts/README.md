# ScamRoad — Scripts Directory Guide

Utility scripts, inference runners, evaluation harnesses, and verification gates for ScamRoad.

---

## Script Categories

### 1. Server & Local Inference

| Script / Directory | Description |
| :--- | :--- |
| `serve_inference.py` | FastAPI inference server listening on `http://localhost:8000`. |
| `demo.py` | Command-line walkthrough across database, tracking, and reporting modules. |
| `live_sync_demo.py` | Edge-to-cloud SQLite outbox replay demonstration. |
| `infer_media.py` | CLI inference runner for image or video files. |
| `make.ps1` | PowerShell task helper invoked by `make.bat`. |
| `healthcheck/check_services.py` | Readiness check for PostgreSQL, Redis, and FastAPI. |

### 2. Model Verification & Benchmarking

| Script | Description |
| :--- | :--- |
| `test_live_poly.py` | Runs live `/api/v1/infer` checks across sample road images in `web/public/samples/`. |
| `run_onnx_parity.py` | Checks numerical similarity between PyTorch FP32 and ONNX INT8 outputs. |
| `evaluate_model_pipeline.py` | Computes mAP@50, precision, recall, ECE, and confusion matrix outputs. |
| `eval_local.py` | Local batch evaluation script for ONNX checkpoints. |
| `run_hard_negative_ablation.py` | Evaluates false-positive reduction on smooth roads, manholes, and shadows. |
| `deep_feature_accuracy_audit.py` | Diagnostic audit across edge test samples. |
| `benchmark_privacy_blur.py` | Evaluates face and license plate redaction recall. |

### 3. CI Quality, Honesty & UI Checks

| Script | Description |
| :--- | :--- |
| `check_claims.py` | Scans docs and source code for banned claims and missing asset links. |
| `check_i18n_keys.py` | Verifies dictionary key parity across all 6 supported languages (`en`, `hi`, `pa`, `ta`, `te`, `bn`). |
| `check_ui_copy.py` | Checks `web/src` for banned marketing or policy strings. |
| `audit_helper.py` | Endpoint and dependency inspection helper. |
| `pass2_hostile_audit.py` | Automated static compliance audit checks. |
| `reproduce_clean_clone.py` | Clean-clone reproduction check. |
| `capture_ui_matrix.py` | Headless Chrome multi-viewport screenshot capture. |
| `capture_theme_compare.py` | Light/dark theme screenshot comparison capture. |
| `verify_v10_live_chrome.py` | Headless Chrome route smoke check. |
| `live_test_suite.py` | Browser automation checks across app routes. |
| `live_chrome_comprehensive_test.py` | End-to-end browser workflow suite. |

### 4. Data Seeding, Training Setup & Recovery Tests

| Script / Directory | Description |
| :--- | :--- |
| `seed/seed_demo_data.py` | Seeds sample corridors, defects, and work orders (`is_demo=True`). |
| `seed/create_benchmark_sample.py` | Creates standardized before/after sample image pairs. |
| `ingest_real_rdd_data.py` | Ingests RDD2022-India evaluation records into the database. |
| `ingest_local_sample.py` | Ingests local road photography into split directories. |
| `prepare_local_sample.py` | Formats local test samples for batch evaluation. |
| `rater_study_kit.py` | Exports template and concordance report for severity rating checks. |
| `backup_restore_drill.py` | Verifies SHA-256 checksums across backup and restore test runs. |
| `colab/setup_colab.py` | Colab / Kaggle environment setup script. |
| `build_notebooks.py` | Builds standard training notebooks in `notebooks/`. |
| `build_recovery_notebooks.py` | Builds checkpoint-resume training notebooks in `notebooks/`. |
| `e2e/test_end_to_end_pipeline.py` | Edge-to-backend integration verification script. |
| `tests/` | Recovery and checkpoint tests (`tests/test_interruption_recovery.py`, `tests/test_controlled_resume.py`). |
