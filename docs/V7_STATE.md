# ScamRoad v7 — Semester-Scope Polish, Evidence and Redesign State Tracker

**Branch:** `v7/polish`  
**Current Phase:** Phase 3 — HARD-NEGATIVE ROUND & ABLATION  
**Status:** IN_PROGRESS  
**Budget:** Max GPU hours: 2 | Max wall-clock days: 1 | Max spend: $0  
**Started At:** November 07, 2026 | 17:38 IST  

---

## Phase Progression (MUST > SHOULD > COULD)

- [x] **Phase 1 (MUST): Remove the Map Completely (Clean, No Leftovers)** — Tag: `v7-phase-1-done`
- [x] **Phase 2 (MUST): Evidence: Real Model Numbers & /evaluation Page** — Tag: `v7-phase-2-done`
- [ ] **Phase 3 (MUST): Hard-Negative Round & Ablation**
- [ ] **Phase 4 (SHOULD): Local Test Set Pipeline**
- [ ] **Phase 5 (SHOULD): Capture App as a PWA**
- [ ] **Phase 6 (COULD): Sensor Fusion Lite (Experimental)**
- [ ] **Phase 7 (SHOULD): Severity Calibration & Workflow Hardening**
- [ ] **Phase 8 (MUST): Beautiful, Attractive UI/UX (Command Center, Road Scene Hero, 17 Views)**
- [ ] **Phase 9 (MUST): README, Project Report, Slides Outline, Demo Script**
- [ ] **Phase 10 (MUST): CI, Docker, Final Verification**
- [ ] **Pass 2: Hostile Re-Audit**
- [ ] **Pass 3: Clean-Clone Freeze (v1.2.0)**

---

## Phase 2 Verification Evidence & Gate Summary
- **Metrics JSON Generated:** `ml/runs/metrics.json` verified with real ONNX Runtime CPU latency benchmark (p50: 73.57ms, 13.6 FPS), mAP@50: 85.75%, mAP@50-95: 62.12%, macro precision: 86.58%, macro recall: 83.95%, ECE: 1.91%.
- **AI Evaluation Report Generated:** `docs/AI_EVALUATION.md` matches metrics JSON exactly, citing RDD2022-India test split, SHA-256 hash, and host CPU specs.
- **In-App Evaluation Page:** `web/src/pages/EvaluationPage.tsx` built with KPI summary cards, per-class breakdown table, interactive 5x5 confusion matrix with cell hover inspect, 10-bin reliability diagram, and 6-case failure gallery (3 FP, 3 FN).
- **Backend API Endpoint:** Added `GET /api/v1/models/evaluation` in `backend/app/api/v1/infer.py`.
- **Multilingual Support:** Added `navEvaluation` across all 6 Indian languages (136/136 keys verified 100% parity).
- **Selenium Browser Suite:** 20/20 tests passed including live `/evaluation` page verification.
