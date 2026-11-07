# ScamRoad (सड़क सुरक्षा)
### Edge AI Pothole & Road Defect Surveillance Portal (Student Research Project)

[![Release: v1.2.0](https://img.shields.io/badge/Release-v1.2.0%20(Polish)-blue.svg)](docs/CHANGELOG.md)
[![Python Tests](https://img.shields.io/badge/Python%20Tests-146%2F146%20Passing-brightgreen.svg)](backend/tests/)
[![Web Tests](https://img.shields.io/badge/Web%20Tests-8%2F8%20Passing-brightgreen.svg)](web/)
[![Claim Checker](https://img.shields.io/badge/Claim%20Checker-passing-success.svg)](scripts/check_claims.py)
[![i18n Coverage](https://img.shields.io/badge/i18n-6%20Languages%20(All%20Keys%20Present)-blueviolet.svg)](scripts/check_i18n_keys.py)
[![Inference Engine](https://img.shields.io/badge/Inference-ONNX%20INT8%20(13.6%20FPS%20CPU)-purple.svg)](ml/runs/metrics.json)
[![Severity Rubric](https://img.shields.io/badge/Severity%20Rubric-inspired%20by%20public%20guidance-orange.svg)](config/severity_thresholds.json)
[![License: AGPL-3.0 / CC BY-SA 4.0](https://img.shields.io/badge/License-AGPL--3.0%20%2F%20CC%20BY--SA%204.0-lightgrey.svg)](docs/DECISIONS.md)

> **STUDENT RESEARCH DISCLAIMER (Rule R7):**  
> ScamRoad is an open-source undergraduate student academic capstone research project demonstrating Edge AI Computer Vision for automated road defect tracking and municipal dispatch workflows. It is **NOT** affiliated with, endorsed by, or an official product of the Ministry of Road Transport & Highways (MoRTH), National Highways Authority of India (NHAI), State Public Works Departments (PWD), or any government body. Not certified for safety-critical operations.

---

## 📸 System Previews

| Executive Command Center (`/`) | Real-Time Edge Scanner (`/scanner`) |
| :---: | :---: |
| ![Command Center](docs/screenshots/live_01_dashboard_light.png) | ![Edge Scanner](docs/screenshots/live_04_scanner_detected_nh44.png) |
| *Ward Hotspot Grid, Top 10 Worst Corridors distress leaderboard, and animated road perspective hero.* | *YOLO11n INT8 detection bounding box, class telemetry, and 1-click work order dispatch.* |

| Scientific AI Evaluation (`/evaluation`) | Mobile Drive Mode PWA (`/capture`) |
| :---: | :---: |
| ![Scientific Evaluation](docs/screenshots/live_13b_evaluation_benchmarks.png) | ![Drive Mode PWA](docs/screenshots/live_16_mobile_capture_pwa.png) |
| *Empirical metrics from held-out test split, 5x5 confusion matrix, and 6-case failure gallery.* | *Installable PWA HUD with speedometer (km/h), NavIC/GPS accuracy, acoustic chime, and IndexedDB outbox.* |

---

## 📌 Table of Contents

1. [Executive Summary & Core Mission](#-executive-summary--core-mission)
2. [What Works Today vs What is NOT Implemented](#-what-works-today-vs-what-is-not-implemented)
3. [Empirical Model Evaluation & Real Benchmarks](#-empirical-model-evaluation--real-benchmarks)
4. [Verified System Architecture & Data Flow](#-verified-system-architecture--data-flow)
5. [The "One Pothole = One Record" Deduplication Engine](#-the-one-pothole--one-record-deduplication-engine)
6. [Severity Scoring Engine & Configurable Rate Card](#-severity-scoring-engine--configurable-rate-card)
7. [Edge Privacy Redactor (Rule R6)](#-edge-privacy-redactor-rule-r6)
8. [Human-in-the-Loop Municipal Governance (Rule R5)](#-human-in-the-loop-municipal-governance-rule-r5)
9. [Threat Model & Data Retention](#-threat-model--data-retention)
10. [Licensing, Dataset Provenance & Attribution (Rule R11)](#-licensing-dataset-provenance--attribution)
11. [Quick Start & Reproduction Commands](#-quick-start--reproduction-commands)

---

## 🚀 Executive Summary & Core Mission

ScamRoad investigates high-efficiency Edge Computer Vision methods to detect physical road surface distresses (**potholes, longitudinal cracks, transverse cracks, and alligator cracks**) directly from vehicle dashcams, smartphones, and patrol camera feeds without requiring expensive specialized LiDAR vehicles.

### Key Architectural Tenets:
- **Zero Fake AI (Rule R2):** Runs an audited **YOLO11n ONNX INT8** quantized model directly on edge devices and inside the browser. All detections, bounding boxes, and confidence scores are derived from real ONNX model inference.
- **Privacy by Design (Rule R6):** Automatically redacts citizen faces and vehicle license plates on-device before storage or cloud upload (100% recall verified in `bench/privacy_blur_report.json`).
- **Strict Human Oversight (Rule R5):** AI identifies damage and suggests priorities, but **AI never closes or approves a work order**. Mandatory human municipal engineer sign-off with before/after photographic proof is strictly enforced.
- **Spatial Defect Registry & Ward Grid:** Clean replacement of third-party map tiles with a non-geographic **Ward Hotspot Grid**, ranked corridor damage density leaderboard, and comprehensive tabular defect registry with external maps navigation links.
- **Full 6-Language Localization:** Zero-reload translation across English, Hindi, Punjabi, Tamil, Telugu, and Bengali (137/137 keys verified by `scripts/check_i18n_keys.py`).
- **Configurable Rate Card (Rule R9):** Repair estimates are computed from an explicit JSON rate card (`config/rate_card.json`), clearly labeled as illustrative planning estimates rather than official government rates.

---

## ⚖️ What Works Today vs What is NOT Implemented

In adherence to Rule R1 (Truth Over Appearance), we clearly separate working capabilities from planned or excluded scope:

### ✅ What Works Today (Verified by Automated Tests)
1. **Real Edge Neural Inference:** INT8 quantized YOLO11n ONNX model executing on CPU at **73.57 ms p50 latency (13.6 FPS)** with **85.75% mAP@50** on held-out test data.
2. **Quality & Privacy Gate:** Frame Laplacian blur rejection ($>80$) and automated Gaussian blurring of faces and vehicle license plates.
3. **Multi-Stage Deduplication:** In-video ByteTrack temporal persistence ($\ge 3$ frames) + edge outbox median consolidation + backend PostGIS spatial proximity snapping (`ST_DWithin`).
4. **Mobile PWA Capture Mode (`/capture`):** Installable progressive web app with service worker shell caching, glanceable speedometer HUD, NavIC/GPS telemetry, Web Audio detection chime, and IndexedDB outbox queue.
5. **Sensor Fusion Lite (Experimental):** Smartphone vertical accelerometer shock detection (`edge/agent/sensor_fusion.py`) cross-validating optical detections with mechanical wheel impacts.
6. **Municipal Workflow Core:** Citizen grievance reporting, work order dispatch, SLA countdown, and human municipal engineer repair verification with before/after photos.
7. **Empirical Evaluation Portal (`/evaluation`):** Dynamic presentation of held-out test metrics, 5x5 confusion matrix, 10-bin reliability diagram, and 6-case failure gallery.

### ❌ What is NOT Implemented (Honest Scope Boundary)
1. **Millimeter Depth & 3D Volume:** Monocular RGB cameras cannot measure crater depth or physical volume in cubic centimeters without physical stereoscopic or LiDAR sensors (Rule R4).
2. **Automated Work Order Closure:** AI is explicitly prohibited from marking work orders `CLOSED` or verifying repairs (Rule R5).
3. **Safety-Certified Autopilot / ADAS:** The model is an advisory surveillance tool; it is not safety-certified for autonomous steering or emergency braking.
4. **Physical On-Device Benchmarks for OPPO K13 / Raspberry Pi 5:** Marked `UNTESTED` pending field recording (queued in `docs/HUMAN_TODO.md`).

---

## 📊 Empirical Model Evaluation & Real Benchmarks

Every number below is traced directly to generated benchmark outputs (`ml/runs/metrics.json` and `ml/runs/ablation.json`). No metrics are simulated.

### Held-Out Test Split Metrics (RDD2022-India, $N=50$ images, 105 annotations)

| Metric | Target SLA | Measured Value | Verification Source |
| :--- | :--- | :--- | :--- |
| **mAP@50** | $\ge 70.0\%$ | **85.75%** | [`ml/runs/metrics.json`](ml/runs/metrics.json) |
| **mAP@50-95** | $\ge 50.0\%$ | **62.12%** | [`ml/runs/metrics.json`](ml/runs/metrics.json) |
| **Macro Precision** | $\ge 80.0\%$ | **86.58%** | [`ml/runs/metrics.json`](ml/runs/metrics.json) |
| **Macro Recall** | $\ge 75.0\%$ | **83.95%** | [`ml/runs/metrics.json`](ml/runs/metrics.json) |
| **Macro F1-Score** | $\ge 80.0\%$ | **85.22%** | [`ml/runs/metrics.json`](ml/runs/metrics.json) |
| **Expected Calibration Error (ECE)** | $\le 10.0\%$ | **1.91%** | [`ml/runs/metrics.json`](ml/runs/metrics.json) |
| **Edge CPU Latency (p50)** | $\le 100\text{ ms}$ | **73.57 ms** | [`ml/runs/metrics.json`](ml/runs/metrics.json) |
| **Edge CPU Throughput** | $\ge 10\text{ FPS}$ | **13.6 FPS** | [`ml/runs/metrics.json`](ml/runs/metrics.json) |
| **False Positive Count (Hard Negatives)** | $\le 5$ | **4** | [`ml/runs/metrics.json`](ml/runs/metrics.json) |

### 3-Axis Systematic Ablation Matrix

| Run ID | Parameter Varied | Configuration | Latency (p50) | Throughput | mAP@50 | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ABL-01` | **Baseline Edge** | YOLO11n @ 640 INT8 | **73.57 ms** | **13.6 FPS** | **85.75%** | **SELECTED FOR EDGE** |
| `ABL-02` | Backbone Capacity | YOLO11s @ 640 INT8 | 182.40 ms | 5.5 FPS | 87.15% | REJECTED: $<10$ FPS SLA |
| `ABL-03` | Resolution | YOLO11n @ 800 INT8 | 124.60 ms | 8.0 FPS | 86.40% | REJECTED: $<10$ FPS SLA |
| `ABL-04` | Precision | YOLO11n @ 640 FP32 | 96.80 ms | 10.3 FPS | 86.95% | ACCEPTABLE: +1.2% mAP but 3.5x size |

*Ablation Finding:* The quantized YOLO11n INT8 configuration at $640 \times 640$ resolution is the only model meeting the $\ge 10\text{ FPS}$ dashcam real-time capture threshold while delivering $85.75\%$ mAP@50 with negligible accuracy loss ($-1.20\%$ mAP drop vs FP32).

---

## 🏗 Verified System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph EdgeCapture["1. Edge Ingestion Layer (edge/)"]
        Dashcam["Camera Feed (Dashcam / PWA)"]
        Geotag["2D Kalman Filter GPS (geotag.py)"]
        PrivacyShield["On-Device Privacy Redactor (blur_privacy.py)"]
        Outbox["Local IndexedDB / SQLite Outbox"]
        
        Dashcam --> Geotag --> PrivacyShield --> Outbox
    end

    subgraph NeuralEngine["2. Neural Inference Engine (ml/ & backend/)"]
        PrivacyShield --> YOLO["YOLO11n INT8 Quantized (best_int8.onnx)"]
        YOLO --> Detections["Bounding Boxes & Defect Classes"]
        Detections --> IoUTracker["ByteTrack Object Association (track.py)"]
    end

    subgraph GovernanceCore["3. Backend API & Spatial Database (backend/)"]
        Outbox -->|POST /api/v1/sync| API["FastAPI REST Service (38 Endpoints)"]
        API --> DB[("PostgreSQL / PostGIS\n39 Tables")]
        API --> Deduplication["Spatial Haversine Deduplication (ST_DWithin)"]
    end

    subgraph WebPortal["4. React 18 Civic Web Portal (web/)"]
        DB --> Dashboard["Executive Overview (/) [DEMO DATA BADGED]"]
        Detections --> Scanner["AI Scanner (/scanner)\n• Real-Time Telemetry\n• Rate Card Est."]
        DB --> DefectReg["Defect Registry (/defects)\n• Ward Grid & Corridor Rankings\n• External Maps Navigation"]
        DB --> Kanban["Maintenance Kanban (/maintenance)\n• Human Engineer Sign-Off (R5)"]
        DB --> Grievance["Citizen Grievances (/complaints)\n• Full State Machine"]
        YOLO --> Eval["AI Evaluation (/evaluation)\n• Test Split Proofs & Confusion Matrix"]
    end
```

---

## 🎯 The "One Pothole = One Record" Deduplication Engine

ScamRoad prevents municipal complaint duplication through a 3-tier consolidation pipeline:
1. **Level 1 (In-Video ByteTrack):** Assigns persistent track IDs across contiguous frames, tracking velocity vectors and rejecting transient false alarms under 3 frames.
2. **Level 2 (Edge Outbox Consolidation):** Consolidates multiple sightings of the same defect into a single candidate, taking median measurements and selecting the highest-sharpness frame.
3. **Level 3 (Cross-Pass Backend Dedup):** Snaps sightings to canonical road corridor geometries in PostGIS (`ST_DWithin`) based on spatial proximity, heading, and image perceptual hash.

---

## 💰 Severity Scoring Engine & Configurable Rate Card

Physical severity is decoupled from neural confidence (Rule R4). Severity score $S \in [0, 100]$ is computed using a weighted linear combination over observable environmental factors:

$$S = \sum_{i=1}^M \frac{w_i}{\sum_{j \in \text{Available}} w_j} \cdot f_i(x)$$

Configured in `configs/severity_weights.yaml` and mapped to canonical tiers:
- **Minor (0–25):** Routine observation in periodic cycle (`#2EC4B6`).
- **Moderate (26–50):** Cold-mix patch in scheduled sweep (`#FFB703`).
- **Severe (51–75):** Urgent compaction within 72h (`#FB6A2F`).
- **Critical (76–100):** Emergency barricade & reconstruction within 24h (`#E5233A`).

Repair cost estimates are calculated from `config/rate_card.json` and clearly labeled:
> *"Illustrative estimate, not an official Schedule of Rates."*

---

## 🛡 Threat Model & Data Retention

| Threat Vector | Potential Impact | Implemented Mitigation |
| :--- | :--- | :--- |
| **Spam / Fake Defect Uploads** | Flooding municipal queues with false potholes | Laplacian sharpness filter ($>80$), IoU track persistence $\ge 3$ frames, and rate limiting per IP/session. |
| **GPS Coordinate Spoofing** | Registering non-existent road damage | Haversine trajectory velocity gating ($v \le 120\text{ km/h}$) and PostGIS road segment snapping. |
| **Rogue Contractor Sign-Off** | Falsifying repair completion for payout | **Rule R5:** Strict RBAC permissions; contractors cannot verify repairs. Only verified municipal engineers can approve closures with before/after photos. |
| **Privacy Violation (GDPR / DPDP)** | Exposing citizen faces or vehicle registration | Mandatory on-device `PrivacyRedactor` executes before image persistence or sync (100% recall verified). |

---

## 📜 Licensing, Dataset Provenance & Attribution

- **Ultralytics YOLO11:** Licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. Under AGPL-3.0, any modified network services utilizing YOLO11 must make their source code available under the same terms.
- **RDD2022 Dataset:** Released by Arya et al. under **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**. We gratefully acknowledge the authors and crowdsensing contributors.
- **Repository Code:** The complete ScamRoad source code is distributed under **AGPL-3.0** with full reciprocal open-source compliance (recorded in `docs/DECISIONS.md`).

---

## ⚡ Quick Start & Reproduction Commands

### 1. Installation & Environment Setup
```bash
# Clone the repository
git clone https://github.com/priyeranjan/scam_road.git
cd scam_road

# Python virtual environment (Python 3.12)
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Node.js dependencies
cd web && npm install && cd ..
```

### 2. Run Claim Honesty Checker (Rule R1)
```bash
python scripts/check_claims.py
```

### 3. Run Automated Tests
```bash
# Backend pytest suite (146 tests)
pytest

# Web vitest suite (8 tests)
cd web && npm test && cd ..

# Web TypeScript & production build
cd web && npm run build && cd ..
```

### 4. Run Live Chrome E2E Suite (21 Tests & Screenshot Matrix)
```bash
python scripts/live_test_suite.py
```

---

> **Academic Viva Reference:**  
> Full thesis report: [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md)  
> 12-slide presentation outline: [`docs/SLIDES_OUTLINE.md`](docs/SLIDES_OUTLINE.md)  
> 5-minute live demonstration script: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)  
> Human action queue: [`docs/HUMAN_TODO.md`](docs/HUMAN_TODO.md)
