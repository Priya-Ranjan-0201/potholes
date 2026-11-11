# ScamRoad — Scripts Directory Guide

Curated utility scripts, benchmark evaluators, CI verification gates, and automation tools for the ScamRoad platform.

---

## 📂 Script Categories

### 1. 🚀 Server & Live Operations
| Script / Directory | Description |
| :--- | :--- |
| **`serve_inference.py`** | Standalone FastAPI & 70/30 AI ensemble inference server (`http://localhost:8000`). |
| **`demo.py`** | Multi-subsystem live operational terminal walkthrough. |
| **`live_sync_demo.py`** | Edge-to-cloud transactional outbox sync demonstration with SQLite WAL replay. |
| **`infer_media.py`** | CLI tool to run road defect inference on image or video media. |
| **`make.ps1`** | PowerShell task runner backing `make.bat` (`setup`, `lint`, `test`, `export`, `bench`). |
| **`healthcheck/check_services.py`** | Docker/service readiness probe for PostgreSQL, Redis, and FastAPI. |

---

### 2. 🧠 AI Model Verification & Benchmark Suites
| Script | Description |
| :--- | :--- |
| **`test_live_poly.py`** | Live 70/30 Ensemble verification across all 5 repository benchmark scenarios (`web/public/samples/`). |
| **`run_onnx_parity.py`** | Verifies numerical cosine parity between PyTorch FP32 and ONNX INT8 quantized outputs. |
| **`evaluate_model_pipeline.py`** | Computes mAP@50, precision, recall, ECE, and confusion matrix metrics. |
| **`eval_local.py`** | Local batch evaluation runner for exported ONNX weights. |
| **`run_hard_negative_ablation.py`** | Validates false-positive suppression on smooth pavement, manholes, and shadows. |
| **`deep_feature_accuracy_audit.py`** | Deep feature representation audit for false-positive rejection. |
| **`benchmark_privacy_blur.py`** | Evaluates face & license-plate privacy blurring recall. |

---

### 3. 🔍 CI Quality, Claims & UI Gates
| Script | Description |
| :--- | :--- |
| **`check_claims.py`** | Enforces Rule R1/R7/R8 claim honesty and asset traceability across docs and UI. |
| **`check_i18n_keys.py`** | Verifies 100% key parity across all 6 supported languages (`en`, `hi`, `pa`, `ta`, `te`, `bn`). |
| **`check_ui_copy.py`** | Audits UI strings for clean engineering terminology and domain tone. |
| **`audit_helper.py`** | FastAPI endpoint inventory and dependency health audit helper. |
| **`pass2_hostile_audit.py`** | Automated adversarial compliance and security audit runner. |
| **`reproduce_clean_clone.py`** | Isolated clean-clone reproducibility check. |
| **`capture_ui_matrix.py`** | Multi-viewport desktop/mobile visual matrix capture for `docs/screenshots/`. |
| **`capture_theme_compare.py`** | Light/Dark and road theme contrast capture tool. |
| **`verify_v10_live_chrome.py`** | Automated headless Chrome route and DOM verification suite. |
| **`live_test_suite.py`** | Comprehensive live Chrome interaction suite across routes. |
| **`live_chrome_comprehensive_test.py`** | Full end-to-end browser workflow audit. |

---

### 4. 📦 Data Seeding, Training Setup & DR Drills
| Script / Directory | Description |
| :--- | :--- |
| **`seed/seed_demo_data.py`** | Populates PostgreSQL/PostGIS with demo corridors, defects, and work orders (`is_demo=True`). |
| **`seed/create_benchmark_sample.py`** | Builds standardized before/after verification sample pairs. |
| **`ingest_real_rdd_data.py`** | Ingests real Road Damage Dataset (RDD2022-India) predictions into PostgreSQL. |
| **`ingest_local_sample.py`** | Ingests local field photography into normalized evaluation splits. |
| **`prepare_local_sample.py`** | Preprocesses user-submitted field samples for local benchmarking. |
| **`rater_study_kit.py`** | Generates human-rater vs engine severity concordance studies. |
| **`backup_restore_drill.py`** | Executes SHA-256 verified backup and restore disaster recovery drills. |
| **`colab/setup_colab.py`** | Google Colab / Kaggle multi-cloud training environment bootstrapper. |
| **`build_notebooks.py`** | Generates standard Colab/Kaggle training Jupyter notebooks (`notebooks/`). |
| **`build_recovery_notebooks.py`** | Generates checkpoint-resilient cloud recovery notebooks (`notebooks/`). |
| **`e2e/test_end_to_end_pipeline.py`** | Full edge-to-backend integration verification script. |
| **`tests/`** | Cross-platform checkpoint resume & interruption recovery tests (`test_interruption_recovery.py`, `test_controlled_resume.py`). |
