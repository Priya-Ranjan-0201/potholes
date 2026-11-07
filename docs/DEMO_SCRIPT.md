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

### Minute 3:30 – 5:00: Spatial Defect Registry & Ward Hotspots
- **Screen**: `http://localhost:3000/defects`
- **Key Points to Address**:
  - Present the Defect Registry and executive Ward Hotspot Grid.
  - Show canonical color-coded severity chips (Minor `#2EC4B6`, Moderate `#FFB703`, Severe `#FB6A2F`, Critical `#E5233A`).
  - Demonstrate text coordinates (lat, lon to 5 decimals), road corridor, ward, and GPS accuracy ($\pm$2.4m).
  - Click "Copy coordinates" and the external "Open in maps app" navigation link.
  - Open Defect Telemetry & Audit drawer showing multi-pass sightings (e.g., 5 sightings across 3 passes) and lifecycle history.
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

### Minute 7:30 – 8:30: Model Registry & Scientific Evaluation
- **Screen**: `http://localhost:3000/evaluation` & `http://localhost:3000/models`
- **Key Points to Address**:
  - Show active models: YOLO11n ONNX INT8 with 0.999757 cosine parity to PyTorch FP32.
  - Show the scientific evaluation page (`/evaluation`):
    - Real held-out mAP@50 (`85.75%`) and mAP@50-95 (`62.12%`).
    - Interactive 5x5 confusion matrix and 10-bin reliability diagram (ECE 1.91%).
    - 6-case failure gallery (3 false positives, 3 false negatives with engineering mitigations).

### Minute 8:30 – 9:15: Mobile Drive Mode PWA (/capture)
- **Screen**: `http://localhost:3000/capture`
- **Key Points to Address**:
  - Demonstrate installable Progressive Web App with service worker shell caching.
  - Glanceable Drive Mode HUD: big speedometer (km/h), NavIC/GPS accuracy ($\pm$2.1m), defect counters.
  - Web Audio acoustic chime on detection with mute toggle.
  - IndexedDB offline outbox queue with idempotency keys and "Sync Outbox Now" capability.
  - Sensor Fusion Lite: mechanical bump acceleration cross-validation badge (`⚡ Camera + IMU Bump Agree`).

### Minute 9:15 – 9:45: Multilingual Inclusivity & Theme Contrast
- **Interaction**:
  - Toggle the language selector in the navbar across 6 Indian languages:
    - **English** → **हिंदी** → **ਪੰਜਾਬੀ** → **தமிழ்** → **తెలుగు** → **বাংলা**
    - Show that 100% of UI strings change instantly with zero mixed languages (`scripts/check_i18n_keys.py` verified 137/137 keys).
  - Toggle **Dark Mode / Light Mode**:
    - Show the Daybreak Porcelain Light theme (16.51:1 contrast, WCAG AAA).
    - Show the Midnight Obsidian Dark theme (18.89:1 contrast, WCAG AAA).

### Minute 9:45 – 10:00: Summary & Q&A
- Show OpenAPI docs at `http://localhost:8000/api/v1/docs`.
- Mention reproducible test suite: 146 Python tests + 8 Vitest tests passing with 0 warnings.
- Point to `docs/PROJECT_REPORT.md` and `docs/SLIDES_OUTLINE.md`.

---

## Offline Fallback Plan

If live internet or local ports are unavailable during a presentation:
1. **Offline Screenshots**: Open `docs/screenshots/` which contains 21 high-resolution full-page screenshots of all routes in light mode, dark mode, and mobile viewports.
2. **Offline Fallback Captures**: Open `docs/screenshots/live_01_dashboard_light.png`, `docs/screenshots/live_04_scanner_detected_nh44.png`, `docs/screenshots/live_13b_evaluation_benchmarks.png`, and `docs/screenshots/live_16_mobile_capture_pwa.png` to demonstrate live detection rendering without running servers.

