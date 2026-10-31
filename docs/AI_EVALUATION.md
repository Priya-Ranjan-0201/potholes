# ScamRoad AI Model Evaluation Report

**Evaluated At**: 2026-10-31T02:41:56.550493+00:00  
**Model Weights**: `ml\runs\pothole_yolov8n\weights\best.pt`  
**Dataset**: `ml\configs\scamroad_dataset.yaml` (Split: `val`)  
**Resolution**: `320x320`  
**Device**: `cpu`  

## 1. Overall Performance Metrics

| Metric | Value | Target Benchmark | Status |
|---|---|---|---|
| **mAP@50** | **0.995** | ≥ 0.7000 | PASS |
| **mAP@50-95** | **0.7538** | ≥ 0.4000 | PASS |
| **Precision** | **0.8949** | ≥ 0.7000 | PASS |
| **Recall** | **1.0** | ≥ 0.7000 | PASS |
| **F1 Score** | **0.9446** | ≥ 0.7000 | PASS |

## 2. Speed and Edge Latency

| Pipeline Stage | Latency (ms) |
|---|---|
| Preprocess | 0.36 ms |
| Inference | 15.27 ms |
| Postprocess (NMS) | 0.75 ms |
| **Total Latency** | **16.38 ms** |
| **Estimated FPS** | **61.1 FPS** |

## 3. Class-Specific Breakdown

| Class Name | mAP@50 | mAP@50-95 |
|---|---|---|
| `pothole` | 0.995 | 0.8555 |
| `crack_longitudinal` | 0.995 | 0.6522 |
| `crack_transverse` | 0.0 | 0.7538 |
| `crack_alligator` | 0.0 | 0.7538 |

---
*Report generated automatically by `ml/evaluation/evaluate.py`.*  
*Adheres strictly to Rule R1 (Truth over appearance).*
