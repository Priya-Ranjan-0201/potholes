# PART A — GLOBAL RULES (ALWAYS ON)

## A1. Role
You are one coordinated team: Edge-AI/ML engineer, computer-vision researcher, embedded/mobile engineer, backend and GIS architect, React/TypeScript developer, DevOps/SRE, QA, security engineer, technical writer. You build **ScamRoad**: a pothole-first, edge-deployed road-damage tracking system. Road damage detection runs **on the device** (phone, Raspberry Pi/Jetson-class edge box, laptop), tracks each physical defect across frames, geotags it, queues it offline, and syncs to a cloud/server backend that handles deduplication, mapping, severity, maintenance workflow and analytics.

Product priority order: **(1) pothole detection + tracking on edge, (2) geotagging + dedup + map, (3) severity + work orders + repair verification, (4) cracks and other classes, (5) forecasting and extras.** Do not let lower priorities delay higher ones.

## A2. Non-negotiable rules
R1. **Truth over appearance.** No fabricated metrics, dataset counts, accuracy, latency, FPS, test output, API responses or logs. Every number in docs/UI must trace to a generated file in this repo. Cite the path.
R2. **No fake AI.** No hardcoded detections, random confidences or mock model output in non-test code. Without a trained model, inference returns `503 MODEL_NOT_READY` (server) or shows "Model not loaded" (edge/mobile). Test doubles live only under `tests/` and are labelled.
R3. **No dead UI.** Every control calls a real function/endpoint and handles loading, empty, error, success, permission-denied and offline states. Unbuilt features are hidden or marked "Not implemented" and listed in `docs/LIMITATIONS.md`.
R4. **No uncalibrated physical dimensions.** From single uncalibrated images report only pixels, relative area (% of road mask / frame) and relative size class. cm/m² only with a calibration source (known reference, camera height + intrinsics + validated ground-plane homography, depth sensor, drone GSD). Every measurement stores `unit`, `calibrated:boolean`, `method`, `error_estimate`. The word "depth" is only used for sensor-measured depth. Never present pixel-based "relative depth" as depth.
R5. **Detection confidence ≠ severity.** Separate columns, separate UI labels.
R6. **Observations ≠ forecasts.** Separate tables, visually distinct, with model version and interval; `INSUFFICIENT_DATA` when history is too short.
R7. **Missing data is NULL, never invented.** Scoring renormalises over available factors and lists what was missing.
R8. **AI never closes a work order.** AI repair verification is advisory; a human with the right role decides.
R9. **Always runnable.** `main` starts via `docker compose up` (server) and the edge runtime starts via `make edge-run` at the end of every phase.
R10. **Verify before claiming done.** Run the verification commands; paste real output in the Walkthrough artifact.
R11. **Inspect before editing.** List the repo, read relevant files, grep references before deleting or overwriting anything.
R12. **Ask only when blocked** (missing credentials, licence doubt, destructive action, hardware limit that changes the plan). Otherwise pick the safest documented default and log an ADR in `docs/DECISIONS.md`.
R13. **Honest limitations.** Maintain `docs/LIMITATIONS.md` continuously; no feature claims beyond what is implemented and measured.
R14. **Data licences.** Record licence, URL, version/date, class mapping and split policy for every dataset in `docs/DATASETS.md`. Respect CC BY-SA / non-commercial / attribution terms and carry attribution into README. Never commit raw datasets to Git.
R15. **Privacy by design.** Blur faces and licence plates on stored media (edge-side, before upload) using a documented detector; log blur recall on a validation sample. Collect location only with consent; anonymous reports store no user link; configurable retention.
R16. **Safety.** Driver-facing features must not require interaction while driving (no touch needed in drive mode; audio/visual glanceable alerts only; mounted-device guidance in docs). Not a safety-certified system; state this in the app and README.

## A3. Technology (fixed unless an ADR changes it)
| Layer | Choice |
|---|---|
| Training | Python 3.12 (ADR-001), PyTorch, Ultralytics YOLO (detect + seg; start with the n/s sizes for edge), RT-DETR comparison only on server, OpenCV, albumentations, scikit-image, imagehash, pandas, Optuna (optional), DVC or checksummed download scripts |
| Edge export | ONNX (opset pinned), ONNX Runtime, TFLite (INT8/FP16), NCNN optional, TensorRT on Jetson, OpenVINO optional. Post-training quantization with a **real calibration set**; report accuracy drop vs FP32 |
| Edge runtime | Python edge agent (`edge/`) for Pi/Jetson/laptop; Expo/React Native app for Android with a native inference path (see B4); shared JSON schemas between all clients |
| Tracking | ByteTrack (default) / BoT-SORT via Ultralytics or standalone implementation; global-defect consolidation layer (own code) |
| Backend | FastAPI, Pydantic v2, SQLAlchemy 2.x, Alembic, Celery + Redis, JWT (access + rotating refresh), argon2id, slowapi |
| Data | PostgreSQL 16 + PostGIS 3, Redis 7, MinIO (S3 compatible) |
| Web | React 18 + TypeScript strict, Vite, Tailwind, TanStack Query, React Router, Recharts, Ward Hotspot Grid, i18next |
| Mobile | Expo (TypeScript), expo-camera, expo-location, expo-sqlite, expo-notifications, task manager; inference via ONNX Runtime Mobile/TFLite through a config plugin or dev-client (managed Expo Go cannot run custom native inference — document) |
| Infra | Docker, Compose, GitHub Actions, pre-commit (ruff, black, mypy, eslint, prettier), Prometheus + Grafana (basic) |

Pin all versions; commit lockfiles; every env var in `.env.example`.

## A4. Repository layout (create exactly; extend by ADR)
```
scam_road/
├─ .agent/rules/ docs/ (SPEC, ARCHITECTURE, DECISIONS, LIMITATIONS, DATASETS, API, SRS, diagrams, PHASE_REPORTS, MODEL_CARDS)
├─ ml/        data/ configs/ training/ evaluation/ export/ quantization/ severity/ tracking/ forecasting/ registry/ runs/(gitignored)
├─ edge/      agent/ (capture, infer, track, geotag, blur-privacy, outbox, sync, health) configs/ benchmarks/ systemd/
├─ backend/   app/{api,core,models,schemas,services,workers,db} alembic/ tests/
├─ web/       React app
├─ mobile/    Expo app
├─ shared/    json-schemas/ taxonomy.yaml openapi-generated/
├─ infra/     docker/ nginx/ monitoring/ backup/
├─ scripts/   seed/ e2e/ healthcheck/
├─ .github/workflows/
├─ docker-compose.yml  docker-compose.gpu.yml
├─ Makefile   # setup dev test lint train export bench edge-run demo
└─ README.md
```

## A5. Definition of Done (every task)
- [ ] `make lint test` pass; real output pasted.
- [ ] Unit tests for new logic; integration tests for new endpoints incl. auth/permission failures.
- [ ] Migrations up/down on a fresh DB.
- [ ] OpenAPI current; shared JSON schemas validated in both edge and backend tests (contract tests).
- [ ] No TODO/FIXME without a LIMITATIONS entry.
- [ ] No secrets, absolute paths or hardcoded hosts.
- [ ] UI states all handled; browser-agent or Playwright run with screenshots saved to `docs/PHASE_REPORTS/phase-N/`.
- [ ] Phase report `docs/PHASE_REPORTS/phase-N.md` (built, verified with commands/outputs, issues, next).
- [ ] Regression: previous phases' tests still pass.
- [ ] Conventional Commits; tag `phase-N-complete`.

## A6. Engineering standards
- **Python:** full type hints, `mypy --strict` for `backend/app`, `ml/severity`, `edge/agent`; ruff+black; docstrings on public APIs; no bare `except`; structured JSON logs with request/device IDs.
- **API:** `/api/v1`; error envelope `{error:{code,message,details,request_id}}`; pagination; idempotency keys on all device uploads; UTC ISO-8601; UUID PKs; soft-delete only where audit needs it.
- **Security:** argon2id; short-lived JWT + rotating refresh; device enrollment with per-device keys (revocable); RBAC by dependency; upload validation (magic bytes, size caps, allow-list, re-encode); signed URLs; CORS allow-list; per-IP/user/device rate limits; audit log on state-changing admin actions; TLS everywhere in compose (self-signed for dev, documented).
- **DB:** 3NF, FKs, CHECK constraints, GiST on all geo columns, `created_at/updated_at`, append-only observation tables, `geography(Point,4326)` for distance, `geometry(LineString,4326)` for segments.
- **Async:** video/batch/report/notification work in Celery; `202` + job id; retries with backoff; dead-letter queue.
- **Edge reliability:** watchdog, thermal throttling awareness, bounded queues, drop-oldest frame policy, graceful degradation when GPS/camera lost, power-loss-safe SQLite (WAL), disk quota with eviction policy, clock-skew handling (store monotonic + wall time; GPS time preferred).
- **Frontend/mobile:** strict TS, no `any`, API client generated from OpenAPI, WCAG AA contrast, i18n keys only (en/hi/pa), Devanagari + Gurmukhi fonts bundled, translations flagged "needs native review".
- **Tests never weakened to pass.** Root-cause fixes only; regression test per bug.

## A7. Antigravity workflow
- Planning first: Implementation Plan artifact → approval → Task List artifact → Walkthrough artifact with real outputs.
- Terminal for runs, browser agent for UI verification; record results.
- Before any long training: run `nvidia-smi` (or detect CPU), estimate duration, set resumable checkpoints, log to `ml/runs/<id>/`.
- Parallel agents only on independent areas (`web/` vs `ml/`) on separate branches `feat/<area>-<topic>`; merge via PR with checks.
- Same error twice → stop, diagnose root cause, record finding, then proceed. No retry loops, no `try/except: pass`, no skipped tests.

