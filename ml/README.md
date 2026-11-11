# ScamRoad — Machine Learning Pipeline & Weights Registry

Machine-learning directory housing model weights, training scripts, ONNX quantization pipelines, and the **70/30 Multi-Model Ensemble**.

---

## 🎯 Active Model Weights (`ml/weights/`)

| Model Weight File | Architecture | Parameters | Source / Reference | Role & Weightage |
| :--- | :--- | :--- | :--- | :--- |
| **`pavimentos_dfine_l.onnx`** | D-FINE Large (DETR Transformer) | ~31M (125 MB) | `Kodjaoglanian/pavimentos-dfine-l` | **70% Weightage:** SOTA Pavement transformer trained with Hard-Negative Mining |
| **`pyresearch_pothole_best.onnx`** | YOLOv12s with Area-Attention | 9.1M (35 MB) | `pyresearch/Pothole-Computer-Vision-Project` | **70% Weightage:** Dense feature extractor with PyResearch tracking |
| **`yolov8n_seg_pothole.onnx`** | YOLOv8n-Seg (Instance Segmentation) | 3.2M (12.7 MB) | `keremberke/yolov8n-pothole-segmentation` | **70% Weightage:** Generates organic polygonal cavity boundary contours |
| **`runs/export/best_yolo11_int8.onnx`** | YOLO11n INT8 Quantized | 2.6M (2.6 MB) | ScamRoad Edge Training Pipeline | **30% Weightage:** Edge engine calibrated on monsoon waterlogged roads |
| **`ml/runs/pothole_yolov8n/weights/best.onnx`** | YOLOv8n Multi-Class | 3.2M (6.4 MB) | RDD2022 Indian Road Damage Dataset | **30% Weightage:** ASTM D6433 Cracks (Alligator, Longitudinal, Transverse) |

---

## ⚖️ 70/30 Ensemble Weightage

$$\begin{aligned}
C_{\text{fused}} &= 0.70 \times C_{\text{new}} + 0.30 \times C_{\text{base}} \quad &&(\text{when spatial IoU} > 0.20) \\
C_{\text{fused}} &= 0.70 \times C_{\text{new}} \quad &&(\text{unmatched new model candidates}) \\
C_{\text{fused}} &= 0.30 \times C_{\text{base}} + 0.70 \times (0.85 \times C_{\text{base}}) \quad &&(\text{unmatched base edge candidates})
\end{aligned}$$

---

## 📂 Subdirectories

- **`weights/`**: Active ONNX and PyTorch weights for runtime inference.
- **`data/`**: Dataset ingestion, conversion to YOLO format, and verification audits.
- **`training/`**: Model training scripts and hyperparameter configurations.
- **`evaluation/`**: mAP@50 calculation, PR curves, and confusion matrix generators.
- **`quantization/`**: INT8 post-training quantization routines using ONNX Runtime.
- **`runs/`**: Checkpoints and evaluation run outputs.
