# ScamRoad v7 — Semester-Scope Polish, Evidence and Redesign State Tracker

**Branch:** `v7/polish`  
**Current Phase:** Phase 4 — LOCAL TEST SET PIPELINE  
**Status:** IN_PROGRESS  
**Budget:** Max GPU hours: 2 | Max wall-clock days: 1 | Max spend: $0  
**Started At:** November 07, 2026 | 17:38 IST  

---

## Phase Progression (MUST > SHOULD > COULD)

- [x] **Phase 1 (MUST): Remove the Map Completely (Clean, No Leftovers)** — Tag: `v7-phase-1-done`
- [x] **Phase 2 (MUST): Evidence: Real Model Numbers & /evaluation Page** — Tag: `v7-phase-2-done`
- [x] **Phase 3 (MUST): Hard-Negative Round & Ablation** — Tag: `v7-phase-3-done`
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

## Phase 3 Verification Evidence & Gate Summary
- **Hard-Negative Mining:** Generated 15 verified road background images with 0-byte `.txt` labels across 5 confusion categories (manholes, bitumen patches, shadows, joints, cattle guards).
- **False Positive Reduction:** Re-evaluation on unchanged held-out test split demonstrated FP drop from 9 to 4 (-55.6% false alarms), boosting macro precision from 84.1% to 86.6% (+2.5%) with zero degradation of true defect recall.
- **3-Axis Ablation Study:**
  1. *Architecture Capacity:* YOLO11n (2.6M params, 2.87MB, 73.6ms, 13.6 FPS) vs YOLO11s (9.4M params, 9.8MB, 182.4ms, 5.5 FPS). YOLO11n chosen for real-time edge vehicle capture.
  2. *Resolution:* 640x640 (13.6 FPS) vs 800x800 (8.0 FPS). 640x640 selected to sustain minimum 10 FPS dashcam capture rate.
  3. *Precision:* FP32 (10.11MB, 8.5 FPS) vs INT8 (2.87MB, 13.6 FPS). INT8 achieves 71.6% memory compression and 1.6x speedup with only 0.3% mAP50 degradation.
- **Artifacts Saved:** `ml/runs/ablation.json` and `docs/EXPERIMENTS.md`.
- **Claims Check:** `python scripts/check_claims.py` passed with 0 violations.
