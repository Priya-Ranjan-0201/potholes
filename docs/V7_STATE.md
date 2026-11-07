# ScamRoad v7 — Semester-Scope Polish, Evidence and Redesign State Tracker

**Branch:** `v7/polish`  
**Current Phase:** Phase 6/7 — SENSOR FUSION LITE & SEVERITY CALIBRATION  
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
- [ ] **Phase 6 (COULD): Sensor Fusion Lite (Experimental)**
- [ ] **Phase 7 (SHOULD): Severity Calibration & Workflow Hardening**
- [ ] **Phase 8 (MUST): Beautiful, Attractive UI/UX (Command Center, Road Scene Hero, 17 Views)**
- [ ] **Phase 9 (MUST): README, Project Report, Slides Outline, Demo Script**
- [ ] **Phase 10 (MUST): CI, Docker, Final Verification**
- [ ] **Pass 2: Hostile Re-Audit**
- [ ] **Pass 3: Clean-Clone Freeze (v1.2.0)**

---

## Phase 5 Verification Evidence & Gate Summary
- **Installable PWA Manifest:** `web/public/manifest.json` configured with standalone display, theme color `#070a14`, and SVG app icons (`icon-192.svg`, `icon-512.svg`).
- **Service Worker Shell Caching:** `web/public/sw.js` implements cache-first offline shell fallback.
- **Drive Mode HUD (/capture):** Created `web/src/pages/CapturePage.tsx` with high-contrast speedometer HUD (km/h), NavIC/GPS accuracy ($\pm 2.1\text{m}$), defect counters, Web Audio API acoustic chime on defect detection with mute toggle, camera stream with realistic fallback, and IndexedDB offline outbox queue.
- **Offline Outbox & Idempotency:** Implemented IndexedDB outbox queue (`scamroad-capture-outbox`) with idempotency keys, pending status counts, and explicit "Sync Outbox Now" capability.
- **Architectural Decision Recorded:** `docs/DECISIONS.md` records ADR-006 explaining why PWA was selected over native Expo to prevent dual-codebase maintenance and guarantee web parity.
- **Multilingual Support:** Added `navCapture` across all 6 languages in `LanguageContext.tsx` (137/137 keys, 100% parity).
- **Automated Live Test:** TEST 15 added to `scripts/live_test_suite.py` passing with 21/21 tests in Chrome browser.
