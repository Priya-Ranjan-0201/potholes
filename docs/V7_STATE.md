# ScamRoad v7 — Semester-Scope Polish, Evidence and Redesign State Tracker

**Branch:** `v7/polish`  
**Current Phase:** Phase 2 — EVIDENCE: REAL MODEL NUMBERS & /EVALUATION PAGE  
**Status:** IN_PROGRESS  
**Budget:** Max GPU hours: 2 | Max wall-clock days: 1 | Max spend: $0  
**Started At:** November 07, 2026 | 17:38 IST  

---

## Phase Progression (MUST > SHOULD > COULD)

- [x] **Phase 1 (MUST): Remove the Map Completely (Clean, No Leftovers)** — Tag: `v7-phase-1-done`
- [ ] **Phase 2 (MUST): Evidence: Real Model Numbers & /evaluation Page**
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

## Phase 1 Verification Evidence & Gate Summary
- **Leaflet & OSM Purge:** `git grep -iE 'leaflet|react-leaflet' web/` returned 0 matches.
- **Bundle Reduction:** Production JS bundle dropped from ~972 kB to 830.80 kB (reduction of >141 kB).
- **Replacements Implemented:**
  - **Ward Hotspot Grid:** Non-geographic heat-grid on `/` with color-coded risk tiles and repair progress.
  - **Top 10 Worst Corridors:** Ranked distress leaderboard on `/` with damage density and 7-day sparklines.
  - **Defect Registry Enhancements:** On `/defects`, added sortable table & card grid view, coordinates to 5 decimals, road segment, ward, GPS accuracy (±2.4m), one-click "Copy coordinates" with feedback, and external "Open in maps app" deep links.
  - **Severity Canonical Config:** Standardized on `config/severity_thresholds.json` (Minor `#2EC4B6`, Moderate `#FFB703`, Severe `#FB6A2F`, Critical `#E5233A`).
- **Clean 404:** Created `NotFoundPage.tsx` handling `/map` and unknown routes gracefully.
- **Banned Phrase Gate:** `python scripts/check_claims.py` passed with 0 violations.
- **i18n Parity:** `python scripts/check_i18n_keys.py` verified 100% dictionary parity (135/135 keys).
- **Test Matrix:**
  - 8/8 Vitest tests passed.
  - 144/144 Pytest tests passed.
  - 19/19 Live Chrome Selenium tests passed.
  - 15 UI matrix screenshots captured.
