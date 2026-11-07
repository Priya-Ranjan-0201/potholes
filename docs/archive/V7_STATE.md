# ScamRoad v7 — Semester-Scope Polish, Evidence and Redesign State Tracker

**Branch:** `v7/polish`  
**Current Phase:** COMPLETED & FROZEN (`v1.2.0`)  
**Status:** ALL PHASES & PASSES PASSED  
**Budget:** Max GPU hours: 2 | Actual GPU hours: 0.45 | Max spend: $0  
**Completed At:** November 07, 2026 | 18:46 IST  

---

## Phase Progression (MUST > SHOULD > COULD) — 100% COMPLETE

- [x] **Phase 1 (MUST): Remove the Map Completely (Clean, No Leftovers)** — Tag: `v7-phase-1-done`
- [x] **Phase 2 (MUST): Evidence: Real Model Numbers & /evaluation Page** — Tag: `v7-phase-2-done`
- [x] **Phase 3 (MUST): Hard-Negative Round & Ablation** — Tag: `v7-phase-3-done`
- [x] **Phase 4 (SHOULD): Local Test Set Pipeline** — Tag: `v7-phase-4-done`
- [x] **Phase 5 (SHOULD): Capture App as a PWA** — Tag: `v7-phase-5-done`
- [x] **Phase 6 (COULD): Sensor Fusion Lite (Experimental)** — Tag: `v7-phase-6-done`
- [x] **Phase 7 (SHOULD): Severity Calibration & Workflow Hardening** — Tag: `v7-phase-7-done`
- [x] **Phase 8 (MUST): Beautiful, Attractive UI/UX (Command Center, Road Scene Hero, 17 Views)** — Tag: `v7-phase-8-done`
- [x] **Phase 9 (MUST): README, Project Report, Slides Outline, Demo Script** — Tag: `v7-phase-9-done`
- [x] **Phase 10 (MUST): CI, Docker, Final Verification** — Tag: `v7-phase-10-done`
- [x] **Pass 2: Hostile Re-Audit** — PASSED (`scripts/pass2_hostile_audit.py`)
- [x] **Pass 3: Clean-Clone Freeze (v1.2.0)** — PASSED (`scripts/reproduce_clean_clone.py`)

---

## Final Freeze Verification Summary (v1.2.0)
1. **Total Test Coverage:** 146 Python tests passing (100%), 8 Vitest web tests passing (100%), 21 live Chrome E2E browser tests passing (0 failures).
2. **Scientific AI Results:** 85.75% mAP@50, 62.12% mAP@50-95, 86.58% Precision, 83.95% Recall, 1.91% ECE, 73.57ms p50 CPU latency (13.6 FPS), 3.10 MB INT8 model.
3. **Map Removal:** 0 Leaflet / OSM references in `web/` or documentation; fully replaced by Ward Hotspot Grid and Top 10 Worst Corridors distress leaderboard.
4. **PWA Drive Mode HUD:** Web manifest, service worker shell cache, speedometer (km/h), NavIC/GPS accuracy, acoustic detection chime, and IndexedDB outbox.
5. **Sensor Fusion Lite:** Windowed vertical shock baseline detection cross-validating optical detections with mechanical wheel impacts.
6. **Viva Deliverables:** `README.md`, `docs/PROJECT_REPORT.md` (thesis), `docs/SLIDES_OUTLINE.md` (12 slides), `docs/DEMO_SCRIPT.md` (live demo timeline).
7. **Adversarial Honesty Gate:** `scripts/check_claims.py` and `scripts/pass2_hostile_audit.py` pass with 0 violations.
