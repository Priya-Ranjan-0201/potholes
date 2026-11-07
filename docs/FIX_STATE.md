# ScamRoad — Autonomous Fix, Hardening & Redesign State Tracker

**Branch:** `fix/redesign-v6`  
**Current Phase:** Phase 3 — ML CORRECTNESS AND EVIDENCE  
**Status:** IN_PROGRESS  
**Last Updated:** November 07, 2026 | 16:21 IST  

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
- [ ] **Phase 3: ML Correctness and Evidence**
  - Plan: Patch `ml/training/train_detect.py` serialization import, decouple confidence from severity in `backend/app/api/v1/infer.py`, generate `bench/privacy_blur_report.json` and `ml/runs/metrics.json`, achieve 144/144 passing pytest tests.
  - Gate: 144/144 tests passing, ONNX parity and blur recall verified.
- [ ] **Phase 4: Backend, Database, Security**
- [ ] **Phase 5: Restore the Map and Core GIS Features**
- [ ] **Phase 6: Frontend Code Quality**
- [ ] **Phase 7: UI/UX Redesign (Visual Overhaul & Motion)**
- [ ] **Phase 8: Tests, CI, Docs, Deploy**
- [ ] **Pass 2: Hostile Re-Audit & Backlog Fix**
- [ ] **Pass 3: Clean-Clone Reproduction & Freeze (v1.1.0)**

---

## Evidence Paths

- `docs/STATUS_AUDIT.md` — Phase 1 comprehensive codebase and claims audit report
- `scripts/check_claims.py` — Phase 2 automated claim honesty checker (0 violations)
- `config/rate_card.json` — Phase 2 configurable repair cost rate card

---

## Open Issues & Non-Blocking Findings

1. `ml/training/train_detect.py`: PyTorch 2.5 import error on `torch.utils.serialization`.
2. `backend/app/api/v1/infer.py`: Conflation of confidence with severity (Rule R4).
3. `edge/agent/blur_privacy.py`: Needs quantitative blur recall benchmark (Rule R6).
