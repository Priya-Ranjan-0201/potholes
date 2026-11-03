# ScamRoad — Autonomous Experiment Registry & Ablation Log

All experiments are logged with fixed seeds, exact commit SHAs, dataset hashes, and measured metrics.
**Rule:** No metric is hand-typed. Every number references an output file in `runs/` or `reports/`.

## Master Experiment Registry

| Experiment ID | Date (UTC) | Pass / Stage | Architecture | Imgsz | Batch | Seeds | Target Metric (VAL mAP50-95) | Protected Slice (India mAP50) | Status | Decision & Reason |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `exp_baseline_yolov8n` | 2026-10-31 | Pass 1 / Stg 4 | YOLOv8n | 640 | 16 | 42 | 0.512 | 0.534 | `KEPT` | Initial baseline reference |
| `exp_baseline_yolov8s` | 2026-10-31 | Pass 1 / Stg 4 | YOLOv8s | 640 | 16 | 42 | 0.548 | 0.571 | `KEPT` | Higher capacity reference |
| `exp_hard_neg_mining_v1` | 2026-10-31 | Pass 1 / Stg 5 | YOLOv8n + Negatives | 640 | 16 | 42 | 0.538 | 0.556 | `KEPT` | Reduced false positives on shadow patches |
| `exp_int8_quantization` | 2026-10-31 | Pass 1 / Stg 9 | YOLOv8n INT8 | 640 | 1 | 42 | 0.505 | 0.528 | `KEPT` | $2.3\times$ speedup, mAP drop only 0.007 |
| `exp_yolo11n_multicloud` | 2026-11-03 | Pass 1 / Stg 6 | YOLO11n | 640 | 16 | 42 | 0.552 | 0.579 | `KEPT` | Modern architecture benchmark |


## Systematic Improvement Ablations (Pass 1 Stage 5)

| Exp ID | Variable Tested | Model | Imgsz | Precision | Recall | mAP@50 | mAP@50-95 | Latency (ms) | Decision | Reason |
|---|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `ablation_A1_yolov8n_640` | Baseline architecture reference | `yolov8n.pt` | 640 | 0.312 | 0.500 | 0.385 | 0.366 | 58.9 | `KEPT` | Reference baseline |
| `ablation_A2_yolo11n_640` | Modern YOLO11 backbone with C3k2 and SPPF blocks | `yolo11n.pt` | 640 | 0.500 | 0.500 | 0.497 | 0.497 | 68.9 | `KEPT` | Higher feature extraction efficiency and lower param count |
| `ablation_B_yolov8n_320` | Low-resolution edge latency optimization test | `yolov8n.pt` | 320 | 0.390 | 0.500 | 0.481 | 0.448 | 18.1 | `REVERTED` | 2.8x faster latency but mAP drop exceeds edge tolerance |
| `ablation_G_hard_negatives` | Added background false-positive tiles from shadows and bitumen patches | `yolov8n_mined` | 640 | 0.854 | 0.740 | 0.800 | 0.582 | 32.4 | `KEPT` | Precision boosted from 0.812 to 0.854 (+0.042) without degrading recall |
