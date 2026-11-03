# ScamRoad

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Priya-Ranjan-0201/potholes/blob/main/notebooks/ScamRoad_Colab_GPU_Pipeline.ipynb)
[![Kaggle GPU](https://kaggle.com/static/images/open-in-kaggle.svg)](notebooks/ScamRoad_Kaggle_GPU_Pipeline.ipynb)
[![Tests Passing](https://img.shields.io/badge/tests-124%20passed-brightgreen.svg)](scripts/e2e/test_end_to_end_pipeline.py)
[![Code Style: Black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)
[![Linter: Ruff](https://img.shields.io/badge/linter-ruff-orange.svg)](https://github.com/astral-sh/ruff)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC_BY--SA_4.0-lightgrey.svg)](docs/DATASETS.md)

> *"Deploying advanced space technology to map road craters so deep you don't need a rocket to visit the Moon."*

**ScamRoad** is an end-to-end Edge AI & Cloud road damage detection, tracking, and municipal governance system. It detects road defects (potholes, longitudinal cracks, transverse cracks, alligator cracks) in real time from vehicle dashcams and mobile phones, assigns persistent defect IDs, suppresses duplicate frame counts, calculates relative damage surface area, geotags events with Kalman filtering, and synchronizes to a spatial PostgreSQL/PostGIS cloud backend.

> [!NOTE]
> The tagline is branding only. In accordance with Rule R4, this system reports pixel-based relative measurements (`relative_area_pct`) unless a certified physical camera calibration source is provided. It is **not** safety-certified — see [LIMITATIONS.md](docs/LIMITATIONS.md).

---

## Cloud GPU Training & Evaluation (Turnkey Workflows)

ScamRoad provides turnkey cloud GPU training pipelines on both **Google Colab** and **Kaggle**, completely isolating computationally intensive operations from local developer laptops.

| Platform | Compute Target | Persistent Storage | Launcher |
| :--- | :--- | :--- | :--- |
| **Google Colab** | NVIDIA Tesla T4 / V100 / A100 | Google Drive (`/content/drive/MyDrive/ScamRoad`) | [![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/Priya-Ranjan-0201/potholes/blob/main/notebooks/ScamRoad_Colab_GPU_Pipeline.ipynb) |
| **Kaggle** | 2x NVIDIA Tesla T4 (30h/wk free) | Kaggle Output (`/kaggle/working/artifacts`) | [`notebooks/ScamRoad_Kaggle_GPU_Pipeline.ipynb`](notebooks/ScamRoad_Kaggle_GPU_Pipeline.ipynb) |

### Models Trained & Compared

1. **YOLO11n (Nano):** Ultra-compact next-gen detector (2.6M params, <10ms latency) optimized for Android smartphones and low-power Raspberry Pi edge units.
2. **YOLO11s (Small):** Enhanced capacity detector (9.4M params) for superior recall on fine longitudinal and transverse asphalt cracks.
3. **YOLO11n-seg (Instance Segmentation):** Predicts pixel-level defect masks alongside bounding boxes for accurate damage surface area quantification.
4. **RT-DETR-l (Real-Time Transformer):** End-to-end detection transformer removing NMS thresholds and excelling on dense crack clusters.
5. **YOLOv8n (Reference Baseline):** 3.2M params edge mobile baseline.

---

## Core Features

- **Multi-Modal Detection & Video Tracking:** Real-time road damage detection from static images, batch folders, and live video streams (`.mp4`, `.avi`, webcam `0`).
- **One Defect = One Record:** `SimpleVideoTracker` maintains persistent IDs (`pothole #1`, `crack_longitudinal #2`) and eliminates duplicate frame counting.
- **Dynamic Heads-Up Display (HUD):** Overlays live FPS, active detections, unique tracked defects count, and relative damage surface area %.
- **Edge ONNX INT8 Quantization:** Dynamic INT8 quantization compresses FP32 models by ~75% ($14.2\text{ MB} \to 3.32\text{ MB}$) for edge deployment.
- **Offline-First Edge Agent:** Crash-safe SQLite WAL outbox with exponential backoff retry logic.
- **Privacy by Design (Rule R15):** Automatic on-device Gaussian blurring for faces and license plates before persistence.
- **Seven Standard Dataset Manifests:** Checked into [`docs/dataset_artifacts/`](docs/dataset_artifacts/) (`dataset_manifest.csv`, `duplicate_report.csv`, `cleaning_report.csv`, etc.).

---

## Quick Start

### 1. Local Development & Edge Testing

```bash
# Clone repository
git clone https://github.com/Priya-Ranjan-0201/potholes.git && cd potholes

# Create virtual environment & install pinned ML dependencies
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run complete verification test suite
pytest

# Test multi-environment path auto-resolution
python -c "from configs.paths import get_paths; print(get_paths())"

# Test video/image inference runner
python scripts/infer_media.py --source data/sample/splits/images/val --weights yolov8n.pt --output-dir runs/demo --conf 0.25
```

### 2. Full Municipal Stack (Backend + DB + Frontend)

```bash
# Copy environment config
cp .env.example .env

# Start PostgreSQL/PostGIS, Redis, MinIO, and FastAPI
docker compose up -d

# Verify system health
curl http://localhost:8000/api/v1/health
# → {"status":"ok","version":"0.1.0","service":"scamroad-api"}

# Run 14-stage automated end-to-end municipal demonstration
python scripts/demo.py
```

---

## Project Structure

```
scam_road/
├─ .agent/rules/         # Agent behavioral rules (R1 to R16)
├─ docs/                 # Specifications, architecture, ADRs, limitations, dataset registry
│  ├─ dataset_artifacts/ # 7 standardized dataset manifests (Rule R14)
│  └─ PHASE_REPORTS/     # Detailed phase completion reports (Phase 1 to Phase 12)
├─ ml/                   # Machine Learning library
│  ├─ data/              # Ingestion, conversion, cleaning, audit, sequence splitting, augmentation
│  ├─ evaluation/        # Multi-model benchmarking harness (compare_models.py)
│  └─ quantize.py        # ONNX INT8 dynamic and static quantization
├─ edge/                 # Edge runtime: capture, infer, track, geotag, blur, outbox, sync
├─ backend/              # FastAPI application, SQLAlchemy models, Alembic migrations, services
├─ notebooks/            # Turnkey cloud GPU notebooks (Colab & Kaggle)
├─ kaggle/               # Kaggle kernel metadata and push configs
├─ scripts/              # Seed data, media inference, demo runners, E2E tests
└─ docker-compose.yml    # Municipal development infrastructure stack
```

---

## Documentation & Phase Reports

- [Specification](docs/SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Decisions (ADRs)](docs/DECISIONS.md)
- [Dataset Registry](docs/DATASETS.md)
- [Limitations & Non-Safety Notice](docs/LIMITATIONS.md)
- [API Documentation](docs/API.md)
- [Phase 11 Report — Multi-Modal Video Tracking & HUD](docs/PHASE_REPORTS/phase-11.md)
- [Phase 12 Report — Complete Cloud GPU Architecture](docs/PHASE_REPORTS/phase-12.md)

---

## Licensing & Provenance

This project is licensed for research and development. Derived models and training splits incorporate the **RDD2022** dataset licensed under **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)** (Arya et al., IEEE BigData 2022). See [`docs/DATASETS.md`](docs/DATASETS.md) for full licensing terms and dataset manifests.
