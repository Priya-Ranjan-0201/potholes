# ScamRoad — Project Structure Guide

Directory layout and component responsibilities across the ScamRoad workspace.

---

## Directory Tree

```text
scam_road/
├── backend/                  # FastAPI backend and SQLAlchemy ORM (port 8000)
│   ├── app/
│   │   ├── api/v1/           # REST endpoints (infer.py, defects.py, maintenance.py, etc.)
│   │   ├── core/             # Config settings, password hashing, JWT helpers
│   │   ├── db/               # SQLAlchemy engine and session management
│   │   ├── models/           # 44 SQLAlchemy ORM tables
│   │   ├── schemas/          # Pydantic request and response schemas
│   │   └── services/         # Severity scoring, alignment, drift, PDF export
│   ├── alembic/              # Database migration scripts
│   └── tests/                # 78 backend tests
│
├── web/                      # React 18 + TypeScript + Tailwind frontend (port 3000)
│   ├── src/
│   │   ├── pages/            # ScannerPage, DashboardPage, MaintenancePage, ModelBenchmarksPage, LandingPage, LoginPage
│   │   ├── motion/           # BoxOverlay, CompareSlider, ImageViewer, ScanLine
│   │   ├── components/       # Navbar, Footer, CommandPalette, Icons, Verification & Drift views
│   │   ├── ui/               # StatCard, EmptyState, DemoBadge, SeverityBadge, ThemeToggleWipe
│   │   └── utils/            # cvDetector.ts (/api/v1/infer client)
│   ├── public/               # Static assets and /samples/ test images
│   └── dist/                 # Production build output (`npm run build`)
│
├── ml/                       # Weights, dataset utilities, training, quantization
│   ├── weights/
│   │   ├── pavimentos_dfine_l.onnx        # D-FINE Large DETR (119.50 MB)
│   │   ├── pyresearch_pothole_best.onnx   # YOLOv12s ONNX (35.26 MB)
│   │   ├── yolov8n_seg_pothole.onnx       # YOLOv8n-Seg masks (12.67 MB)
│   │   ├── coco_scene_blocker.onnx        # COCO vehicle/pedestrian blocker (10.24 MB)
│   │   ├── pyresearch_pothole_best.pt     # YOLOv12s PyTorch checkpoint (17.77 MB)
│   │   └── yolov8n_seg_pothole.pt         # YOLOv8n-Seg PyTorch checkpoint (6.44 MB)
│   ├── runs/                 # RDD2022 multi-class weights & JSON evaluation reports
│   ├── data/                 # Dataset converters (`convert.py`) and audit checks (`audit.py`)
│   └── training/             # Training pipelines and configs
│
├── edge/                     # Edge camera agent and preprocessing modules
│   ├── agent/                # EdgeInferenceEngine (ONNX Runtime runner)
│   ├── capture/              # Frame quality, blur, and brightness checks
│   ├── outbox/               # SQLite WAL offline queue
│   ├── privacy/              # On-device face and license plate blur
│   └── tests/                # 28 edge pipeline tests
│
├── scripts/                  # Launchers, benchmarks, seeders, and verification scripts
│   ├── serve_inference.py    # FastAPI server launcher for local development
│   ├── test_live_poly.py     # Live inference check across benchmark samples
│   ├── capture_ui_matrix.py  # Headless Chrome screenshot capture
│   ├── seed/                 # Demo database seeders
│   └── README.md             # Categorized index of scripts
│
├── config/                   # Runtime rate card (`rate_card.json`) & severity thresholds (`severity_thresholds.json`)
├── configs/                  # YAML path & taxonomy configuration
├── data/                     # Calibration benchmarks and local test media
├── docs/                     # Architecture docs, screenshots, and audit records
├── run.bat                   # Windows launcher (starts backend on :8000 and frontend on :3000)
├── make.bat                  # Task runner (`make dev`, `make test`, `make lint`)
├── pyproject.toml            # Python project, pytest, ruff, and black configuration
└── README.md                 # Main repository overview
```

---

## 70/30 Multi-Model Ensemble (`backend/app/api/v1/infer.py`)

### 70% Weightage Models
- **Kodjaoglanian D-FINE Large (`ml/weights/pavimentos_dfine_l.onnx`, 119.50 MB):** DETR detector for asphalt potholes.
- **PyResearch YOLOv12s (`ml/weights/pyresearch_pothole_best.onnx`, 35.26 MB):** Secondary pothole detector.
- **keremberke YOLOv8n-Seg (`ml/weights/yolov8n_seg_pothole.onnx`, 12.67 MB):** Instance segmentation producing polygonal contours constrained inside final bounding boxes.
- **Geometry & Overlap Filtering:** Aspect ratio filtering and IoMin crack-in-pothole suppression.

### 30% Weightage Edge Models
- **YOLO11n INT8 (`runs/export/best_yolo11_int8.onnx`, 2.87 MB):** Lightweight quantized pothole detector.
- **RDD2022 YOLOv8n (`ml/runs/pothole_yolov8n/weights/best.onnx`, 12.18 MB):** Multi-class crack classifier (alligator, longitudinal, transverse cracks).

### Scene Exclusion Filter
- **COCO Scene Blocker (`ml/weights/coco_scene_blocker.onnx`, 10.24 MB):** Filters out road candidates overlapping non-road objects such as cars, buses, trucks, motorcycles, pedestrians, and traffic signs.

### Confidence Fusion Rule
When a 70%-group box and a 30%-group box overlap ($\text{IoU} > 0.20$):

$$C_{\text{fused}} = 0.70 \times C_{\text{new}} + 0.30 \times C_{\text{base}}$$

- Unmatched 70%-group candidate: $C_{\text{fused}} = 0.70 \times C_{\text{new}}$.
- Unmatched 30%-group candidate: $C_{\text{fused}} = 0.30 \times C_{\text{base}} + 0.70 \times (0.85 \times C_{\text{base}})$.

---

## Common Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| Start App | `.\run.bat` | Starts backend (`:8000`) and frontend (`:3000`) and opens the browser |
| Run Python Tests | `pytest backend/tests shared/tests ml/tests edge/tests` | Runs all 167 Python tests |
| Run Web Tests | `cd web && npm test -- --run` | Runs the 13 Vitest specs |
| Build Frontend | `cd web && npm run build` | Type-checks with `tsc` and builds Vite production bundle |
| Verify Live Inference | `python scripts/test_live_poly.py` | Runs `/api/v1/infer` checks across sample images |
| Check Claims & UI Copy | `python scripts/check_claims.py && python scripts/check_ui_copy.py web/src` | Runs repository honesty and UI copy checks |
