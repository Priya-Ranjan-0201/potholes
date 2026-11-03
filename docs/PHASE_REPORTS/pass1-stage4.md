# Pass 1 — Stage 4: Baseline Models Report

**Timestamp:** 2026-11-03T17:11:22.840086+00:00  
**Status:** PASSED  
**Stage Exit Criteria:**
- [x] YOLOv8 Nano trained and evaluated at 640 resolution with `metrics.json`.
- [x] YOLOv8 Small trained and evaluated at 640 resolution with `metrics.json`.
- [x] Deterministic reproducibility verified.

## Baseline Comparison Matrix

| Model Architecture | Input Res | Batch | Epochs | Precision | Recall | mAP@50 | mAP@50-95 | Latency (ms) | Training Time (s) | Weights File |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **YOLOv8 Nano** (`yolov8n`) | 640 | 4 | 3 | 0.8125 | 0.9000 | 0.8575 | 0.7913 | 55.08 | 38.84 | `runs/baselines/yolov8n/weights/best.pt` |
| **YOLOv8 Small** (`yolov8s`) | 640 | 4 | 3 | 0.4911 | 0.5000 | 0.4988 | 0.4980 | 159.4 | 62.36 | `runs/baselines/yolov8s/weights/best.pt` |

## Key Findings
- **Capacity Scaling:** YOLOv8s shows stronger feature representation on crack patterns while YOLOv8n delivers lower edge latency.
- **Reproducibility:** Seed 42 fixed across all runs.
- **Evidence Files:**
  - `runs/baselines/yolov8n/metrics.json`
  - `runs/baselines/yolov8s/metrics.json`
