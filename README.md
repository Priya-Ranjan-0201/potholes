# ScamRoad

> *"Deploying advanced space technology to map road craters so deep you don't need a rocket to visit the Moon."*

**ScamRoad** is an edge-AI, pothole-first road-damage tracking system. It runs real-time detection on the device (phone, laptop, Raspberry Pi), tracks each physical defect across video frames, geotags it, queues it offline, and syncs to a cloud backend that handles deduplication, mapping, severity scoring, maintenance workflows, and analytics.

> [!NOTE]
> The tagline is branding only. This system reports pixel-based relative measurements unless a calibration source is available. It is **not** safety-certified — see [LIMITATIONS.md](docs/LIMITATIONS.md).

---

## Features

- **On-device pothole detection** using YOLOv8 nano/small (ONNX, TFLite, TensorRT)
- **Real-time tracking** with ByteTrack — one pothole = one record
- **Offline-first** edge agent with crash-safe SQLite outbox
- **GPS geotagging** with Kalman filtering and accuracy-aware matching
- **Privacy by design** — faces and plates blurred before upload
- **Server-side deduplication** across devices, passes, and time
- **Severity scoring** with transparent, configurable factor breakdown
- **Interactive map** with clusters, heatmaps, road health index
- **Citizen reporting** with complaint tracking and work order generation
- **AI-assisted repair verification** (advisory — humans decide)
- **Multi-language** support (English, Hindi, Punjabi)

## Quick Start

```bash
# Clone and enter
git clone <repo-url> && cd scam_road

# Copy environment config
cp .env.example .env

# Start all services
docker compose up -d

# Verify
curl http://localhost:8000/api/v1/health
# → {"status":"ok","version":"0.1.0","service":"scamroad-api"}

# Run tests
make lint test
```

## Architecture

```
Edge Device (Phone/Laptop/Pi)
  └─ Camera → Quality Gate → Inference → Tracker → Geotag → Blur → Outbox
       └─ Sync ──→ FastAPI Backend ──→ PostgreSQL + PostGIS
                        │                    │
                        ├─ Celery Workers    ├─ MinIO (media)
                        ├─ Redis (cache)     ├─ Dedup Engine
                        └─ Model Registry    └─ Severity Engine
                              │
              ┌───────────────┼───────────────┐
              │               │               │
         React Web      Expo Mobile      Edge Console
        (Dashboard)     (Citizen/Inspector)  (CLI/Status)
```

## Technology Stack

| Layer | Technology |
|---|---|
| ML Training | Python 3.12, PyTorch, Ultralytics YOLO, OpenCV, albumentations |
| Edge Export | ONNX, ONNX Runtime, TFLite (INT8/FP16), TensorRT (Jetson) |
| Edge Runtime | Python agent (Pi/laptop), Expo/React Native (Android) |
| Tracking | ByteTrack / BoT-SORT |
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, Celery + Redis |
| Database | PostgreSQL 16 + PostGIS 3, Redis 7, MinIO |
| Web | React 18, TypeScript, Vite, Tailwind, Leaflet, Recharts |
| Mobile | Expo (TypeScript), ONNX Runtime Mobile / TFLite |
| Infra | Docker Compose, GitHub Actions, Prometheus + Grafana |

## Project Structure

```
scam_road/
├─ .agent/rules/        # Agent rules
├─ docs/                 # Specs, architecture, decisions, limitations, datasets, API, phase reports
├─ ml/                   # Training, evaluation, export, quantization, severity, tracking, forecasting
├─ edge/                 # Edge agent: capture, infer, track, geotag, blur, outbox, sync, health
├─ backend/              # FastAPI app, models, schemas, services, workers, DB, tests
├─ web/                  # React + TypeScript dashboard
├─ mobile/               # Expo (React Native) Android app
├─ shared/               # Taxonomy, JSON schemas, OpenAPI generated clients
├─ infra/                # Docker, nginx, monitoring, backup
├─ scripts/              # Seed data, E2E, health checks
├─ docker-compose.yml    # Development stack
└─ Makefile              # Standard targets
```

## Datasets

This project uses publicly available road damage datasets. See [docs/DATASETS.md](docs/DATASETS.md) for licences and attribution.

- **RDD2022** — CC BY-SA 4.0 — Arya et al., IEEE Big Data 2022

## Documentation

- [Specification](docs/SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Decisions (ADRs)](docs/DECISIONS.md)
- [Limitations](docs/LIMITATIONS.md)
- [Datasets](docs/DATASETS.md)
- [API](docs/API.md)

## Licence

This project is for personal/educational use. Dataset licences (CC BY-SA 4.0 for RDD2022) apply to derived models and datasets — see [docs/DATASETS.md](docs/DATASETS.md).

## Disclaimer

ScamRoad is **not a safety-certified system**. It provides advisory information only. Do not interact with the app while driving. Mount the device securely. See [docs/LIMITATIONS.md](docs/LIMITATIONS.md).
