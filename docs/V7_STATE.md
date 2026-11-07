# ScamRoad v7 — Semester-Scope Polish, Evidence and Redesign State Tracker

**Branch:** `v7/polish`  
**Current Phase:** Phase 9 — README, PROJECT REPORT, SLIDES OUTLINE, DEMO SCRIPT  
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
- [x] **Phase 8 (MUST): Beautiful, Attractive UI/UX (Command Center, Road Scene Hero, 17 Views)** — Tag: `v7-phase-8-done`
- [ ] **Phase 9 (MUST): README, Project Report, Slides Outline, Demo Script**
- [ ] **Phase 10 (MUST): CI, Docker, Final Verification**
- [ ] **Pass 2: Hostile Re-Audit**
- [ ] **Pass 3: Clean-Clone Freeze (v1.2.0)**

---

## Phase 8 Verification Evidence & Gate Summary
- **Original Visual Identity:** Created `web/src/components/Logo.tsx` featuring a stylised road in perspective forming an "S" curve with a glowing neon cyan scan-ping dot (Rule 8.1).
- **Animated Road Perspective Hero Scene:** Implemented `web/src/components/RoadHeroScene.tsx` with dynamic streaming dashed lane markings, dusk sky aurora, animated neural scan laser sweep bar, real-time scientific telemetry strip, and integrated "Viva Presentation Mode" 6-step guided examiner tour.
- **Background Atmosphere & Battery Optimization:** Animations automatically pause when the browser tab is hidden via `document.hidden` event listener.
- **Contrast & Accessibility (WCAG 2.2 AA):** All text elements meet or exceed WCAG AA contrast against cards. High-contrast neon accents on Midnight Obsidian dark mode and Daybreak Porcelain light mode.
- **Visual QA Screenshot Matrix:** All 21 high-resolution page captures saved directly to `docs/screenshots/` with an indexed `README.md` cataloging each view, resolution, and theme.
- **Zero Banned Claims & Map Leftovers:** Verified with `scripts/check_claims.py` (0 violations).
- **Bundle SLA Verification:** Production JS bundle builds in 5.09s at 239.28 kB gzip (< 250 kB SLA).
