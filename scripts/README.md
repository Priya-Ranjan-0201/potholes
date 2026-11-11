# ScamRoad — Scripts Directory Guide

This directory contains utility scripts, test runners, benchmark evaluators, and automation tools for the ScamRoad platform. **All scripts are preserved and categorized below for easy reference.**

---

## 📂 Script Categories

### 1. 🚀 Server & Live Services
| Script | Description |
| :--- | :--- |
| **`serve_inference.py`** | Standalone high-performance FastAPI inference server (`http://localhost:8000/api/v1/infer`). |
| **`demo.py`** | Multi-subsystem live operational terminal demo. |
| **`live_sync_demo.py`** | Demonstrates edge-to-cloud transactional outbox sync with SQLite WAL replay. |
| **`infer_media.py`** | CLI tool to run inference on an arbitrary image or video file. |
| **`make.ps1`** | PowerShell automation runner backing `make.bat`. |

---

### 2. 🧠 AI Model Verification & Benchmark Suites
| Script | Description |
| :--- | :--- |
| **`test_live_poly.py`** | Comprehensive live test of the **70/30 Ensemble** across all benchmark test scenarios. |
| **`verify_pothole_detection.py`** | Evaluates precision and recall against real-world pothole benchmark datasets. |
| **`run_onnx_parity.py`** | Verifies numerical parity between PyTorch FP32 and ONNX INT8 quantized outputs. |
| **`evaluate_model_pipeline.py`** | Computes mAP@50, precision, recall, and generates confusion matrix data. |
| **`eval_local.py`** | Local batch evaluation runner for model weights. |
| **`run_hard_negative_ablation.py`** | Validates hard-negative suppression on clean pavement and pavement shadows. |
| **`deep_feature_accuracy_audit.py`**| Deep feature representation analysis for false positive rejection. |

---

### 3. 📸 Automated UI Capture & Audit Suites
| Script | Description |
| :--- | :--- |
| **`capture_ui_pages.py`** | Headless Chrome automated screenshot generator for all application pages. |
| **`capture_theme_compare.py`** | Captures side-by-side comparisons of Light Mode vs Dark Mode. |
| **`capture_ui_matrix.py`** | Multi-resolution viewport verification. |
| **`capture_verification_demo.py`** | Captures municipal repair before/after verification flow. |
| **`check_ui.py`** | Automated DOM element assertion and error boundary checker. |
| **`check_i18n_keys.py`** | Verifies translation dictionary key completeness across all 6 languages. |

---

### 4. 📦 Data Ingestion, Seeding & Backups
| Script | Description |
| :--- | :--- |
| **`seed_demo_data.py`** | Populates database with sample corridors, defects, and work orders. |
| **`ingest_real_rdd_data.py`** | Imports real Road Damage Dataset (RDD2022) annotations. |
| **`prepare_local_sample.py`** | Normalizes user-submitted test photos for edge benchmarking. |
| **`backup_restore_drill.py`** | Validates PostgreSQL database disaster recovery and snapshot restore. |

---

### 5. 🔬 Targeted Test & Regression Scripts
| Script | Description |
| :--- | :--- |
| **`test_images3.py`** | Tests the Bengaluru arterial multi-pothole scenario. |
| **`test_image4_boxes.py`** | Tests ASTM D6433 alligator fatigue crack de-confliction. |
| **`test_diagram_cluster.py`** | Tests the civil engineering distress diagram scenario. |
| **`test_whatsapp.py`** | Tests low-bitrate compressed mobile field uploads. |
| **`test_label_deconflict.py`** | Verifies collision-free bounding box label placements. |
| **`test_complete_fusion.py`** | Integration test for multi-model spatial IoU fusion. |
