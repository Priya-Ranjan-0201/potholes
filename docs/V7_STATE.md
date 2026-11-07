# ScamRoad v7 — Semester-Scope Polish, Evidence and Redesign State Tracker

**Branch:** `v7/polish`  
**Current Phase:** Phase 5 — CAPTURE APP AS A PWA  
**Status:** IN_PROGRESS  
**Budget:** Max GPU hours: 2 | Max wall-clock days: 1 | Max spend: $0  
**Started At:** November 07, 2026 | 17:38 IST  

---

## Phase Progression (MUST > SHOULD > COULD)

- [x] **Phase 1 (MUST): Remove the Map Completely (Clean, No Leftovers)** — Tag: `v7-phase-1-done`
- [x] **Phase 2 (MUST): Evidence: Real Model Numbers & /evaluation Page** — Tag: `v7-phase-2-done`
- [x] **Phase 3 (MUST): Hard-Negative Round & Ablation** — Tag: `v7-phase-3-done`
- [x] **Phase 4 (SHOULD): Local Test Set Pipeline** — Tag: `v7-phase-4-done`
- [ ] **Phase 5 (SHOULD): Capture App as a PWA**
- [ ] **Phase 6 (COULD): Sensor Fusion Lite (Experimental)**
- [ ] **Phase 7 (SHOULD): Severity Calibration & Workflow Hardening**
- [ ] **Phase 8 (MUST): Beautiful, Attractive UI/UX (Command Center, Road Scene Hero, 17 Views)**
- [ ] **Phase 9 (MUST): README, Project Report, Slides Outline, Demo Script**
- [ ] **Phase 10 (MUST): CI, Docker, Final Verification**
- [ ] **Pass 2: Hostile Re-Audit**
- [ ] **Pass 3: Clean-Clone Freeze (v1.2.0)**

---

## Phase 4 Verification Evidence & Gate Summary
- **Collection Protocol Documented:** `docs/DATA_COLLECTION.md` details smartphone mounting, 1.2–1.5m height, 10–15° pitch, 1080p@30 FPS, 10:00–16:00 solar lighting, dry asphalt, and Rule R6 privacy redaction.
- **Labeling Guide Documented:** `docs/LABELING_GUIDE.md` details single-source taxonomy mapping (`shared/taxonomy.yaml`), 20x20px minimum bounding box, and rigorous edge-case disambiguation (bitumen patch, cast iron manholes, bridge joints, tree shadows).
- **Intake Pipeline Created:** `scripts/ingest_local_sample.py` extracts frames, runs privacy blurring (`PrivacyRedactor`), and generates draft YOLO annotations.
- **Local Sample Dataset:** 10 verified campus/city road frames created in `data/local_sample/` with YOLO ground-truth annotations (including clean road, shadow, and manhole background negative controls).
- **Evaluation Benchmark:** `scripts/eval_local.py` runs in 4.17s (< 30s SLA) and outputs `bench/local_eval.json`.
- **Claims Check:** `python scripts/check_claims.py` passed with 0 violations.
