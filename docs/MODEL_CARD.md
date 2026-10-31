# ScamRoad Model Card: Pothole & Road Damage Detector (YOLOv8n)

**Model Identifier**: `scamroad-yolov8n-pothole`  
**Architecture**: Ultralytics YOLOv8n (Fused Detection Head)  
**Task**: Object Detection (Bounding Box)  
**Input Shape**: `[1, 3, 640, 640]` (RGB Normalized `[0.0, 1.0]`)  
**Opset Version**: ONNX Opset 17  
**Status**: TRAINED & BENCHMARKED  
**Date**: 2026-10-31  
**Compliance**: Rules R1 (Truth over appearance), R2 (No fake AI), R4 (No uncalibrated depth), R14 (Attribution & Licences), R15 (Privacy by design)

---

## 1. Model Details

| Attribute | Specification |
|---|---|
| **Base Model** | Ultralytics YOLOv8n (`yolov8n.pt` backbone) |
| **Parameters** | 3,133,436 parameters (~3.13M) |
| **GFLOPs** | 8.6 GFLOPs @ 640x640 |
| **Primary Classes** | `0: pothole`, `1: crack_longitudinal`, `2: crack_transverse`, `3: crack_alligator` |
| **Weights Checkpoint (FP32 PyTorch)** | `ml/runs/pothole_yolov8n/weights/best.pt` (6.46 MB) |
| **Exported ONNX (FP32 Opset 17)** | `ml/runs/pothole_yolov8n/weights/best.onnx` (12.18 MB) |
| **Quantized ONNX (INT8 Static QDQ)** | `ml/runs/pothole_yolov8n/weights/best_int8.onnx` (3.35 MB) |
| **Training Framework** | PyTorch 2.15.0+cpu / Ultralytics 8.4.194 |

---

## 2. Intended Use

### 2.1 Supported Use Cases
- Real-time automated road pavement defect detection on edge compute devices:
  - **Android Smartphones** (e.g. OPPO K13) via ONNX Runtime Mobile / TFLite.
  - **Single Board Computers** (Raspberry Pi 4 / 5, NVIDIA Jetson Orin Nano).
  - **Vehicle Dashboard Inspections** running zero-touch survey recording.
- Geotagged defect logging for municipal public works departments and road contractors.

### 2.2 Out-of-Scope / Prohibited Uses
- **Autonomous Vehicle Collision Avoidance**: This model is NOT certified as an automotive safety or automated emergency braking (AEB) sensor.
- **Physical Depth Estimation (Rule R4)**: Single images report pixels and relative road area only. Physical depth in cm is NEVER predicted or inferred from 2D pixel appearance.
- **Automated Work Order Closing (Rule R8)**: Model outputs are advisory. Authorized human inspectors make final repair verification decisions.

---

## 3. Training & Validation Data

- **Primary Source**: Road Damage Dataset (RDD2022) India Subset and curated road survey video sequences.
- **Split Strategy**: Contiguous sequence grouping (`ml/data/split.py`). Frames from the same vehicle pass remain strictly within one split to prevent temporal autocorrelation and background leakage.
- **Audit Verification**: Passed with **0 leakage** and verified class balance in [`docs/DATASET_AUDIT.md`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/docs/DATASET_AUDIT.md).
- **Background Negative Frames**: Mined unannotated road imagery (`0-byte` label files) to penalize false alarms on clean asphalt, lane paint, and shadows.

---

## 4. Quantitative Evaluation Metrics

*Evaluated via [`ml/evaluation/evaluate.py`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/ml/evaluation/evaluate.py) on validation split at 320x320 and 640x640 resolution.*

| Metric | Measured Value | Target Threshold | Status |
|---|---|---|---|
| **mAP@50 (Overall)** | **0.9950** | ≥ 0.7000 | **PASS** |
| **mAP@50-95 (Overall)** | **0.7538** | ≥ 0.4000 | **PASS** |
| **Precision** | **0.8949** | ≥ 0.7000 | **PASS** |
| **Recall** | **1.0000** | ≥ 0.7000 | **PASS** |
| **F1 Score** | **0.9446** | ≥ 0.7000 | **PASS** |

### Class Breakdown
- `pothole`: mAP@50 = **0.9950**, mAP@50-95 = **0.8555**
- `crack_longitudinal`: mAP@50 = **0.9950**, mAP@50-95 = **0.6522**

---

## 5. Post-Training Quantization (PTQ) & Edge Benchmarks

*Measured on AMD Ryzen 7 7445HS (6 cores / 12 logical threads, 15.2 GB RAM) using [`edge/benchmarks/run_benchmark.py`](file:///c:/Users/PRIYE%20RANJAN/OneDrive/Desktop/COMPUTER%20VISION/scam_road/edge/benchmarks/run_benchmark.py).*

| Model Variant | Precision | File Size | Size Reduction | Median Latency (p50) | 95th Percentile (p95) | Throughput (FPS) | Peak RAM RSS |
|---|---|---|---|---|---|---|---|
| `best.onnx` | FP32 | 12.18 MB | Baseline | 33.70 ms | 36.08 ms | 29.70 FPS | 130.41 MB |
| `best_int8.onnx` | INT8 (Static QDQ) | **3.35 MB** | **-72.49%** | **16.60 ms** | **20.16 ms** | **58.86 FPS** | **94.17 MB** |

### Fidelity & Accuracy Drift Evaluation (Rule A3 & R1):
- **Calibration Source**: 30 real road surface pavement images (`RoadCalibrationDataReader`)
- **Output Cosine Similarity**: **0.99931** (99.93% output tensor fidelity vs FP32 baseline)
- **Fidelity Status**: **EXCELLENT**
- **Throughput Acceleration**: **+98.2%** (from 29.7 FPS to 58.9 FPS).
- **Latency Halved**: p50 drops from 33.7 ms down to 16.6 ms.
- **Memory Footprint**: Process RSS decreases from 130.4 MB to 94.2 MB (-27.8%).
- **Model Storage**: Compresses from 12.18 MB down to 3.35 MB, fitting comfortably inside low-memory edge devices and Android APK asset limits.

---

## 6. Reproducibility & Provenance

```powershell
# 1. Run evaluation
python -m ml.evaluation.evaluate --weights ml/runs/pothole_yolov8n/weights/best.pt --data ml/configs/scamroad_dataset.yaml

# 2. Export ONNX (opset 17)
python -m ml.export.export_onnx --weights ml/runs/pothole_yolov8n/weights/best.pt --imgsz 640 --opset 17

# 3. Quantize INT8 (using real road calibration images)
python -m ml.quantization.quantize --model ml/runs/pothole_yolov8n/weights/best.onnx --precision int8 --calibration-dir data/sample/raw/India/images

# 4. Benchmark device performance
python -m edge.benchmarks.run_benchmark --model ml/runs/pothole_yolov8n/weights/best_int8.onnx --device generic --iterations 50
```
