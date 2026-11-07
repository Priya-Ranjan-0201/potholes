# ScamRoad — Autonomous Fix, Hardening & Redesign State Tracker

**Branch:** `fix/redesign-v6`  
**Current Phase:** Phase 2 — HONESTY AND CLAIM FIXES  
**Status:** IN_PROGRESS  
**Last Updated:** November 07, 2026 | 16:16 IST  

---

## Phase Progression

- [x] **Phase 1: Real Audit (Read-Only)**
  - Deliverable: `docs/STATUS_AUDIT.md`
  - Gate: Audit written, 38 OpenAPI endpoints, 39 tables, 4 model weights, and every README claim classified.
  - Completed: November 07, 2026 | Tag: `fix-phase-1-done`
- [ ] **Phase 2: Honesty and Claim Fixes**
  - Plan: Create `scripts/check_claims.py`, purge false GoI/MoRTH/NHAI branding, replace compliance badges with honest inspired rubrics, add rate card config, fix notebook URLs, update README.md.
  - Deliverables: `scripts/check_claims.py`, updated `README.md`, `config/rate_card.json`, updated `Navbar.tsx`, `Footer.tsx`, `LanguageContext.tsx`.
  - Gate: `python scripts/check_claims.py` passes with 0 violations.
- [ ] **Phase 3: ML Correctness and Evidence**
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

---

## Open Issues & Non-Blocking Findings

1. `web/src/components/Navbar.tsx` and `Footer.tsx`: Government branding and emblems to be replaced by neutral student project text.
2. `web/src/context/LanguageContext.tsx`: Translation keys contain "Government of India", "MoRTH & PWD", "Compliant".
3. `ml/training/train_detect.py`: PyTorch 2.5 import error on `torch.utils.serialization`.
4. `infer.py` & `ScannerPage.tsx`: Confidence conflated with severity; hardcoded repair costs.
5. `README.md`: Hardware benchmarks need "UNTESTED" status for unmeasured mobile/SBC targets.
