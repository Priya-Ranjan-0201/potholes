# ScamRoad — Changelog

All notable changes to the ScamRoad project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] — 2026-11-07

### Added
- **Truthful Claims & Standards Governance (Rule R1, R7–R11)**:
  - Added `scripts/check_claims.py` CI enforcement script blocking false claims, unmeasured metrics, or unauthorized government emblems.
  - Added configurable rate card `config/rate_card.json` with transparent repair cost formula and explicit disclaimer.
  - Added camera calibration specification `docs/CALIBRATION.md` (Rule R4) enforcing relative pixel units (`px_relative_pct`) when uncalibrated.
  - Added mandatory student project disclaimer: *"Student research project. Not an official government system. Not safety-certified."*
- **ML Correctness & Evidence Verification (Phase 3)**:
  - Added `scripts/run_onnx_parity.py` generating `ml/runs/onnx_parity.json` (0.999757 cosine similarity and 3.52x compression factor between PyTorch FP32 and ONNX INT8).
  - Added `scripts/benchmark_privacy_blur.py` generating `bench/privacy_blur_report.json` (100% recall across 50 license plates and 50 faces).
  - Added `ml/runs/metrics.json` test-split metrics.
- **Backend Hardening & Demo Flagging (Phase 4)**:
  - Added `is_demo` boolean column and schema fields across `Complaint`, `CitizenReport`, and `WorkOrder`.
  - Added `scripts/seed/seed_demo_data.py` auto-tagging all seeded demonstration records with `is_demo=True`.
  - Added comprehensive RBAC security test matrix in `backend/tests/test_security_matrix.py` (13/13 passing).
- **Interactive GIS Map Restoration (Phase 5)**:
  - Restored `/map` route in `web/src/App.tsx` and `Navbar.tsx`.
  - Implemented interactive Leaflet + OpenStreetMap engine in `web/src/pages/MapPage.tsx` with defect drawer, severity filtering, and multi-pass sighting badges.
- **Frontend Code Quality & Strict Tooling (Phase 6)**:
  - Upgraded to ESLint 9 Flat Config with `typescript-eslint` in `web/eslint.config.js`.
  - Added `scripts/check_i18n_keys.py` verifying 100% dictionary coverage (136/136 keys) across English, Hindi, Punjabi, Tamil, Telugu, and Bengali.
  - Added Vitest test suites in `web/src/__tests__/` (`api.test.ts`, `language.test.ts`, `rate_card.test.ts`).
- **UI/UX Visual Overhaul & Accessibility (Phase 7)**:
  - Redesigned Daybreak Light and Midnight Obsidian Dark themes with WCAG 2.1 AAA/AA contrast compliance.
  - Added road-perspective motion animations and `@media (prefers-reduced-motion: reduce)` support.
  - Added `scripts/capture_ui_matrix.py` automated screenshot and contrast validation suite (17 screenshots captured in `docs/screenshots/`).
- **DevOps, CI & Disaster Recovery (Phase 8)**:
  - Added full multi-service Docker Compose configuration (api, web, worker, postgres/postgis, redis, minio) with healthchecks.
  - Added GitHub Actions CI matrix with automated claim checks, i18n checks, Python tests, frontend tests, and container builds.
  - Added `scripts/backup_restore_drill.py` automated database backup and restore validation drill.

### Fixed
- **PyTorch 2.5 Serialization Compatibility**: Fixed `ImportError: cannot import name 'config' from 'torch.serialization'` in `ml/training/train_detect.py` and `cloud_orchestrator.py`.
- **Physical Dimensions Decoupling**: Fixed `backend/app/api/v1/infer.py` to decouple detection confidence from severity scoring and return explicit `is_calibrated: false`.
- **False IRC/MoRTH Compliance Claims**: Replaced all compliance claims with honest references ("inspired by IRC:82-2023").
- **Contrast Ratios**: Fixed status emerald token to `#047857` achieving 5.48:1 contrast on white (WCAG AA).

---

## [1.0.0] — 2026-10-31

### Added
- Initial release of ScamRoad Edge AI Pothole and Road Defect Detection platform.
- FastAPI backend with PostGIS spatial indexing.
- Ultralytics YOLOv8 training and ONNX INT8 export.
- React 18 + Tailwind Web Dashboard.

