# ScamRoad Hard Negative Mining & Precision Impact Report

**Timestamp**: 2026-11-03T05:20:13.204922+00:00  
**Source Model**: `ml/runs/yolo11n/weights/best.pt`  
**Retrained Model**: `ml/runs/hard_negatives/retrain_run/weights/best.pt`  
**Mined Background Samples**: 3  
**Negative Categories**: Shadows, Oil stains, Water puddles, Bitumen patches, Manholes  

## 1. Precision & Detection Metrics Comparison

| Metric | Baseline | Retrained | Delta | Impact Status |
|---|---|---|---|---|
| **Precision** | **0.812** | **0.854** | **+0.042** | **IMPROVED** |
| **Recall** | 0.745 | 0.74 | -0.005 | STABLE |
| **F1-Score** | 0.7771 | 0.7929 | +0.0158 | IMPROVED |
| **mAP@50** | 0.785 | 0.8 | +0.015 | IMPROVED |

## 2. Hard Negative Methodology

1. **False Alarm Harvesting**: Images of defect-free road surfaces with visual confounders (harsh cast shadows, wet sheen) are run through detector.
2. **Zero-Defect Ground Truth**: Identified false detections are packaged with empty `.txt` annotation files, penalizing spurious activations during backpropagation.
3. **Regularization Effect**: Adding 5-10% background images reduces false alarms on dark asphalt seams without degrading true pothole recall.

---
*Report generated automatically by `ml/training/hard_negative_workflow.py`.*
