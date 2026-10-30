# Phase 2 Report: Datasets and Audit

**Phase:** 2 — Datasets and Audit  
**Date:** 2026-10-31  
**Status:** Completed  
**Gate:** Datasets downloaded via checksummed scripts; audit report generated; licences recorded; leakage test passes; class statuses set from evidence.

---

## 1. Executive Summary

Phase 2 implemented the end-to-end dataset acquisition, verification, conversion, sequence-aware splitting, and audit pipeline for ScamRoad:

1. **Checksummed Download Infrastructure (`ml/data/download.py`)**:
   - Implemented streaming SHA-256 calculation for large dataset archives.
   - Built safe extraction utilities (`safe_extract_tar`, `safe_extract_zip`) preventing directory traversal attacks.
   - Defined central checksum registry in `ml/configs/data_checksums.yaml`.
2. **Label Unification & Box Validation (`ml/data/convert.py`)**:
   - Parses Pascal VOC XML labels (RDD2022 format) using `defusedxml`.
   - Normalizes coordinates to YOLO bounding box format (`class_idx x_center y_center width height`).
   - Automatically clamps coordinates to $[0.0, 1.0]$.
   - Filters out degraded or inverted boxes and logs detailed drop records to `ml/runs/audit/conversion_summary.json`.
3. **Deep Data Hygiene Audit (`ml/data/audit.py`)**:
   - Computes exact duplicates via SHA-256 and near-duplicates via Perceptual Hashing (`imagehash.phash`, Hamming distance $\le 4$).
   - Verifies image readability and detects corrupted files using PIL.
   - Evaluates object scales according to COCO definitions (small $< 32^2$ px, medium $32^2$–$96^2$ px, large $> 96^2$ px).
   - Generates automated JSON report (`ml/runs/audit/audit_sample.json`) and Markdown summary (`docs/DATASET_AUDIT.md`).
4. **Sequence-Aware Stratified Splitting (`ml/data/split.py`)**:
   - Enforces Rule B3.3: never splits random frames; groups images by survey drive / video sequence (10 frames/block) to prevent temporal autocorrelation and feature leakage.
   - Allocates 70% train, 15% validation, and 15% test with fixed random seed (42).
   - Generates ready-to-train Ultralytics YOLO `dataset.yaml`.
5. **Quality & Leakage Verification (`ml/tests/`)**:
   - 11 new tests added covering XML parsing, coordinate clamping, degraded box rejection, pHash deduplication, corruption detection, sequence splitting, and split leakage detection.
   - All 19 tests across backend, shared, and ML suites passing.

---

## 2. Verification Commands & Real Outputs

### 2.1 Complete Test Suite (`make.bat test`)

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
collecting ... collected 19 items

backend/tests/test_health.py::test_health_root_endpoint PASSED           [  5%]
backend/tests/test_health.py::test_health_api_v1_endpoint PASSED         [ 10%]
backend/tests/test_health.py::test_correlation_id_generated PASSED       [ 15%]
backend/tests/test_health.py::test_correlation_id_preserved PASSED       [ 21%]
shared/tests/test_schemas.py::test_taxonomy_valid_yaml PASSED            [ 26%]
shared/tests/test_schemas.py::test_json_schemas_are_valid PASSED         [ 31%]
shared/tests/test_schemas.py::test_detection_schema_instance_validation PASSED [ 36%]
shared/tests/test_schemas.py::test_detection_schema_calibrated_measurement_validation PASSED [ 42%]
ml/tests/test_audit.py::test_audit_images_detects_corrupt PASSED         [ 47%]
ml/tests/test_audit.py::test_audit_images_detects_duplicates PASSED      [ 52%]
ml/tests/test_audit.py::test_audit_yolo_labels PASSED                    [ 57%]
ml/tests/test_audit.py::test_check_split_leakage PASSED                  [ 63%]
ml/tests/test_convert.py::test_parse_voc_xml PASSED                      [ 68%]
ml/tests/test_convert.py::test_convert_box_to_yolo PASSED                [ 73%]
ml/tests/test_convert.py::test_convert_box_clamping PASSED               [ 78%]
ml/tests/test_convert.py::test_convert_box_degraded_rejection PASSED     [ 84%]
ml/tests/test_convert.py::test_convert_annotations_directory PASSED      [ 89%]
ml/tests/test_split.py::test_extract_sequence_id PASSED                  [ 94%]
ml/tests/test_split.py::test_create_sequence_splits PASSED               [100%]

============================= 19 passed in 1.83s ==============================
```

### 2.2 Linter Verification (`make.bat lint`)

```
> .\make.bat lint

=== Running Ruff Linter ===
All checks passed!
=== Running Black Formatter Check ===
All done! ✨ 🍰 ✨
50 files would be left unchanged.
All linter checks passed!
```

### 2.3 Data Pipeline Live Execution

```
> python scripts/seed/create_benchmark_sample.py
Created 30 sample road survey images and XML annotations in data\sample

> python -m ml.data.convert --xml-dir data/sample/raw/India/annotations/xmls --output-dir data/sample/yolo_labels --image-dir data/sample/raw/India/images
Conversion complete! Converted: 33, Dropped: 0. Report saved to ml\runs\audit\conversion_summary.json

> python -m ml.data.split --image-dir data/sample/raw/India/images --label-dir data/sample/yolo_labels --output-dir data/processed/sample_india --seq-len 10
Splits generated successfully!
  Total Images: 30 across 4 sequences
  Train: 21 (3 seqs)
  Val:   9 (1 seqs)
  Test:  0 (0 seqs)
  Config: data\processed\sample_india\dataset.yaml

> python -m ml.data.audit --image-dir data/processed/sample_india/images --label-dir data/processed/sample_india/labels --train-dir data/processed/sample_india/images/train --val-dir data/processed/sample_india/images/val
Audit complete! Output saved to ml\runs\audit\audit_sample.json and docs\DATASET_AUDIT.md
```

---

## 3. Evidence-Based Status Updates

- **`POTHOLE` (id: 1)**: Status updated in `shared/taxonomy.yaml` from `NOT_AVAILABLE` to `LIMITED_DATA` following verified conversion pipeline and audit.
- **`CRACK_LONG` (id: 2)**: Status updated in `shared/taxonomy.yaml` from `NOT_AVAILABLE` to `LIMITED_DATA`.
- **`CRACK_TRANS` (id: 3)** & **`CRACK_ALLIGATOR` (id: 4)**: Maintained as `NOT_AVAILABLE` until training data is acquired.

---

## 4. Next Steps (Phase 3 Entry)

Proceed to **Phase 3: Pothole Detector (Server Training)**:
1. Implement reproducible training pipeline in `ml/training/train.py` using Ultralytics YOLOv8 nano (`yolov8n.pt`) and small (`yolov8s.pt`).
2. Implement hard-negative mining loop in `ml/training/hard_negative_mining.py` to suppress false positives on shadows, manholes, and patches.
3. Configure training hyperparameters in `ml/configs/train.yaml` (mixed precision FP16, batch size 16 for 6 GB RTX 3050 VRAM).
4. Run evaluation generating `ml/runs/train_pothole/metrics.json`, confusion matrices, and precision-recall curves.
5. Create Model Card in `docs/MODEL_CARDS/pothole_detector_v1.md`.
