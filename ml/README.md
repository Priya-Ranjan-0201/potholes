# ScamRoad — Machine Learning Pipeline & Weights

Machine learning directory containing ONNX/PyTorch weights, dataset conversion and audit tools, training pipelines, and the 70/30 inference ensemble configuration.

---

## Active Model Weights (`ml/weights/` & Exported Runs)

| Model Weight File | Architecture | File Size on Disk | Source / Reference | Role in Ensemble |
| :--- | :--- | :--- | :--- | :--- |
| `ml/weights/pavimentos_dfine_l.onnx` | D-FINE Large (DETR) | 119.50 MB | `Kodjaoglanian/pavimentos-dfine-l` | **70% Weightage:** Primary pothole detector |
| `ml/weights/pyresearch_pothole_best.onnx` | YOLOv12s (`pyresearch_pothole_best.pt` 17.77 MB) | 35.26 MB | `pyresearch/Pothole-Computer-Vision-Project` | **70% Weightage:** Secondary dense pothole extractor |
| `ml/weights/yolov8n_seg_pothole.onnx` | YOLOv8n-Seg (`yolov8n_seg_pothole.pt` 6.44 MB) | 12.67 MB | `keremberke/yolov8n-pothole-segmentation` | **70% Weightage:** Instance segmentation masks and contours |
| `ml/weights/coco_scene_blocker.onnx` | YOLOv11n (COCO) | 10.24 MB | Ultralytics COCO | **Scene Gate:** Suppresses detections overlapping vehicles, pedestrians, and signs |
| `runs/export/best_yolo11_int8.onnx` | YOLO11n INT8 (`best_int8.onnx` 2.87 MB, `best.onnx` 10.11 MB) | 2.87 MB | ScamRoad Edge Training Pipeline | **30% Weightage:** Calibrated edge pothole detector |
| `ml/runs/pothole_yolov8n/weights/best.onnx` | YOLOv8n Multi-Class (`best_int8.onnx` 3.32 MB) | 12.18 MB | RDD2022-India Training Run | **30% Weightage:** Surface crack classifier (alligator, longitudinal, transverse) |

---

## 70/30 Ensemble Confidence Fusion

When a 70%-group candidate overlaps a 30%-group edge candidate ($\text{IoU} > 0.20$):

$$C_{\text{fused}} = 0.70 \times C_{\text{new}} + 0.30 \times C_{\text{base}}$$

- Unmatched 70%-group candidates: $C_{\text{fused}} = 0.70 \times C_{\text{new}}$.
- Unmatched 30%-group edge candidates: $C_{\text{fused}} = 0.30 \times C_{\text{base}} + 0.70 \times (0.85 \times C_{\text{base}})$.

---

## Subdirectories

- `weights/`: Active ONNX and PyTorch model weights loaded by `backend/app/api/v1/infer.py`.
- `data/`: Dataset ingestion, annotation conversion (`convert.py`), cleaning, and integrity audits (`audit.py`).
- `training/`: YOLO training entrypoints and configuration profiles.
- `evaluation/`: mAP@50, precision/recall, calibration, and confusion matrix evaluators.
- `quantization/`: ONNX Runtime INT8 post-training quantization scripts.
- `runs/`: Checkpoints, provenance records, and evaluation outputs (`metrics.json`, `ablation.json`).
