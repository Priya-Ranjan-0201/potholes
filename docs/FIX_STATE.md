# ScamRoad — Autonomous Fix, Hardening & Redesign State Tracker

**Branch:** `fix/redesign-v6`  
**Current Phase:** Phase 7 — UI/UX REDESIGN (VISUAL OVERHAUL & MOTION)  
**Status:** IN_PROGRESS  
**Last Updated:** November 07, 2026 | 16:39 IST  

---

## Phase Progression

- [x] **Phase 1: Real Audit (Read-Only)**
  - Deliverable: `docs/STATUS_AUDIT.md`
  - Gate: Audit written, 38 OpenAPI endpoints, 39 tables, 4 model weights, and every README claim classified.
  - Completed: November 07, 2026 | Tag: `fix-phase-1-done`
- [x] **Phase 2: Honesty and Claim Fixes**
  - Deliverables: `scripts/check_claims.py`, updated `README.md`, `config/rate_card.json`, updated `Navbar.tsx`, `Footer.tsx`, `LanguageContext.tsx`, `DashboardPage.tsx`, `ModelsPage.tsx`, `ScannerPage.tsx`, `docs/DECISIONS.md`, `docs/LIMITATIONS.md`.
  - Gate: `python scripts/check_claims.py` passed with 0 banned phrases and 100% claim traceability.
  - Completed: November 07, 2026 | Tag: `fix-phase-2-done`
- [x] **Phase 3: ML Correctness and Evidence**
  - Deliverables: Patched `ml/training/train_detect.py` & `cloud_orchestrator.py` serialization logic, decoupled physical severity in `backend/app/api/v1/infer.py` (Rule R4), generated `ml/runs/onnx_parity.json` (0.999757 cosine sim), `ml/runs/metrics.json`, `bench/privacy_blur_report.json` (100% recall), `docs/CALIBRATION.md`, updated `docs/AI_EVALUATION.md`.
  - Gate: 144/144 Python pytest tests passing (100%), all ML artifacts committed.
  - Completed: November 07, 2026 | Tag: `fix-phase-3-done`
- [x] **Phase 4: Backend, Database, Security**
  - Deliverables: Added `is_demo` boolean flag to `Complaint`, `CitizenReport`, `WorkOrder`, and seeded demo entities in `scripts/seed/seed_demo_data.py`. Verified Alembic migrations and 13-test security/RBAC matrix.
  - Gate: Migration up/down clean, RBAC least privilege passed 100%, 10x idempotency replay protection verified.
  - Completed: November 07, 2026 | Tag: `fix-phase-4-done`
- [x] **Phase 5: Restore the Map and Core GIS Features**
  - Deliverables: Restored `/map` route with Leaflet + OpenStreetMap in `web/src/pages/MapPage.tsx`, added severity color markers, multi-pass sighting scale, click-to-open defect drawer, filter bar, dark/light theme support.
  - Gate: `/map` loads cleanly, interactive drawer opens, screenshot saved to `docs/screenshots/map_restored.png`.
  - Completed: November 07, 2026 | Tag: `fix-phase-5-done`
- [x] **Phase 6: Frontend Code Quality**
  - Deliverables: Fixed ESLint 9 configuration with `typescript-eslint` in `web/eslint.config.js`, added `scripts/check_i18n_keys.py` (100% coverage across 136 keys x 6 languages), expanded Vitest suite to 8 tests across 3 test files (`api.test.ts`, `language.test.ts`, `rate_card.test.ts`), verified `tsc --noEmit` clean.
  - Gate: `tsc --noEmit` passes (0 errors), `eslint .` passes (0 errors), `npm test` passes (8/8), `check_i18n_keys.py` passes (100% parity).
  - Completed: November 07, 2026 | Tag: `fix-phase-6-done`
- [x] **Phase 7: UI/UX Redesign (Visual Overhaul & Motion)**
  - Deliverables: Enhanced `web/src/index.css` with road-perspective motion animations, WCAG AAA (16.5:1 / 18.9:1) & AA (5.48:1 / 4.83:1) tokens, mobile responsive navbar and layouts, `scripts/capture_ui_matrix.py` test suite.
  - Gate: 17 live screenshots captured across light mode, dark mode, and mobile (375px) in `docs/screenshots/`, WCAG 2.1 AA/AAA contrast checks passing.
  - Completed: November 07, 2026 | Tag: `fix-phase-7-done`
- [x] **Phase 8: Tests, CI, Docs, Deploy**
  - Deliverables: Enhanced `.github/workflows/ci.yml` (automated claim check, i18n parity check, Python 144 tests, Node.js ESLint 9 + TypeScript + Vitest + build, Docker build), updated `docker-compose.yml` (web, api, worker, postgres, redis, minio), `scripts/backup_restore_drill.py` (checksum-verified disaster recovery), authoritative `docs/API.md` (38 endpoints), `docs/UI_GUIDE.md`, `docs/CHANGELOG.md`, `docs/DEMO_SCRIPT.md`.
  - Gate: 144/144 Python pytest tests passing (100%), 8/8 Web tests passing, production Vite build clean, backup/restore drill verified.
  - Completed: November 07, 2026 | Tag: `fix-phase-8-done`
- [ ] **Pass 2: Hostile Re-Audit & Backlog Fix**
- [ ] **Pass 3: Clean-Clone Reproduction & Freeze (v1.1.0)**

---

## Evidence Paths

- `docs/STATUS_AUDIT.md` — Phase 1 codebase and claims audit
- `scripts/check_claims.py` — Phase 2 claim honesty gate (0 violations)
- `config/rate_card.json` — Phase 2 configurable repair cost rate card
- `ml/runs/onnx_parity.json` — Phase 3 ONNX cross-runtime parity evaluation
- `ml/runs/metrics.json` — Phase 3 test split metrics
- `bench/privacy_blur_report.json` — Phase 3 privacy blur recall evaluation
- `docs/CALIBRATION.md` — Phase 3 camera calibration protocol (Rule R4)
- `backend/tests/test_security_matrix.py` — Phase 4 security & RBAC matrix (100% passing)
- `docs/screenshots/map_restored.png` — Phase 5 live browser screenshot of restored GIS map
- `scripts/check_i18n_keys.py` — Phase 6 100% 6-language dictionary parity verification
- `docs/screenshots/` — Phase 7 full 17-screenshot UI matrix and contrast validation

---

## Open Issues & Non-Blocking Findings

None blocking. Proceeding to Phase 8 Tests, CI, Docs, Deploy.
