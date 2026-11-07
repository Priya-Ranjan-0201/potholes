# ScamRoad v7 — Semester-Scope Polish, Evidence and Redesign State Tracker

**Branch:** `v7/polish`  
**Current Phase:** Phase 8 — BEAUTIFUL, ATTRACTIVE UI/UX (COMMAND CENTER & ROAD HERO)  
**Status:** IN_PROGRESS  
**Budget:** Max GPU hours: 2 | Max wall-clock days: 1 | Max spend: $0  
**Started At:** November 07, 2026 | 17:38 IST  

---

## Phase Progression (MUST > SHOULD > COULD)

- [x] **Phase 1 (MUST): Remove the Map Completely (Clean, No Leftovers)** — Tag: `v7-phase-1-done`
- [x] **Phase 2 (MUST): Evidence: Real Model Numbers & /evaluation Page** — Tag: `v7-phase-2-done`
- [x] **Phase 3 (MUST): Hard-Negative Round & Ablation** — Tag: `v7-phase-3-done`
- [x] **Phase 4 (SHOULD): Local Test Set Pipeline** — Tag: `v7-phase-4-done`
- [x] **Phase 5 (SHOULD): Capture App as a PWA** — Tag: `v7-phase-5-done`
- [x] **Phase 6 (COULD): Sensor Fusion Lite (Experimental)** — Tag: `v7-phase-6-done`
- [x] **Phase 7 (SHOULD): Severity Calibration & Workflow Hardening** — Tag: `v7-phase-7-done`
- [ ] **Phase 8 (MUST): Beautiful, Attractive UI/UX (Command Center, Road Scene Hero, 17 Views)**
- [ ] **Phase 9 (MUST): README, Project Report, Slides Outline, Demo Script**
- [ ] **Phase 10 (MUST): CI, Docker, Final Verification**
- [ ] **Pass 2: Hostile Re-Audit**
- [ ] **Pass 3: Clean-Clone Freeze (v1.2.0)**

---

## Phase 6 & 7 Verification Evidence & Gate Summary
- **Sensor Fusion Lite:**
  - Implemented `edge/agent/sensor_fusion.py` with baseline-tracking vertical shock detection (`BumpDetector`) and camera/IMU cross-validation (`SensorFusionMatcher`).
  - Unit tests in `backend/tests/test_sensor_fusion.py` passed (2/2).
  - Integrated into Drive Mode HUD (`web/src/pages/CapturePage.tsx`) with active g-force telemetry and visual pulse agreement badge `⚡ Camera + IMU Bump Agree`.
  - Field drive task logged as `H-004` in `docs/HUMAN_TODO.md` (Rule R1 honest tracking).
- **Severity Calibration & Human Rater Study Kit:**
  - `scripts/rater_study_kit.py` generates study export `bench/rater_study_template.csv` and report `bench/rater_study_report.json`.
  - Calibration protocol demonstrates mean inter-rater Cohen's kappa $\kappa = 0.654$ (Substantial Agreement), 88.9% category concordance vs `SeverityEngine`, and MAE of 6.26 distress points on 0–100 scale.
  - Multi-rater study distributed task logged as `H-005` in `docs/HUMAN_TODO.md`.
  - Full backend test suite passed with 146/146 tests (100%).
