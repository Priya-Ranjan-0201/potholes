# ScamRoad — Project Architecture & File Structure Guide

This document provides a simple, complete directory and architecture map of the ScamRoad project. **All components are strictly modular and preserved.**

---

## 🗺️ High-Level Directory Tree

```
scam_road/
├── backend/                  # FastAPI Python Backend & Database Layer (Port 8000)
│   ├── app/
│   │   ├── api/v1/          # REST Endpoints (infer.py, defects.py, maintenance.py, etc.)
│   │   ├── core/            # App settings, security, and JWT configuration
│   │   ├── db/              # SQLAlchemy session and connection management
│   │   ├── models/          # 39-Table database schema (PostgreSQL / SQLite)
│   │   ├── schemas/         # Pydantic request & response contracts
│   │   └── services/        # Business logic (severity, forecasting, sensor fusion)
│   ├── alembic/             # Database migration scripts
│   └── tests/               # 78 Backend unit and integration test suites
│
├── web/                      # React 18 + TypeScript + Tailwind Frontend (Port 3000)
│   ├── src/
│   │   ├── pages/           # ScannerPage, DashboardPage, MaintenancePage, BenchmarksPage
│   │   ├── motion/          # BoxOverlay (masks & boxes), CompareSlider, ImageViewer
│   │   ├── components/      # Navigation, Header, Status Badges, Icons
│   │   ├── ui/              # Modular design system (Buttons, Cards, Inputs, Dialogs)
│   │   └── utils/           # cvDetector.ts (API Bridge to /api/v1/infer)
│   ├── public/              # Static assets and /samples/ benchmark images
│   └── dist/                # Production build output (`npm run build`)
│
├── ml/                       # Machine Learning Weights, Training & Quantization
│   ├── weights/             # Active Pre-Trained & Fine-Tuned AI Model Weights
│   │   ├── pavimentos_dfine_l.onnx        # Kodjaoglanian D-FINE Large (DETR Transformer)
│   │   ├── pyresearch_pothole_best.onnx   # PyResearch YOLOv12s ONNX Model
│   │   ├── yolov8n_seg_pothole.onnx       # keremberke YOLOv8n Instance Segmentation
│   │   └── pyresearch_pothole_best.pt     # PyTorch checkpoint with area-attention
│   ├── runs/                # RDD2022 multi-class weights & evaluation metrics
│   ├── data/                # Dataset converters and audit scripts
│   └── training/            # YOLO and custom training pipelines
│
├── edge/                     # On-Device Edge Agent (Patrol Vehicles / Dashcams)
│   ├── agent/               # EdgeInferenceEngine (ONNX Runtime INT8 runner)
│   ├── capture/             # Camera frame grabber and blur/brightness quality gates
│   ├── outbox/              # SQLite WAL persistent queue with exponential backoff sync
│   ├── privacy/             # On-device face and license plate redactor
│   └── tests/               # 28 Edge pipeline tests
│
├── scripts/                  # Curated Platform Utilities, Launchers & Verification Tools
│   ├── serve_inference.py   # Standalone AI server launcher for fast edge execution
│   ├── test_live_poly.py    # Live 70/30 ensemble benchmark test across all 5 samples
│   ├── capture_ui_matrix.py # Headless browser visual matrix capture
│   ├── seed/                # Canonical municipal database demo & benchmark seeders
│   └── README.md            # Complete categorized index of repository utility scripts
│
├── data/                     # Calibration benchmarks and edge test media
├── docs/                     # Engineering documentation, architectural decisions, screenshots
├── run.bat                   # 🚀 One-Click Windows Launcher (starts backend + frontend + browser)
├── make.bat                  # PowerShell task runner (`make dev`, `make test`, `make lint`)
├── pyproject.toml            # Python project configuration (pytest, ruff, black)
└── README.md                 # Main capstone project overview and documentation
```

---

## 🧠 The 70/30 Multi-Model Ensemble Architecture

The core defect detection engine at `backend/app/api/v1/infer.py` executes a multi-model ensemble:

### 1. 70% Weightage — SOTA Deep Learning & Research Repositories
- **Kodjaoglanian D-FINE Large (`pavimentos-dfine-l`)**:
  - Fine-grained Distribution Refinement DETR transformer (`ml/weights/pavimentos_dfine_l.onnx`, 125 MB).
  - Trained with Hard-Negative Mining to zero out false alarms on smooth asphalt and pavement shadows.
- **PyResearch YOLOv12 (`Pothole-Computer-Vision-Project`)**:
  - YOLOv12s architecture (`ml/weights/pyresearch_pothole_best.onnx`, 35 MB) with area-attention.
  - High-recall dense pothole feature extractor with PyResearch count tracking.
- **keremberke YOLOv8-Seg (`yolov8n-pothole-segmentation`)**:
  - Instance segmentation engine (`ml/weights/yolov8n_seg_pothole.onnx`, 12.7 MB).
  - Produces organic polygonal contour masks around irregular pothole cavity boundaries.
- **jhasuman Geometry Filter (`potholes-detection`)**:
  - Aspect ratio bounds ($0.12 \le \text{AR} \le 7.0$) and anchor IoU de-confliction.

### 2. 30% Weightage — Calibrated Edge Engines
- **YOLO11n-INT8 Quantized Edge Engine (`runs/export/best_yolo11_int8.onnx`)**:
  - Ultra-fast (45-75 ms CPU latency), specially trained on monsoon waterlogged roads and flooded craters.
- **RDD2022 Distress Multi-Class Engine (`ml/runs/pothole_yolov8n/weights/best.onnx`)**:
  - Multi-class crack detection (ASTM D6433 compliant for Alligator, Longitudinal, and Transverse cracks).

### 3. Mathematical Confidence Fusion
When spatial overlap exceeds IoU $> 0.20$:
$$C_{\text{fused}} = 0.70 \times C_{\text{new}} + 0.30 \times C_{\text{base}}$$

Unmatched candidates are scaled appropriately:
- Unmatched 70% model candidate: $C_{\text{fused}} = 0.70 \times C_{\text{new}}$ (must meet sensitivity threshold).
- Unmatched 30% edge candidate: $C_{\text{fused}} = 0.30 \times C_{\text{base}} + 0.70 \times (0.85 \times C_{\text{base}})$.

---

## ⚡ Quick Start Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| **🚀 Start Everything** | `.\run.bat` | Launches backend on `:8000`, frontend on `:3000`, and opens browser |
| **🧪 Run All Tests** | `pytest backend/tests/ edge/tests/` | Runs all 106 automated backend and edge tests |
| **📦 Build Frontend** | `cd web && npm run build` | Compiles TypeScript and builds production assets |
| **🔍 Verify Models** | `python scripts/test_live_poly.py` | Runs live inference across all 5 benchmark road scenarios |
| **🧹 Check Code Quality** | `.\make.bat lint` | Runs Ruff linter and Black formatting checks |

