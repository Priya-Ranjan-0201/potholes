# ScamRoad — Autonomous Fix, Hardening & Redesign State Tracker

**Branch:** `fix/redesign-v6`  
**Current Phase:** Phase 5 — RESTORE THE MAP AND CORE GIS FEATURES  
**Status:** IN_PROGRESS  
**Last Updated:** November 07, 2026 | 16:31 IST  

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
- [ ] **Phase 5: Restore the Map and Core GIS Features**
- [ ] **Phase 6: Frontend Code Quality**
- [ ] **Phase 7: UI/UX Redesign (Visual Overhaul & Motion)**
- [ ] **Phase 8: Tests, CI, Docs, Deploy**
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

---

## Open Issues & Non-Blocking Findings

None blocking. Proceeding to Phase 5 Map Restoration.
