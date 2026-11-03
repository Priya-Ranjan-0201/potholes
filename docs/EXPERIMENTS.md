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
