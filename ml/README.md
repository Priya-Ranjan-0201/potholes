# ScamRoad — ML Pipeline

Machine-learning pipeline for training, evaluating, exporting, and quantising road-defect detection models.

## Directory Layout

| Directory | Purpose |
|---|---|
| `data/` | Dataset download, conversion, and audit utilities |
| `configs/` | Training & experiment YAML configs |
| `training/` | YOLO training scripts |
| `evaluation/` | mAP, PR curves, confusion-matrix evaluation |
| `export/` | ONNX / TFLite export helpers |
| `quantization/` | INT8 / FP16 quantisation scripts |
| `severity/` | Severity-scoring models (Phase 6) |
| `tracking/` | Multi-object tracker integration (Phase 5) |
| `forecasting/` | Deterioration-rate forecasting (Phase 7) |
| `registry/` | Model registry & versioning helpers |
| `runs/` | Training run artifacts (git-ignored) |

## Quick Start

```bash
# audit a dataset
python -m ml.data.audit --data-dir ./datasets/potholes

# train
python -m ml.training.train --cfg ml/configs/default.yaml

# evaluate
python -m ml.evaluation.evaluate --weights ml/runs/best.pt

# export to ONNX
python -m ml.export.export_onnx --weights ml/runs/best.pt
```
