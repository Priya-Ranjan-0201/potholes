# ScamRoad: 12-Slide Viva Presentation Deck Outline

**Project:** ScamRoad (v1.2.0)  
**Degree:** Bachelor of Technology in Computer Science & Engineering  
**Examiner Viva Time:** 10–12 Minutes (+ 5 Min Live Demonstration)  
**Evidence Provenance:** Every metric and visual links directly to a generated file in this repository.  

---

### Slide 1: Title & Academic Research Scope
- **Headline:** ScamRoad: Edge AI Road Defect Detection and Municipal Workflow Portal
- **Presenter:** Priye Ranjan (B.Tech CSE Capstone Project)
- **Visual Asset:** `web/src/components/Logo.tsx` (S-road perspective mark) + `docs/screenshots/live_01_dashboard_light.png`
- **Core Talking Points:**
  - Automated dashcam road distress detection using real Edge AI.
  - Mandatory disclaimer: Academic student research project (Rule R7). Not affiliated with MoRTH, NHAI, or PWD.
  - Zero synthetic data, zero fake AI: every claim is provable by audit scripts.

---

### Slide 2: Problem Statement & Municipal Realities
- **Headline:** The Road Distress Crisis & Asynchronous Municipal Maintenance
- **Visual Asset:** `data/sample/splits/images/train/India_000001.jpg` (Severe crater) & `config/severity_thresholds.json`
- **Core Talking Points:**
  - Potholes and alligator cracks cause vehicle accidents and infrastructure degradation.
  - Traditional audits rely on manual inspections or expensive specialized LiDAR profiler trucks.
  - Municipal pain point: duplicate citizen complaints, lack of objective damage tracking, and unverified repairs.

---

### Slide 3: Scientific Principles & Truth Over Appearance (Rules R1–R15)
- **Headline:** Engineering Integrity & Ground Rules
- **Visual Asset:** `scripts/check_claims.py` terminal output (PASS, 0 violations)
- **Core Talking Points:**
  - **Rule R1:** Evidence only. No hand-typed or simulated metrics.
  - **Rule R2:** Zero Fake AI. Seeded data clearly carries `DEMO DATA SEEDED` badge.
  - **Rule R4:** Pixels and relative % only; depth requires calibrated physical hardware.
  - **Rule R5:** AI never closes work orders; human municipal engineer sign-off required.
  - **Rule R6:** 100% face and license plate privacy blur verified on-device.

---

### Slide 4: Neural Architecture & INT8 Quantization
- **Headline:** YOLO11n ONNX INT8: Balancing Accuracy & Edge Latency
- **Visual Asset:** `ml/quantize.py` + `ml/runs/metrics.json`
- **Core Talking Points:**
  - Modified CSPNet backbone with PANet multi-scale feature aggregation.
  - Post-training static quantization (PTQ) via ONNX Runtime: 10.9 MB down to 3.1 MB (-71.6% memory reduction).
  - CPU p50 latency: **73.57 ms** (13.6 FPS), comfortably exceeding the $\ge 10\text{ FPS}$ dashcam capture threshold.

---

### Slide 5: Empirical Results on Held-Out Test Split
- **Headline:** Rigorous Evaluation on RDD2022-India Split
- **Visual Asset:** `docs/screenshots/live_13b_evaluation_benchmarks.png` + `docs/AI_EVALUATION.md`
- **Core Talking Points:**
  - Evaluated on $N=50$ held-out Indian road images with 105 ground-truth defects.
  - **mAP@50:** `85.75%` | **mAP@50-95:** `62.12%`
  - **Precision:** `86.58%` | **Recall:** `83.95%` | **F1-Score:** `85.22%`
  - **Expected Calibration Error (ECE):** `1.91%` (high probabilistic reliability).

---

### Slide 6: 3-Axis Systematic Ablation Study
- **Headline:** Model Selection Rationale: Capacity vs Resolution vs Precision
- **Visual Asset:** `ml/runs/ablation.json` & Table in `docs/EXPERIMENTS.md`
- **Core Talking Points:**
  - Capacity: YOLO11s (+1.4% mAP) requires 182 ms (5.5 FPS) $\rightarrow$ Rejected (breaches real-time SLA).
  - Resolution: 800px (+0.6% mAP) requires 125 ms (8.0 FPS) $\rightarrow$ Rejected.
  - Quantization: INT8 sacrifices only 1.2% mAP vs FP32 while reducing latency by 24% and storage by 71.6%.
  - Verdict: YOLO11n INT8 at 640px is the optimal edge configuration.

---

### Slide 7: Hard-Negative Mining & False Alarm Reduction
- **Headline:** Suppressing Edge False Positives on Indian Roads
- **Visual Asset:** `data/sample/splits/images/train/hard_neg_*.jpg` (15 background controls)
- **Core Talking Points:**
  - Common false positives on Indian roads: tree shadows, bitumen patch seams, cast-iron manholes, cattle guards.
  - Mined 15 hard-negative background images with 0-byte labels into training split.
  - Result: False alarms dropped by **55.6%** (from 9 FP to 4 FP), boosting macro precision from 84.1% to 86.6% with zero recall loss.

---

### Slide 8: The "One Pothole = One Record" Engine
- **Headline:** Multi-Tier Spatial Deduplication
- **Visual Asset:** Architecture flowchart from `docs/PROJECT_REPORT.md`
- **Core Talking Points:**
  - Level 1: In-video ByteTrack persistence rejects transient detections $<3$ frames.
  - Level 2: Edge node aggregates sightings, computing median dimensions and selecting the clearest frame.
  - Level 3: PostGIS spatial queries (`ST_DWithin` with GPS accuracy radius) prevent duplicate work orders on repeat passes.

---

### Slide 9: PWA Drive Mode & Sensor Fusion Lite
- **Headline:** Installable Mobile Capture App & Mechanical Bump Cross-Validation
- **Visual Asset:** `docs/screenshots/live_16_mobile_capture_pwa.png`
- **Core Talking Points:**
  - Progressive Web App (`/capture`) installable on iOS/Android without app-store dependencies (ADR-006).
  - Glanceable HUD: big speedometer (km/h), NavIC/GPS accuracy, acoustic Web Audio chime on detection.
  - Sensor Fusion Lite (`edge/agent/sensor_fusion.py`): correlates camera detections with smartphone accelerometer vertical shock spikes (`⚡ Camera + IMU Bump Agree`).

---

### Slide 10: Non-Geographic Municipal Command Center
- **Headline:** Actionable Ward Heat-Grids Over Demo Maps
- **Visual Asset:** `docs/screenshots/live_01_dashboard_light.png`
- **Core Talking Points:**
  - Removed third-party tile map dependencies to eliminate network lag and vanity demos.
  - Replaced with actionable administrative **Ward Hotspot Grid** (4-tier canonical distress colors) and **Top 10 Worst Corridors distress leaderboard** with 7-day sparklines.
  - Defect Registry provides 5-decimal coordinates, ward, road segment, and one-click external map navigation.

---

### Slide 11: Governance: Human Sign-Off & Privacy Redaction
- **Headline:** Public Accountability & Privacy by Design
- **Visual Asset:** `docs/screenshots/live_05_work_order_dispatched.png` & `bench/privacy_blur_report.json`
- **Core Talking Points:**
  - Rule R5: Strict role-based access control (RBAC). Contractors cannot approve their own work.
  - Work order closure requires human municipal engineer verification with before/after photos and audit logging.
  - Rule R6: Automated privacy blur for citizen faces and vehicle license plates (100% recall verified).

---

### Slide 12: Engineering Limitations & Academic Conclusion
- **Headline:** Honesty in Scope, Known Boundaries, and Future Roadmap
- **Visual Asset:** `docs/LIMITATIONS.md` & `docs/screenshots/live_13b_evaluation_benchmarks.png`
- **Core Talking Points:**
  - Honest limitations: Heavy simulated rain degrades optical recall; monocular RGB cannot estimate millimetric depth without stereo calibration.
  - Future work: Stereo disparity depth estimation, district-wide municipal deployment in Ludhiana, Punjab.
  - Summary: A rigorous, provable, and reproducible B.Tech CSE thesis system.
