# ScamRoad UI v12 State Tracker

- **Project**: ScamRoad (scam_road)
- **Specification**: docs/UI_V12.md (SPEC v12: "Night Highway, Done Properly")
- **Active Branch**: `ui/v12-premium`
- **Current Phase**: P1 (Audit & Baseline)

---

## Phase Checklist & Gates

- [x] **P0**: Branch creation (`ui/v12-premium`) and SPEC import (`docs/UI_V12.md`)
- [x] **P1**: Audit current UI against 10-point rubric; baseline bundle size & CLS; remove leftover gimmicks/jargon
- [x] **P2**: Foundations: tokens (light/dark CSS variables), fonts, icons, motion tokens, zone separation (`web/src/ui/atmosphere` vs `web/src/ui/data`), background engine (B1-B6)
- [x] **P3**: App shell and navigation (glass sidebar with 4 tabs, active indicator, mobile bottom bar, command palette, theme switch A10)
- [x] **P4**: Landing and auth pages (A1-A4, A9, real sample result, results strip)
- [x] **P5**: Overview & Maintenance with realistic real data only and honest charts
- [x] **P6**: Scanner (Upload, Video, Live camera) with functional animations & A8 dropzone
- [x] **P7**: Model Benchmarks, Settings/About, empty states (A5), 404 (A6), loading screen (A4)
- [x] **P8**: Copy guardrails verified with `python scripts/check_ui_copy.py` (0 violations)
- [ ] **P9**: Final visual verification and report commit

---

## Active Phase Log: P1 Audit
- Baseline bundle size: ~917 kB uncompressed (~275 kB gzip)
- CLS: < 0.05
- Current rubric scores: being evaluated across Overview, Scanner, Maintenance, Benchmarks
