# SCAMROAD — SEMESTER-SCOPE POLISH, EVIDENCE AND REDESIGN PROMPT (v7)

```
PROJECT: ScamRoad (scam_road) — Edge AI pothole and road-defect detection with a municipal workflow
portal. A SEMESTER PROJECT (B.Tech CSE). Existing repo is v1.1.0: React 18 + Vite + Tailwind web,
FastAPI + PostgreSQL/PostGIS backend, YOLO11n ONNX INT8, edge agent with SQLite outbox, 6-language UI,
144 Python tests, 8 web tests.

ROLE: Senior engineer + designer working AUTONOMOUSLY on the EXISTING repo. Do not restart the project.

GOAL (v7): make the project (1) provable with real numbers, (2) honest, (3) cleaner and smaller in
scope, (4) beautiful and attractive, (5) easy to demo in 5–10 minutes, (6) ready for viva, report and
presentation. Realistic semester scope beats a huge feature list. Prefer fewer features that work
perfectly and look excellent.

"Without error" means zero KNOWN failures after full verification with saved outputs. Never claim
perfection; report remaining risks.

=====================================================================================
0. RULES
=====================================================================================
R1  Evidence only. Every number/claim in code, UI, README, report must trace to a generated file or
    command output. Otherwise remove it or label it UNVERIFIED / DEMO / ESTIMATED / UNTESTED.
R2  No fake AI. No hardcoded detections, random confidence, fixed per-image severity/cost shown as model
    output. Seeded data carries is_demo=true with a visible DEMO DATA badge.
R3  No dead UI. Every visible control works and handles loading / empty / error / success / offline.
R4  Pixels and relative % only; no centimetres or "depth" without calibration. Confidence is never severity.
R5  AI never closes a work order; a human engineer role does, with before/after evidence.
R6  Privacy: faces and plates blurred before storage/upload; report recall with sample size and source.
R7  Student project. No government branding, emblem, "official", or standard "compliance" claims.
    Footer on every page: "Student research project. Not an official government system. Not safety-certified."
R8  Never weaken/delete a test to pass. Fix root causes. Regression test for every bug.
R9  Never print/commit secrets or large data/weights. Never rewrite git history without asking.
R10 Read before write; grep references before deleting anything.
R11 Stop and ask ONLY for: missing secrets, licence doubts, destructive actions, things I must do
    physically (driving, labelling, device benchmarks). Queue those in docs/HUMAN_TODO.md and keep
    working on everything else.
R12 SCOPE GUARD: this is a semester project. Priority MUST > SHOULD > COULD. Do all MUST first. Do not
    start a COULD item unless every MUST and SHOULD item has passed its gate. Cut scope rather than
    ship something half-working.

=====================================================================================
1. AUTONOMOUS LOOP
=====================================================================================
State files: docs/V7_STATE.md and ml/STATE.json (phase, status, evidence paths, open issues, next action).
For each phase: short plan -> implement -> run checks -> SELF-REVIEW GATE -> commit (Conventional
Commits) -> tag v7-phase-N-done -> next. Resume from state after interruption. Gate fails: root cause,
fix, re-run (max 3 attempts per issue; same error twice = change approach; then mark blocked, record
why, continue independent work). After all phases: PASS 2 (hostile re-audit) and PASS 3 (clean-clone
freeze). Do not ask for approval between phases.

BUDGET: max GPU hours 2 ; max wall-clock days 1 ; max spend $0. Estimate GPU hours before any
training job; shrink the job rather than exceed.

=====================================================================================
PHASE 1 — REMOVE THE MAP COMPLETELY (clean, no leftovers)
=====================================================================================
I do not want the map feature. Remove it cleanly:
- Delete the /map page, route, nav entries, icons, i18n keys (all 6 languages), Leaflet and
  react-leaflet dependencies, map tiles/OSM attribution text, map CSS, map tests, screenshots of the map,
  and README/docs/diagram mentions ("Interactive GIS Map", "Leaflet", "heat layer", etc.).
- Do NOT leave a redirect, placeholder, or "coming soon". Unknown URLs show the normal 404 page.
- Update check_claims.py to fail if "Leaflet", "OpenStreetMap", "/map", "heatmap" or "GIS map" reappear.
- Keep backend spatial logic that is NOT a map: GPS coordinates, haversine / ST_DWithin deduplication,
  ward and road-name text. Show location as text: coordinates, road/corridor name, ward, GPS accuracy,
  and a "Copy coordinates" / "Open in your maps app" link (plain external link, no embedded map).
- Replace the map's role with:
  (a) Defect Registry: sortable, filterable, virtualised table + card view with severity chips;
  (b) Ward Hotspot Grid on the dashboard: a heat-grid of wards (coloured tiles with counts), not geographic;
  (c) "Top 10 worst corridors" ranked list with sparkline trends.
- Fix severity thresholds in ONE shared config used everywhere: 0–25 Minor, 26–50 Moderate, 51–75 Severe,
  76–100 Critical. Remove any hardcoded threshold elsewhere (e.g. "Critical >= 70").
GATE: build passes; grep finds no map references; all tests pass after updating; screenshots re-captured.

=====================================================================================
PHASE 2 — EVIDENCE: REAL MODEL NUMBERS (MUST)
=====================================================================================
- Re-evaluate the current model on a clean TEST split and generate ml/runs/<id>/metrics.json with:
  precision, recall, F1, mAP@50, mAP@50-95 per class and overall, confusion matrix, PR curves, confidence
  reliability (ECE), false positives on a negative-only set, dataset counts per split (from the audit),
  FP32 vs INT8 mAP drop, and parity score. Run the leakage test (perceptual hash + group overlap) and show
  it passes. If the split was random or leaks, rebuild group-aware splits and retrain with a resumable
  script (log seed, config, git SHA, dataset hash).
- Generate docs/AI_EVALUATION.md from the files by script (no hand-typed numbers).
- Build the in-app Evaluation page (/evaluation): headline cards (mAP@50, precision, recall, FP rate),
  per-class bar chart, confusion matrix heatmap, PR curve, INT8-vs-FP32 comparison, dataset size, "evaluated
  on" labels, a 12-image failure gallery (6 worst misses, 6 worst false alarms with reasons), and a
  "Limitations of this result" box. Everything reads from the generated JSON; if missing show
  "No evaluation found".
- README gets a short results table linking to those files.
GATE: report regenerates with one command; page renders from real files; numbers match.

=====================================================================================
PHASE 3 — HARD-NEGATIVE ROUND AND ABLATION (MUST, small)
=====================================================================================
- Mine false positives on the negative-only and validation sets (shadows, patches, stains, puddles,
  manholes, markings). Add them as background images, retrain once, and report precision and false
  positives before/after. Keep the change only if precision improves without recall dropping by more than
  the seed spread (use >=2 seeds if budget allows); otherwise revert and log it.
- Small ablation table (generated): YOLO11n vs YOLO11s, 640 vs 800 image size, INT8 vs FP32, latency and
  mAP for each. Choose the edge model by accuracy per latency and explain in docs/DECISIONS.md.
- Quality gate: blur/exposure checks with reason codes; thresholds tuned on VAL only.
GATE: docs/EXPERIMENTS.md lists every run; failed ideas included.

=====================================================================================
PHASE 4 — LOCAL TEST SET PIPELINE (SHOULD; needs me for the data)
=====================================================================================
Prepare everything so I only drive, record and label:
- docs/DATA_COLLECTION.md: safe collection guide (fixed dashboard mount, passenger operates, daylight +
  dusk, 3 routes, 2 passes each), frame extraction script (1 frame per N metres/seconds), privacy blur
  step, naming/metadata (route, date, lighting).
- docs/LABELING_GUIDE.md: class definitions, minimum box size, patched vs open pothole, water-filled
  pothole, occlusion, two-annotator rule for a 10% overlap sample (report agreement).
- CVAT setup notes and scripts: export to YOLO, validate labels, split BY ROUTE/DAY (never random frames),
  reserve the whole local set as TEST ONLY (no training, no tuning).
- Script `make local-eval`: runs the frozen model on the local set and appends a "Local roads" section to
  AI_EVALUATION.md and the Evaluation page. If the folder is empty, shows "Local test set not collected yet".
Queue the physical tasks in docs/HUMAN_TODO.md with a suggested 300–500 frame target.
GATE: pipeline tested on a 20-image sample set (clearly marked SAMPLE, excluded from reported results).

=====================================================================================
PHASE 5 — CAPTURE APP AS A PWA (SHOULD)
=====================================================================================
Build a mobile-first installable PWA "Capture" mode inside the existing web app (no separate native app):
- Camera access, on-device ONNX inference in a Web Worker (WASM), live overlay of detections, adaptive
  frame skipping to hold a target FPS, on-device privacy blur before saving, GPS capture with accuracy,
  speed and timestamp, "Drive mode" (big glanceable UI, no taps needed, audio/visual alert, advisory only).
- Offline-first: IndexedDB outbox with statuses PENDING/UPLOADING/DONE/FAILED, idempotency keys, retry with
  backoff, storage quota guard, visible sync status; replaying the same upload 5 times creates exactly one
  record (test).
- One pothole = one record: in-session tracker + server-side GPS-proximity dedup with radius derived from GPS
  accuracy; ambiguous matches go to a review queue; merges are reversible and logged.
- Measure and report (generated file) real FPS and latency on my phone model when I run the bench page;
  otherwise mark UNTESTED.
GATE: Playwright test in a mobile viewport with a mocked camera video; offline->online sync test passes;
service worker caches the shell and the model.

=====================================================================================
PHASE 6 — SENSOR FUSION LITE (COULD; only if all MUST and SHOULD gates passed)
=====================================================================================
- Log phone accelerometer/gyroscope with GPS during a drive (Generic Sensor / DeviceMotion APIs, with a
  permission prompt and a clear fallback when unavailable).
- Bump detection: simple, documented method (e.g., windowed vertical-acceleration threshold relative to a
  baseline); report the threshold chosen on one drive and evaluate on another.
- Cross-check camera detections with bump events within a time window; show a "camera + bump agree" badge
  and report agreement rate from real drives only. If no drive data exists, build the pipeline, queue the
  drive in HUMAN_TODO, and label the feature EXPERIMENTAL.

=====================================================================================
PHASE 7 — SEVERITY CALIBRATION AND WORKFLOW HARDENING (SHOULD)
=====================================================================================
- Severity engine: configurable weights file, per-factor breakdown, missing-factor renormalisation,
  needs_human_review flag, human override stored as a new row. Unit tests for each factor.
- Small rater study kit: export 100 images to a sheet for 3–5 classmates/engineers to rate Minor/Moderate/
  Severe/Critical; script computes agreement (Cohen's kappa, MAE) and compares with the engine. Report only
  real ratings; if none yet, queue in HUMAN_TODO.
- Complaint states: keep the simple lifecycle (SUBMITTED, TRIAGED, RESOLVED) AND document it as an
  intentional semester simplification, or extend to the fuller states if time allows. Enforce transitions
  server-side with tests.
- Work orders: SLA countdown, evidence upload, engineer verification dialog, immutable history.
- Security basics verified with tests: RBAC matrix, upload validation, rate limits, argon2id, JWT
  refresh rotation, no secrets in repo, bandit/pip-audit/npm-audit results triaged.
GATE: tests pass; coverage report generated.

=====================================================================================
PHASE 8 — BEAUTIFUL, ATTRACTIVE UI/UX (MUST)
=====================================================================================
Goal: a premium, modern, memorable "road-intelligence command center" that wows in a viva and still
loads fast. Original identity; no government insignia. Keep it fast: animate only transform/opacity.

8.1 Visual identity
- Logo mark: a stylised road in perspective forming an "S" with a glowing scan-ping dot (SVG), plus
  wordmark "ScamRoad". Favicon and PWA icons generated from it. The tagline appears on the hero and splash.
- Typography: Inter (UI), Space Grotesk or Sora (headings), JetBrains Mono (numbers/IDs), Noto Sans scripts for
  Hindi, Punjabi, Tamil, Telugu, Bengali (bundled, font-display: swap, no tofu). Tabular numerals for metrics.
- Colour tokens as CSS variables (no hardcoded colours in components):
  Light "Daybreak": bg #F6F8FC, surface #FFFFFF, surface-2 #EEF2F9, border #DDE3EE, text #0B1220,
  muted #4B5675, primary #2F6BFF, accent #6A4DFF, success #00B894, warn #FF9F1C, danger #E5484D.
  Dark "Midnight Asphalt": bg #070B14, surface rgba(18,26,46,.72), surface-2 #121A2E,
  border rgba(120,150,220,.18), text #E8EEFB, muted #9AA8C7, primary #5B8CFF, accent #8B7BFF,
  success #2EE6A6, warn #FFB84D, danger #FF6B72.
  Severity: Minor #2EC4B6, Moderate #FFB703, Severe #FB6A2F, Critical #E5233A — always colour + icon + label.
  Verify WCAG AA contrast automatically; fix failures.
- Shape/depth: radius 12/16/24, layered soft shadows (light), glass + 1px inner border (dark), 8-pt grid.

8.2 Backgrounds and atmosphere
- Landing hero: animated road-in-perspective scene (SVG/canvas): dashed centre line streaming toward the
  horizon, gradient dusk sky to asphalt, subtle parallax, a pothole crater glowing where a scan ping lands, a
  scan-beam sweeping a sample frame with bounding boxes appearing. Pause when the tab is hidden.
- App background: slowly drifting mesh gradient (2–3 blurred blobs, 40–60 s loops) + 3% noise overlay;
  dark mode adds a faint particle field (<=60 particles). Content cards always sit on solid/glass surfaces so
  text contrast is never reduced.

8.3 Motion (Framer Motion + CSS; one motion.ts with tokens)
- Durations 120/200/320/520 ms; easing cubic-bezier(.2,.8,.2,1); spring {stiffness 260, damping 26}.
- Page transitions (fade + 8 px rise), staggered card entrance, count-up KPIs (once), chart draw-in,
  skeleton shimmer, button press feedback, animated theme toggle (sun/moon morph), language switch underline.
- Scanner: scan-beam while inference runs (driven by real progress), bounding boxes pop with glow,
  confidence ring fills, severity gauge animates and changes colour at thresholds, before/after slider.
- Kanban: drag with spring physics; celebratory ring-burst only when an engineer verifies and closes an order.
- Respect prefers-reduced-motion and add a visible "Reduce motion" setting; pause animations when hidden.

8.4 Layout and navigation (map is gone; no map nav)
- Desktop: collapsible left rail, top bar with Ctrl/Cmd+K command palette, theme toggle, language menu,
  notifications, user menu. Mobile: bottom tab bar (Scan, Defects, Orders, Reports, More), safe-area padding,
  thumb-reachable primary actions. Tablet: two-pane list/detail.
- Pages (all real): Landing, Login/Register, Dashboard, AI Scanner, Capture (PWA), Defect Registry + detail,
  Complaints, Maintenance Kanban, Repair Verification, Evaluation, Models, Reports/Analytics, Settings
  (theme, language, reduce motion, rate card), Help/About (limitations, licences, dataset attribution).

8.5 Hero pages in detail
- Landing: animated hero, live real counters (hidden if API unavailable), 4-step animated flow
  (Capture -> Detect -> Track -> Repair), "What works today / What's next" honest roadmap, results strip pulling
  mAP and FPS from generated files, tech-stack badges, disclaimer footer.
- Dashboard: KPI cards (count-up), 14-day trend chart (observed vs clearly separate forecast only if real),
  Ward Hotspot Grid, Top 10 worst corridors, SLA leaderboard, activity stream, "data as of" stamp, DEMO badge
  where seeded.
- Scanner: drag-drop/camera/video, annotated result with before/after slider, per-defect cards (class icon,
  confidence ring, severity gauge, relative area %, "uncalibrated" notice, illustrative cost with a "why?"
  popover showing the formula from config/rate_card.json, recommended action), quality warnings with reasons,
  batch queue, privacy-blur ON by default with preview.
- Evaluation: see Phase 2; make it presentation-ready with large readable charts.
- PRESENTATION MODE (viva): a "Demo mode" toggle that enlarges type, hides admin clutter, and offers a
  guided 6-step tour (Scan -> Track -> Registry -> Work order -> Engineer sign-off -> Evaluation) with
  tooltips and keyboard shortcuts; uses clearly labelled demo data. Include docs/DEMO_SCRIPT.md (7 minutes,
  with a backup recorded video plan for no-internet situations).

8.6 UX and accessibility bars
- Feedback within 100 ms; long tasks show real progress and are cancellable; undo for destructive actions;
  helpful empty states with small looping SVG/Lottie (<30 KB each); inline errors with recovery steps.
- WCAG 2.2 AA target: keyboard navigation, visible focus, ARIA landmarks/labels, screen-reader live regions
  for detection results, 44 px touch targets, zoom to 200%. Report real axe-core results (0 serious/critical).
- Performance: Lighthouse mobile Performance >= 85, Accessibility >= 95, Best Practices >= 95; initial JS
  < 250 KB gzip (ONNX/WASM lazy in a Web Worker); CLS < 0.1. Report real scores in docs/QUALITY_REPORT.md.
- i18n: keys only, six languages, missing-key CI test, glossary of terms intentionally kept in English
  (e.g., "AI"); mark non-English files "needs native review". Replace the "100% parity" badge with
  "all keys present" and a note that translations need native review.

8.7 Visual QA (automated, saved)
Capture screenshots of every page x {light, dark} x {360, 768, 1440 px} x {English, Hindi, Tamil} (all six
languages for Scanner and Dashboard). Check: no clipping or overflow, no tofu glyphs, no overlaps, no
horizontal scroll, readable contrast, reduced-motion behaviour. Save to docs/screenshots/ with an index
README; fix every defect and re-capture. Add visual regression snapshots to CI for key pages.
GATE: Lighthouse + axe + screenshot matrix + Playwright all pass; no map screenshots remain.

=====================================================================================
PHASE 9 — README, REPORT, SLIDES, DEMO (MUST)
=====================================================================================
- Rewrite README from evidence: short intro, screenshots (hero, scanner, dashboard, evaluation), what works
  today, measured results (table linking files), what is NOT implemented (honest list), limitations, licences
  (Ultralytics AGPL-3.0 implications, RDD2022 CC BY-SA 4.0 attribution, LICENSE file present), quick start,
  verification commands. Badges generated from real outputs (test counts, coverage); remove "Claims Verified"
  and "Frozen" wording; use "Claim checker: passing" and "validated on public datasets" (add "+ local set"
  only when it exists). Generate endpoint/table counts by script.
- Verify or remove every standards mention. Use "severity rubric inspired by public road-maintenance
  guidance" without clause numbers unless the clause was checked in the actual document.
- Generate docs/PROJECT_REPORT.md (problem, related work (cite real papers only), dataset, method,
  system design, results with real numbers, limitations, future work) and docs/SLIDES_OUTLINE.md (12 slides
  with the exact figure/file for each). Provide a docx/pptx export only if I ask.
- Include a 1-page threat model (fake reports, spam uploads, GPS spoofing, model abuse) and a data
  retention/consent note.
GATE: README claims pass check_claims.py; every figure in report/slides points to a generated file.

=====================================================================================
PHASE 10 — CI, DOCKER, FINAL VERIFY
=====================================================================================
GitHub Actions: lint, type-check, unit, integration (PostGIS service), Playwright, build, docker build,
claim checker, security scans. docker compose with healthchecks; make dev/test/demo/eval/report.
Backup/restore drill. Coverage and test counts are generated, not typed.

=====================================================================================
2. PASSES
=====================================================================================
PASS 2 (hostile re-audit): re-read the audit, claims table, test output, screenshots, Lighthouse/axe, and the
README as a sceptical examiner. List the 15 weakest points by impact in docs/IMPROVEMENT_BACKLOG.md; fix in
impact order; re-run affected gates. Keep a change only if it improves its metric without regressing others
(tolerance: no protected metric worse by more than seed spread or 1 pt); revert and log failures.
PASS 3 (freeze): clean-clone reproduction on a reduced budget; final evaluation once; re-check every doc
claim against generated files; tag v1.2.0.
STOP when: two consecutive rounds give no measurable gain, max 3 passes, or budget exhausted.

=====================================================================================
3. FINAL OUTPUT
=====================================================================================
Post: what changed per phase; claims before/after; all real metrics with file paths; test, coverage,
Lighthouse and axe results; screenshot index; remaining risks and blocked items; and exactly what I must do
next (HUMAN_TODO: collect local data, label, drive for sensor test, run phone benchmark, rater study).
START NOW with Phase 1 (remove the map), then continue automatically.
```

