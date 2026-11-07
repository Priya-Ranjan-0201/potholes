# ScamRoad v7 — Semester-Scope Polish, Evidence and Redesign State Tracker

**Branch:** `v7/polish`  
**Current Phase:** PASS 2: HOSTILE RE-AUDIT & PASS 3: CLEAN-CLONE FREEZE  
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
- [x] **Phase 9 (MUST): README, Project Report, Slides Outline, Demo Script** — Tag: `v7-phase-9-done`
- [x] **Phase 10 (MUST): CI, Docker, Final Verification** — Tag: `v7-phase-10-done`
- [ ] **Pass 2: Hostile Re-Audit**
- [ ] **Pass 3: Clean-Clone Freeze (v1.2.0)**

---

## Phase 10 Verification Evidence & Gate Summary
- **GitHub Actions Hardening:** `.github/workflows/ci.yml` expanded to monitor `v7/*` branches, execute all 146 pytest tests, verify `scripts/check_claims.py`, run ESLint 9 + TypeScript `tsc --noEmit`, vitest web tests, and build Docker images.
- **Docker Compose:** `docker-compose.yml` verified with PostGIS healthcheck, API service, and volume persistence.
- **Disaster Recovery Drill:** `scripts/backup_restore_drill.py` executed successfully, generating an atomic database backup, SHA-256 integrity hash, simulated entity restore, and Rule R5 compliance check without corruption.
- **Full Backend Test Suite:** 146/146 tests passing (100% pass rate).
