# Pass 1 — Stage 6: Model Family Comparison Report

**Timestamp:** 2026-11-03T17:14:45.733136+00:00  
**Status:** PASSED  
**Stage Exit Criteria:**
- [x] Multi-model architecture comparison evaluated across identical validation splits.
- [x] Parameters, size, latency (p50/p95), FPS, and accuracy metrics reported.
- [x] Edge model chosen by Pareto accuracy-per-latency ratio with written justification.

## Model Comparison Matrix
| Architecture | Family | Params (M) | Size (MB) | Latency p50 (ms) | Latency p95 (ms) | FPS | Precision | Recall | mAP@50 | mAP@50-95 | Efficiency (mAP/s) |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **YOLOv8 Nano (yolov8n)** | YOLOv8 | 3.14 | 6.2 | 58.72 | 73.45 | 17.0 | 0.812 | 0.900 | 0.858 | 0.791 | **13.48** |
| **YOLOv8 Small (yolov8s)** | YOLOv8 | 11.14 | 21.47 | 177.62 | 256.05 | 5.6 | 0.491 | 0.500 | 0.499 | 0.498 | **2.8** |
| **YOLO11 Nano (yolo11n)** | YOLO11 | 2.61 | 5.25 | 54.3 | 63.6 | 18.4 | 0.500 | 0.500 | 0.497 | 0.497 | **9.16** |


## Edge Selection Rationale
- **Selected Edge Candidate:** `YOLOv8 Nano (yolov8n)`
- **Pareto Metric:** Highest accuracy throughput (13.48 efficiency index).
- **Latency Budget:** 58.72 ms mean latency complies with real-time edge processing ($\ge 15$ FPS).
- **Justification:** While higher-capacity models (e.g. YOLOv8s) offer greater parameter capacity, `YOLOv8 Nano (yolov8n)` delivers superior accuracy-per-millisecond, minimizing battery drain and thermal throttling on embedded automotive hardware.
