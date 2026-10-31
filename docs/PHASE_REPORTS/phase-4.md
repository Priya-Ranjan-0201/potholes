# ScamRoad Phase 4 Report — Model Export, Quantization & Edge Benchmarking

**Phase**: 4 — Model Export, Quantization & Edge Benchmarking  
**Date**: 2026-10-31  
**Status**: COMPLETE  
**Git Tag**: `phase-4-complete`  

---

## 1. Executive Summary
Phase 4 delivers the complete edge export and optimization pipeline for ScamRoad. It bridges the trained PyTorch YOLOv8 models into high-performance, edge-deployable artifacts (ONNX with pinned opset 17, dynamic batching, and INT8 post-training quantization with real road calibration data). It also introduces a deterministic device benchmarking suite measuring inference latency percentiles, memory RSS footprint, throughput (FPS), and hardware telemetry on edge targets (Android / OPPO K13, Raspberry Pi, Jetson, and laptop workstations) in strict compliance with Rule R1 (Truth over appearance).

---

## 2. Key Deliverables Built

### 2.1 Model Export Pipeline
- [`ml/export/export_onnx.py`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/export/export_onnx.py):
  - Converts PyTorch `.pt` checkpoints to optimized ONNX graphs (opset 17 pinned) and TFLite models.
  - Supports dynamic batch/resolution axes and half-precision (FP16).
  - Validates exported ONNX graph integrity, inputs, and outputs with `onnx.checker.check_model`.
  - Calculates artifact checksums (SHA-256) and generates `export_onnx_summary.json`.

### 2.2 Post-Training Quantization & Calibration
- [`ml/quantization/quantize.py`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/quantization/quantize.py):
  - Post-training quantization (PTQ) to INT8 precision using ONNX Runtime.
  - Implements `RoadCalibrationDataReader` to feed normalized, preprocessed real road imagery batches (`[1, 3, 640, 640]`) to static QDQ calibrator (`QuantFormat.QDQ`, `QuantType.QUInt8`, `QuantType.QInt8`).
  - Supports dynamic quantization as fallback when uncalibrated.
  - Computes exact file compression percentages and outputs structured reports (`quantization_int8_report.json`).

### 2.3 Device Edge Benchmark Suite
- [`edge/benchmarks/run_benchmark.py`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/edge/benchmarks/run_benchmark.py):
  - Measures execution provider latencies (`CPUExecutionProvider`, `CUDAExecutionProvider`).
  - Implements configurable warmup iterations to avoid JIT/cache skew.
  - Reports latency statistics: mean, standard deviation, min, max, median (p50), p90, p95, p99 (in ms).
  - Measures throughput (FPS) and peak process RSS memory in MB using `psutil`.
  - Captures hardware telemetry: logical/physical CPU cores, system RAM, CPU utilization, and thermal sensors.
  - Outputs structured JSON results to `edge/benchmarks/results/<device>_<model>_bench.json`.

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
collected 52 items

backend/tests/test_health.py               4 passed
backend/tests/test_migrations.py           3 passed
backend/tests/test_models.py               3 passed
edge/tests/test_benchmark.py               2 passed
edge/tests/test_outbox.py                  6 passed
ml/tests/test_audit.py                     4 passed
ml/tests/test_convert.py                   5 passed
ml/tests/test_evaluate.py                  2 passed
ml/tests/test_export.py                    4 passed
ml/tests/test_hard_negatives.py            2 passed
ml/tests/test_quantize.py                  4 passed
ml/tests/test_split.py                     2 passed
ml/tests/test_train.py                     7 passed
shared/tests/test_schemas.py               4 passed
============================= 52 passed in 8.58s ==============================
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
66 files would be left unchanged.
All linter checks passed!
```

---

## 4. Next Steps (Phase 5 — Edge Agent & Phone Companion)
1. **Edge Agent Capture Loop (`edge/agent/capture.py`)**:
   - Camera input stream (OpenCV video capture / phone camera feed).
   - Quality gate: blur detection (Laplacian variance) and exposure validation.
   - Region of Interest (ROI) dynamic cropping for road surface perspective.
2. **Real-Time Edge Inference & Tracking (`edge/agent/infer.py`, `track.py`)**:
   - Integrated ONNX Runtime inference engine.
   - ByteTrack multi-frame object association with ego-motion compensation.
   - Best-frame selection (highest confidence × area × sharpness) and defect consolidation.
3. **Privacy Redaction (`edge/agent/privacy.py`)**:
   - Automated face and license plate redaction before local storage or sync (Rule R15).
4. **Offline Sync Integration (`edge/agent/sync.py`)**:
   - Connects edge tracker output to SQLite WAL outbox (`edge/agent/outbox.py`) and syncs to backend `/api/v1/sync`.

