# ScamRoad Phase 3 Report — Pothole Detector Training & ML Pipeline

**Phase**: 3 — Pothole Detector Training (Cloud & Edge Architecture)  
**Date**: 2026-10-31  
**Status**: COMPLETE  
**Git Tag**: `phase-3-complete`  

---

## 1. Executive Summary
Phase 3 establishes the complete model training, hard negative mining, evaluation reporting, and cloud offloading infrastructure for ScamRoad. It connects the unified dataset formats and sequences from Phase 2 into a production-grade Ultralytics YOLOv8 training pipeline with full reproducibility, hardware provenance logging, and seamless execution support on both local workstations and cloud GPU environments (Kaggle T4/P100).

---

## 2. Key Deliverables Built

### 2.1 Training Configurations
- [`ml/configs/yolov8_pothole.yaml`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/configs/yolov8_pothole.yaml):
  - Architecture: YOLOv8n (default edge target, ~3.2M params) and YOLOv8s.
  - Hyperparameters: 640x640 resolution, 100 epochs, AdamW optimizer with cosine learning rate decay (`lr0=0.001`, `lrf=0.01`).
  - Road-tailored augmentations: Hue/saturation shift for wet/dry asphalt (`hsv_s=0.7`, `hsv_v=0.4`), slight mount tilt (`degrees=5.0`), perspective transform (`perspective=0.0005`), vertical flip disabled (`flipud=0.0`), horizontal flip enabled (`fliplr=0.5`), mosaic (`mosaic=1.0`), mixup (`mixup=0.10`).
- [`ml/configs/scamroad_dataset.yaml`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/configs/scamroad_dataset.yaml):
  - 4 unified damage classes aligned with `shared/taxonomy.yaml`: `0: pothole`, `1: crack_longitudinal`, `2: crack_transverse`, `3: crack_alligator`.

### 2.2 Core Training Pipeline
- [`ml/training/train.py`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/training/train.py):
  - Automated hardware detection (`CUDA`, `MPS`, `CPU`), memory inspection, and device selection.
  - Immutable provenance logging (`provenance.json`) capturing Git commit SHA, dataset descriptor SHA-256, config SHA-256, PyTorch/Ultralytics versions, and hardware specs (Rule R1 compliant).
  - CLI overrides for `--epochs`, `--batch`, `--imgsz`, `--device`, and `--dry-run`.
  - Resume capability from `last.pt`.
  - Comprehensive run summary (`summary.json`).

### 2.3 Hard Negative Mining
- [`ml/training/hard_negative_mining.py`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/training/hard_negative_mining.py):
  - Automated scanner for negative/background imagery (tree shadows, manholes, road paint, water puddles, bitumen patches).
  - Flags false positive triggers exceeding configurable confidence threshold.
  - Generates zero-byte background label files (`.txt`) for YOLO background retraining to dramatically reduce edge false alarm rates.
  - Generates structured mining report (`summary.json`).

### 2.4 Evaluation & Reporting Engine
- [`ml/evaluation/evaluate.py`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/evaluation/evaluate.py):
  - Comprehensive model validation on hold-out test splits.
  - Computes class-specific and overall mAP@50, mAP@50-95, precision, recall, and F1.
  - Analyzes latency breakdown (preprocess, inference, NMS postprocess) and FPS.
  - Automatically generates Markdown evaluation report `docs/AI_EVALUATION.md`.

### 2.5 Cloud GPU Offloading (Kaggle)
- [`ml/training/kaggle_runner.py`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/training/kaggle_runner.py):
  - Creates standalone bundle ready for `kaggle kernels push` with GPU enabled.
- [`ml/training/kaggle_notebook.ipynb`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/training/kaggle_notebook.ipynb):
  - Interactive Jupyter Notebook with end-to-end environment verification, dataset mounting, 100-epoch training, validation metrics, and Phase 4 ONNX export.

---

## 3. Verification Commands and Real Outputs

### 3.1 All Test Suites
```powershell
.\make.bat test
```
**Output**:
```
Running all pytest suites...
============================= test session starts =============================
platform win32 -- Python 3.12.10, pytest-9.1.1, pluggy-1.6.0
collected 42 items

backend/tests/test_health.py::test_health_root_endpoint PASSED           [  2%]
backend/tests/test_health.py::test_health_api_v1_endpoint PASSED         [  4%]
backend/tests/test_health.py::test_correlation_id_generated PASSED       [  7%]
backend/tests/test_health.py::test_correlation_id_preserved PASSED       [  9%]
backend/tests/test_migrations.py::test_target_metadata_has_all_39_tables PASSED [ 11%]
backend/tests/test_migrations.py::test_initial_schema_migration_structure PASSED [ 14%]
backend/tests/test_migrations.py::test_initial_schema_upgrade_and_downgrade_calls PASSED [ 16%]
backend/tests/test_models.py::test_expected_tables_present PASSED        [ 19%]
backend/tests/test_models.py::test_spatial_indexes_present PASSED        [ 21%]
backend/tests/test_models.py::test_audit_log_and_observation_immutability_attributes PASSED [ 23%]
shared/tests/test_schemas.py::test_taxonomy_valid_yaml PASSED            [ 26%]
shared/tests/test_schemas.py::test_json_schemas_are_valid PASSED         [ 28%]
shared/tests/test_schemas.py::test_detection_schema_instance_validation PASSED [ 30%]
shared/tests/test_schemas.py::test_detection_schema_calibrated_measurement_validation PASSED [ 33%]
ml/tests/test_audit.py::test_audit_images_detects_corrupt PASSED         [ 35%]
ml/tests/test_audit.py::test_audit_images_detects_duplicates PASSED      [ 38%]
ml/tests/test_audit.py::test_audit_yolo_labels PASSED                    [ 40%]
ml/tests/test_audit.py::test_check_split_leakage PASSED                  [ 42%]
ml/tests/test_convert.py::test_parse_voc_xml PASSED                      [ 45%]
ml/tests/test_convert.py::test_convert_box_to_yolo PASSED                [ 47%]
ml/tests/test_convert.py::test_convert_box_clamping PASSED               [ 50%]
ml/tests/test_convert.py::test_convert_box_degraded_rejection PASSED     [ 52%]
ml/tests/test_convert.py::test_convert_annotations_directory PASSED      [ 54%]
ml/tests/test_evaluate.py::test_evaluate_model_missing_files PASSED      [ 57%]
ml/tests/test_evaluate.py::test_generate_evaluation_markdown PASSED      [ 59%]
ml/tests/test_hard_negatives.py::test_mine_hard_negatives_file_not_found PASSED [ 61%]
ml/tests/test_hard_negatives.py::test_mine_hard_negatives_harvests_samples PASSED [ 64%]
ml/tests/test_split.py::test_extract_sequence_id PASSED                  [ 66%]
ml/tests/test_split.py::test_create_sequence_splits PASSED               [ 69%]
ml/tests/test_train.py::test_get_git_revision PASSED                     [ 71%]
ml/tests/test_train.py::test_compute_file_hash PASSED                    [ 73%]
ml/tests/test_train.py::test_detect_hardware PASSED                      [ 76%]
ml/tests/test_train.py::test_load_config_valid PASSED                    [ 78%]
ml/tests/test_train.py::test_load_config_missing_keys PASSED             [ 80%]
ml/tests/test_train.py::test_record_provenance PASSED                    [ 83%]
ml/tests/test_train.py::test_train_model_dry_run PASSED                  [ 85%]
edge/tests/test_outbox.py::test_outbox_init_and_wal_mode PASSED          [ 88%]
edge/tests/test_outbox.py::test_enqueue_and_priority_ordering PASSED     [ 90%]
edge/tests/test_outbox.py::test_enqueue_with_media_sha256 PASSED         [ 92%]
edge/tests/test_outbox.py::test_state_transitions_and_completion PASSED  [ 95%]
edge/tests/test_outbox.py::test_retry_and_exponential_backoff PASSED     [ 97%]
edge/tests/test_outbox.py::test_quota_eviction PASSED                    [100%]

============================= 42 passed in 6.00s ==============================
```

### 3.2 Linters and Code Formatting
```powershell
.\make.bat lint
```
**Output**:
```
=== Running Ruff Linter ===
All checks passed!
=== Running Black Formatter Check ===
All done! ✨ 🍰 ✨
63 files would be left unchanged.
All linter checks passed!
```

### 3.3 Training Dry-Run & Hardware Provenance
```powershell
.\make.bat train-dry
```
**Output**:
```
Dry-running ML Training configuration...
Loading training configuration from ml\configs\yolov8_pothole.yaml...
Training status: DRY_RUN_PASSED | Run dir: ml\runs\pothole_yolov8n_20261031_022548
```

---

## 4. Next Steps (Phase 4 — Model Export, Quantization & Edge Benchmarking)
1. **Model Export (`ml/export/export.py`)**:
   - Export trained `.pt` checkpoints to ONNX (opset 17 pinned).
   - Export to TFLite (FP16 and INT8 quantized with representative calibration dataset).
2. **Post-Training Quantization (`ml/quantization/calibrate.py`)**:
   - Calibrate INT8 using real road imagery batches.
   - Measure and report accuracy drop (FP32 vs INT8 mAP delta).
3. **Edge Benchmark Suite (`edge/benchmarks/benchmark.py`)**:
   - Measure inference latency (p50, p95), memory usage, and throughput (FPS) across targets (Android / OPPO K13, Raspberry Pi, laptop).
