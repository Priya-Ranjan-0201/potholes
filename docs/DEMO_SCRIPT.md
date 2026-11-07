# ScamRoad — 10-Minute Comprehensive Demo Script

This script provides an exact, step-by-step walkthrough for demonstrating the complete ScamRoad system to technical reviewers, municipal evaluators, or academic committees.

---

## Preparation Checklist (< 2 minutes)

1. Ensure the services are running:
   ```bash
   # Option A: Local Dev Mode
   python scripts/serve_inference.py   # Starts backend on http://localhost:8000
   cd web && npm run dev               # Starts frontend on http://localhost:3000

   # Option B: Docker Compose
   docker compose up -d
   ```
2. Verify all seed data is loaded:
   ```bash
   make demo   # Runs scripts/seed/seed_demo_data.py
   ```
3. Open browser at: `http://localhost:3000`

---

## 10-Minute Demonstration Timeline

### Minute 0:00 – 1:30: Project Mission & Honest Identity
- **Screen**: `http://localhost:3000/` (Dashboard)
- **Key Points to Address**:
  - Introduce ScamRoad as a student research project focused on edge AI road safety.
  - Point to the **Mandatory Student Project Disclaimer** in the footer:
    > *"Student research project. Not an official government system. Not safety-certified."*
  - Point out the visible **`DEMO DATA`** badges on seeded records, explaining that the project strictly enforces data truthfulness (Rule R2).
  - Highlight the multi-metric telemetry cards: Active Sightings, Severity Distribution, and Ward-level Road Health Index.

### Minute 1:30 – 3:30: Real-Time Edge AI Detection (Scanner Page)
- **Screen**: `http://localhost:3000/scanner`
- **Key Points to Address**:
  - Show the live scanner interface. Point out the animated LiDAR scan sweep line.
  - Select preset Indian highway road scenarios (e.g. NH-44 Pothole Cluster or Urban Crater).
  - Click **"Run Edge AI Scan"**:
    - Detections appear bounded by high-contrast bounding boxes with class labels (`D40_POTHOLE`, `D00_LONGITUDINAL_CRACK`).
    - Explain that confidence is NOT severity (Rule R4): show the uncalibrated notice (`*Relative 2D image coordinates (uncalibrated)`).
    - Note the privacy redactor: vehicle plates and faces are automatically blurred prior to cloud ingestion (Rule R6, 100% recall verified in `bench/privacy_blur_report.json`).
  - Demonstrate the **One-Click Work Order Dispatch**:
    - Click "Dispatch Work Order": a new repair order is created with status `ASSIGNED`.

### Minute 3:30 – 5:00: Interactive GIS Map & Multi-Pass Sighting Drawer
- **Screen**: `http://localhost:3000/map`
- **Key Points to Address**:
  - Show the restored Leaflet + OpenStreetMap GIS map.
  - Show color-coded severity markers (Red = Critical $\ge 70$, Orange = High, Yellow = Moderate).
  - Filter by severity using the top toolbar.
  - Click any marker:
    - The slide-over **Defect Drawer** opens showing multi-pass sightings (e.g., 5 sightings across 3 passes), GPS accuracy, and repair history.
    - Explain the "One Pothole = One Record" guarantee: Level 1 ByteTrack + Level 2 Edge consolidation + Level 3 PostGIS spatial deduplication.

### Minute 5:00 – 6:30: Municipal Maintenance & Work Order Verification
- **Screen**: `http://localhost:3000/maintenance`
- **Key Points to Address**:
  - Review active work orders. Filter by status (`ASSIGNED`, `IN_PROGRESS`, `REPAIRED`).
  - **Emphasize Rule R5**:
    - AI provides advisory suggestions, but **AI is strictly prohibited from closing work orders**.
    - Only an authorized engineer (`pwd_engineer` / `admin`) can verify repair photographs and sign off to mark a work order `CLOSED`.

### Minute 6:30 – 7:30: Citizen Grievances & Community Upvoting
- **Screen**: `http://localhost:3000/complaints`
- **Key Points to Address**:
  - Show citizen-submitted reports.
  - Demonstrate citizen triage: reports transition from `SUBMITTED` → `TRIAGED` → `RESOLVED`.
  - Explain how citizen reports merge with automated edge telemetry to increase priority.

### Minute 7:30 – 8:30: Model Registry & Telemetry
- **Screen**: `http://localhost:3000/models`
- **Key Points to Address**:
  - Show active models: YOLO11n ONNX INT8 with 0.999757 cosine parity to PyTorch FP32.
  - Point out that inference latency and FPS are derived from real benchmark runs (`ml/runs/metrics.json` and `ml/runs/onnx_parity.json`).

### Minute 8:30 – 9:30: Multilingual Inclusivity & Theme Contrast
- **Interaction**:
  - Toggle the language selector in the navbar across 6 Indian languages:
    - **English** → **हिंदी** → **ਪੰਜਾਬੀ** → **தமிழ்** → **తెలుగు** → **বাংলা**
    - Show that 100% of UI strings change instantly with zero mixed languages (`scripts/check_i18n_keys.py` verified 136/136 keys).
  - Toggle **Dark Mode / Light Mode**:
    - Show the Daybreak Porcelain Light theme (16.51:1 contrast, WCAG AAA).
    - Show the Midnight Obsidian Dark theme (18.89:1 contrast, WCAG AAA).

### Minute 9:30 – 10:00: Summary & Q&A
- Show OpenAPI docs at `http://localhost:8000/api/v1/docs`.
- Mention reproducible test suite: 144 Python tests + 8 Vitest tests passing with 0 warnings.

---

## Offline Fallback Plan

If live internet or local ports are unavailable during a presentation:
1. **Offline Screenshots**: Open `docs/screenshots/` which contains 17 high-resolution full-page screenshots of all routes in light mode, dark mode, and mobile viewports.
2. **Offline Fallback Video / Captures**: Open `docs/screenshots/map_restored.png` and `docs/screenshots/02_scanner_light.png` to demonstrate live detection rendering without running servers.

