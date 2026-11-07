# SCAMROAD — SEMESTER-SCOPE POLISH, EVIDENCE AND REDESIGN PROMPT (v7)

```
PROJECT: ScamRoad (scam_road) — Edge AI pothole and road-defect detection with a municipal workflow
portal. A SEMESTER PROJECT (B.Tech CSE). Existing repo is v1.1.0: React 18 + Vite + Tailwind web,
FastAPI + PostgreSQL/PostGIS backend, YOLO11n ONNX INT8, edge agent with SQLite outbox, 6-language UI,
144 Python tests, 8 web tests.

ROLE: Senior engineer + designer working AUTONOMOUSLY on the EXISTING repo. Do not restart the project.

GOAL (v7): make the project (1) provable with real numbers, (2) honest, (3) smaller and cleaner in scope,
(4) beautiful and attractive, (5) easy to demo in 5-10 minutes, (6) ready for viva, report and slides.
Fewer features that work perfectly and look excellent beat a long feature list.
"Without error" = zero KNOWN failures after full verification with saved outputs. Never claim perfection;
report remaining risks.

=====================================================================================
0. RULES
=====================================================================================
R1  Evidence only. Every number/claim in code, UI, README, report traces to a generated file or command
    output; otherwise remove it or label it UNVERIFIED / DEMO / ESTIMATED / UNTESTED.
R2  No fake AI. No hardcoded detections, random confidence, fixed severity/cost shown as model output.
    Seeded data carries is_demo=true and a visible DEMO DATA badge.
R3  No dead UI. Every visible control works and handles loading/empty/error/success/offline.
R4  Pixels and relative % only; no cm or "depth" without calibration. Confidence is never severity.
R5  AI never closes a work order; a human engineer role does, with before/after evidence.
R6  Privacy: faces and plates blurred before storage/upload; report recall with sample size and source.
R7  Student project. No government branding/emblem/"official"/standard "compliance" claims. Footer on every
    page: "Student research project. Not an official government system. Not safety-certified."
R8  Never weaken or delete a test to pass. Fix root causes. Regression test for every bug.
R9  Never print/commit secrets or large data/weights. Never rewrite git history without asking.
R10 Read before write; grep references before deleting anything.
R11 Stop and ask ONLY for: missing secrets, licence doubts, destructive actions, physical tasks only I can do
    (driving, labelling, device benchmarks). Queue them in docs/HUMAN_TODO.md and continue other work.
R12 SCOPE GUARD (semester project): MUST > SHOULD > COULD. Finish all MUST first; start a COULD only when every
    MUST and SHOULD gate has passed. Cut scope rather than ship something half-working.

=====================================================================================
1. AUTONOMOUS LOOP
=====================================================================================
State: docs/V7_STATE.md and ml/STATE.json (phase, status, evidence paths, open issues, next action).
Per phase: short plan -> implement -> run checks -> SELF-REVIEW GATE -> commit (Conventional Commits) ->
tag v7-phase-N-done -> next. Resume from state after any interruption. Gate fails: root cause, fix, re-run
(max 3 attempts per issue; same error twice = change approach; then mark blocked, record why, continue
independent work). No approval needed between phases. After all phases: PASS 2 and PASS 3.
BUDGET: max GPU hours 2 ; max wall-clock days 1 ; max spend $0. Estimate GPU hours before any
training job; shrink the job rather than exceed.

=====================================================================================
PHASE 1 (MUST) — REMOVE THE MAP COMPLETELY
=====================================================================================
- Delete the /map page, route, nav entries, icons, i18n keys in all 6 languages, Leaflet and react-leaflet
  dependencies, tile/OSM attribution text, map CSS, map tests, map screenshots, and every README/docs/diagram
  mention (Interactive GIS Map, Leaflet, heat layer...). No redirect, placeholder or "coming soon"; unknown
  URLs show the normal 404 page.
- check_claims.py must fail if "Leaflet", "OpenStreetMap", "/map", "heatmap" or "GIS map" reappear.
- Keep non-map spatial logic: GPS coordinates, haversine/ST_DWithin deduplication, ward and road-name text.
  Show location as text: coordinates, corridor/road name, ward, GPS accuracy, plus "Copy coordinates" and an
  "Open in your maps app" external link (no embedded map).
- Replace the map's role with: (a) Defect Registry (sortable, filterable, virtualised table + card view with
  severity chips); (b) Ward Hotspot Grid on the dashboard (coloured tiles with counts, not geographic);
  (c) "Top 10 worst corridors" ranked list with sparklines.
- One shared severity config everywhere: 0-25 Minor, 26-50 Moderate, 51-75 Severe, 76-100 Critical. Remove any
  other hardcoded threshold (e.g. "Critical >= 70").
GATE: build passes; grep finds no map references; tests updated and green; screenshots re-captured.

=====================================================================================
PHASE 2 (MUST) — REAL MODEL EVIDENCE
=====================================================================================
- Re-evaluate on a clean TEST split; generate ml/runs/<id>/metrics.json: precision, recall, F1, mAP@50,
  mAP@50-95 per class and overall, confusion matrix, PR curves, ECE, false positives on a negative-only set,
  per-split dataset counts, FP32 vs INT8 mAP drop, parity score. Run the leakage test (perceptual hash + group
  overlap). If splits were random or leak, rebuild group-aware splits and retrain with a resumable script
  (log seed, config, git SHA, dataset hash).
- Generate docs/AI_EVALUATION.md by script (no hand-typed numbers).
- In-app /evaluation page reading only those files: headline cards (mAP@50, precision, recall, FP rate),
  per-class bars, confusion matrix heatmap, PR curve, INT8-vs-FP32 comparison, dataset size, "evaluated on"
  labels, 12-image failure gallery (6 worst misses, 6 worst false alarms with reasons), "Limitations of this
  result" box. If files are missing show "No evaluation found".
- README gets a short results table linking those files.
GATE: report regenerates with one command; page matches the files.

=====================================================================================
PHASE 3 (MUST, small) — HARD NEGATIVES AND ABLATION
=====================================================================================
- Mine false positives (shadows, patches, stains, puddles, manholes, markings) on negative-only and VAL sets;
  add as background images; retrain once; report precision and false positives before/after. Keep only if
  precision improves and recall does not drop by more than seed spread (>=2 seeds if budget allows); else
  revert and log.
- Small generated ablation: YOLO11n vs 11s, 640 vs 800, INT8 vs FP32 (mAP + latency). Choose the edge model by
  accuracy per latency; explain in docs/DECISIONS.md.
- Quality gate (blur/exposure) with reason codes, thresholds tuned on VAL only.
GATE: docs/EXPERIMENTS.md lists every run, including failed ideas.

=====================================================================================
PHASE 4 (SHOULD; needs me) — LOCAL TEST SET PIPELINE
=====================================================================================
- docs/DATA_COLLECTION.md: safe guide (fixed dashboard mount, passenger operates, daylight + dusk, 3 routes,
  2 passes), frame-extraction script, privacy blur step, metadata (route, date, lighting).
- docs/LABELING_GUIDE.md: class definitions, minimum box size, patched vs open pothole, water-filled pothole,
  occlusion, two-annotator check on a 10% overlap (report agreement).
- CVAT notes + scripts: export to YOLO, validate labels, split BY ROUTE/DAY, whole local set = TEST ONLY.
- `make local-eval`: runs the frozen model on the local set and appends a "Local roads" section to
  AI_EVALUATION.md and the Evaluation page; empty folder shows "Local test set not collected yet".
Queue physical tasks in HUMAN_TODO (target 300-500 frames).
GATE: pipeline tested on a 20-image SAMPLE set, marked SAMPLE and excluded from reported results.

=====================================================================================
PHASE 5 (SHOULD) — CAPTURE AS A PWA (no separate native app)
=====================================================================================
- Camera + on-device ONNX inference in a Web Worker (WASM), live overlay, adaptive frame skipping, on-device
  privacy blur before saving, GPS (accuracy, speed, timestamp), "Drive mode" (big glanceable UI, no taps,
  audio/visual advisory alert).
- Offline-first IndexedDB outbox (PENDING/UPLOADING/DONE/FAILED), idempotency keys, retry with backoff, quota
  guard, visible sync status; replaying one upload 5 times creates exactly one record (test).
- One pothole = one record: in-session tracker + server GPS-proximity dedup (radius from GPS accuracy);
  ambiguous matches go to a review queue; merges reversible and logged.
- Bench page writes a generated file with real FPS/latency on my phone; otherwise UNTESTED.
GATE: Playwright mobile-viewport test with a mocked camera video; offline->online sync test; service worker
caches shell + model.

=====================================================================================
PHASE 6 (COULD, only if all MUST/SHOULD gates passed) — SENSOR FUSION LITE
=====================================================================================
Log accelerometer/gyroscope with GPS (permission prompt + fallback). Simple documented bump detector tuned on
one drive and evaluated on another. Cross-check with camera detections in a time window, "camera + bump agree"
badge; report agreement from real drives only. No drive data: build the pipeline, queue the drive, label the
feature EXPERIMENTAL.

=====================================================================================
PHASE 7 (SHOULD) — SEVERITY CALIBRATION AND WORKFLOW HARDENING
=====================================================================================
- Severity engine: weights file, per-factor breakdown, missing-factor renormalisation, needs_human_review flag,
  human override stored as a new row, unit tests per factor.
- Rater kit: export 100 images to a sheet for 3-5 raters (Minor/Moderate/Severe/Critical); script reports
  Cohen's kappa and MAE vs the engine. Real ratings only; else queue in HUMAN_TODO.
- Complaint states: keep SUBMITTED -> TRIAGED -> RESOLVED and document it as an intentional semester
  simplification (extend only if time allows); enforce transitions server-side with tests.
- Work orders: SLA countdown, evidence upload, engineer verification dialog, immutable history.
- Security checks with tests: RBAC matrix, upload validation, rate limits, argon2id, JWT refresh rotation,
  no secrets in repo; bandit/pip-audit/npm-audit triaged.
GATE: tests pass; coverage report generated.

=====================================================================================
PHASE 8 (MUST) — BEAUTIFUL, ATTRACTIVE UI/UX
=====================================================================================
Goal: a premium, memorable "road-intelligence command center" that wows in a viva and still loads fast.
Original identity, no government insignia. Animate only transform/opacity.

8.1 Identity: SVG logo (road in perspective forming an "S" with a glowing scan-ping dot) + wordmark; favicon
and PWA icons generated from it. Fonts: Inter (UI), Space Grotesk or Sora (headings), JetBrains Mono (numbers/
IDs), bundled Noto Sans scripts for Hindi, Punjabi, Tamil, Telugu, Bengali (font-display: swap, no tofu).
Tokens as CSS variables only (no hardcoded colours):
  Light "Daybreak": bg #F6F8FC, surface #FFFFFF, surface-2 #EEF2F9, border #DDE3EE, text #0B1220,
  muted #4B5675, primary #2F6BFF, accent #6A4DFF, success #00B894, warn #FF9F1C, danger #E5484D.
  Dark "Midnight Asphalt": bg #070B14, surface rgba(18,26,46,.72), surface-2 #121A2E,
  border rgba(120,150,220,.18), text #E8EEFB, muted #9AA8C7, primary #5B8CFF, accent #8B7BFF,
  success #2EE6A6, warn #FFB84D, danger #FF6B72.
  Severity: Minor #2EC4B6, Moderate #FFB703, Severe #FB6A2F, Critical #E5233A, always colour + icon + label.
  Verify WCAG AA contrast automatically and fix failures. Radius 12/16/24, layered soft shadows (light),
  glass + 1px inner border (dark), 8-pt grid.

8.2 Backgrounds: landing hero with an animated road-in-perspective scene (dashed centre line streaming to the
horizon, dusk-sky-to-asphalt gradient, parallax, a glowing pothole where a scan ping lands, scan-beam sweeping
a sample frame with boxes appearing; paused when the tab is hidden). App background: drifting mesh gradient
(2-3 blurred blobs, 40-60 s loops) + 3% noise; dark mode adds a faint particle field (<=60). Content always
sits on solid/glass surfaces so contrast is never reduced.

8.3 Motion (Framer Motion + CSS, one motion.ts): durations 120/200/320/520 ms; easing cubic-bezier(.2,.8,.2,1);
spring {stiffness 260, damping 26}. Page transitions, staggered cards, count-up KPIs (once), chart draw-in,
skeleton shimmer, button press feedback, sun/moon theme morph, language underline. Scanner: scan-beam driven by
real inference progress, popping boxes, confidence ring, severity gauge that changes colour at thresholds,
before/after slider. Kanban drag with spring physics; ring-burst only when an engineer verifies and closes an
order. Respect prefers-reduced-motion; add a visible "Reduce motion" setting.

8.4 Layout (no map anywhere): desktop collapsible left rail + top bar with Ctrl/Cmd+K command palette, theme
toggle, language menu, notifications, user menu. Mobile bottom tab bar (Scan, Defects, Orders, Reports, More)
with safe-area padding. Tablet two-pane list/detail. Pages (all real): Landing, Login/Register, Dashboard,
Scanner, Capture (PWA), Defect Registry + detail, Complaints, Maintenance Kanban, Repair Verification,
Evaluation, Models, Reports, Settings (theme, language, reduce motion, rate card), Help/About (limitations,
licences, dataset attribution).

8.5 Key pages:
- Landing: animated hero, live real counters (hidden if API down), 4-step flow (Capture -> Detect -> Track ->
  Repair), honest "Works today / Next" roadmap, results strip pulling mAP and FPS from generated files,
  disclaimer footer.
- Dashboard: count-up KPIs, 14-day trend, Ward Hotspot Grid, Top 10 worst corridors, SLA leaderboard, activity
  stream, "data as of" stamp, DEMO badge where seeded.
- Scanner: drag-drop/camera/video, annotated result with before/after slider, per-defect cards (class icon,
  confidence ring, severity gauge, relative area %, "uncalibrated" notice, illustrative cost with a "why?"
  popover from config/rate_card.json, recommended action), quality warnings with reasons, batch queue, privacy
  blur ON by default with preview.
- DEMO MODE for the viva: toggle that enlarges type, hides admin clutter, runs a guided 6-step tour (Scan ->
  Track -> Registry -> Work order -> Engineer sign-off -> Evaluation) with keyboard shortcuts and clearly
  labelled demo data. Write docs/DEMO_SCRIPT.md (7 minutes, plus a backup recorded-video plan for no-internet).

8.6 UX/accessibility bars: feedback within 100 ms; real, cancellable progress; undo for destructive actions;
helpful empty states with small SVG/Lottie (<30 KB); inline errors with recovery steps. WCAG 2.2 AA target:
keyboard navigation, focus rings, ARIA landmarks, live regions for results, 44 px touch targets, 200% zoom;
real axe-core results (0 serious/critical). Lighthouse mobile: Performance >= 85, Accessibility >= 95, Best
Practices >= 95; initial JS < 250 KB gzip (ONNX/WASM lazy in a worker); CLS < 0.1. Report real scores in
docs/QUALITY_REPORT.md. i18n by keys only with a missing-key CI test and a glossary of terms intentionally kept
in English (e.g., "AI"); mark non-English files "needs native review"; replace "100% parity" with "all keys
present".

8.7 Visual QA: screenshots of every page x {light, dark} x {360, 768, 1440 px} x {English, Hindi, Tamil}
(all six languages for Scanner and Dashboard). Check clipping, overflow, tofu glyphs, overlaps, horizontal
scroll, contrast, reduced-motion. Save to docs/screenshots/ with an index; fix defects and re-capture; add
visual-regression snapshots to CI for key pages.
GATE: Lighthouse + axe + screenshot matrix + Playwright pass; no map screenshots remain.

=====================================================================================
PHASE 9 (MUST) — README, REPORT, SLIDES
=====================================================================================
- Rewrite README from evidence: short intro, screenshots (hero, scanner, dashboard, evaluation), works today,
  measured results table linking files, honest NOT-implemented list, limitations, licences (Ultralytics AGPL-3.0
  implications, RDD2022 CC BY-SA 4.0 attribution, LICENSE file present), quick start, verification commands.
  Badges generated from real outputs; replace "Claims Verified"/"Frozen" with "Claim checker: passing" and
  "validated on public datasets" (add "+ local set" only when it exists). Endpoint/table counts generated by
  script.
- Verify or remove every standards mention; no clause numbers unless checked in the actual document.
- Generate docs/PROJECT_REPORT.md (problem, related work with real citations only, dataset, method, system
  design, results, limitations, future work) and docs/SLIDES_OUTLINE.md (12 slides, each naming its figure file).
- Add a 1-page threat model (fake reports, spam uploads, GPS spoofing, model abuse) and a data retention/consent
  note.
GATE: README passes check_claims.py; every report/slide figure points to a generated file.

=====================================================================================
PHASE 10 — CI, DOCKER, FINAL VERIFY
=====================================================================================
GitHub Actions: lint, type-check, unit, integration (PostGIS service), Playwright, build, docker build, claim
checker, security scans. docker compose with healthchecks; make dev/test/demo/eval/report. Backup/restore drill.
Coverage and test counts generated, not typed.

=====================================================================================
2. PASSES
=====================================================================================
PASS 2 (hostile re-audit): read the README, test output, screenshots, Lighthouse/axe like a sceptical examiner.
List the 15 weakest points by impact in docs/IMPROVEMENT_BACKLOG.md; fix in impact order; re-run affected
gates. Keep a change only if it improves its metric without regressing others (tolerance: seed spread or 1 pt);
revert and log failures.
PASS 3 (freeze): clean-clone reproduction on a reduced budget; final evaluation once; re-check every doc claim;
tag v1.2.0.
STOP when two consecutive rounds give no measurable gain, after 3 passes, or when budget is exhausted.

=====================================================================================
3. FINAL OUTPUT
=====================================================================================
Post: changes per phase; claims before/after; real metrics with file paths; test, coverage, Lighthouse, axe
results; screenshot index; remaining risks and blocked items; exactly what I must do next (collect and label
local data, drive for the sensor test, run the phone benchmark, rater study).
START NOW with Phase 1 (remove the map), then continue automatically.
```
