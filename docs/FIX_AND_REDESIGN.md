# SCAMROAD — FULL FIX, HARDENING AND UI/UX REDESIGN SPECIFICATION (v6)

```
PROJECT: ScamRoad (scam_road) — Edge AI pothole and road-defect detection, tracking and municipal
workflow portal. Existing repo: React 18 + Vite + Tailwind web, FastAPI backend, YOLO11n ONNX INT8,
6-language UI, Selenium suite, Colab/Kaggle notebooks, cloud_orchestrator.py.

ROLE: Senior full-stack + ML + product design team working AUTONOMOUSLY on the EXISTING repo.
MISSION: (1) audit the real code, (2) fix every defect, false claim and gap, (3) make the system
honest, correct, tested and reproducible, (4) redesign the UI/UX to a premium, modern, fast,
accessible level, (5) prove everything with generated evidence.

"Without error" means: zero KNOWN failures after full verification, every check passing with real
output saved. You must never claim perfection. Report remaining risks honestly.

=====================================================================================
0. HARD RULES
=====================================================================================
R1  Evidence only. Every claim in code, UI and docs must trace to a file, test or command output.
    If unverifiable, remove it or label it UNVERIFIED / DEMO / ESTIMATED / UNTESTED.
R2  No fake AI. No hardcoded detections, random confidence, fixed per-preset severity or cost
    presented as model output. Preset images must go through the real model; if the model is not
    loaded, show "Model not loaded". Seeded dashboard data must carry is_demo=true and a visible
    "DEMO DATA" badge.
R3  No dead UI. Every button/link/route calls real logic and handles loading, empty, error,
    success, offline and permission-denied states.
R4  No physical dimensions or "depth" without calibration; pixels / relative % only, with
    unit + calibrated flag + method. Detection confidence is never shown as severity.
R5  AI never closes a work order; a human with the right role does, with before/after evidence.
R6  Privacy: faces and plates blurred before storage/upload; measure blur recall on a sample.
R7  Government identity: ScamRoad is a STUDENT PROJECT. It is not affiliated with, endorsed by,
    or an official product of MoRTH, NHAI, PWD, or any government body. Do not use the national
    emblem, Ashoka Chakra, "Government of India", "National ... Portal", "Designed for NHAI",
    or "सत्यमेव जयते" as branding. Government bodies may appear only as "intended future users"
    in neutral text. Keep a visible footer: "Student research project. Not an official government
    system. Not safety-certified."
R8  Standards honesty: do not claim compliance with any IRC/MoRTH standard. Use "severity rubric
    inspired by ..." only after verifying what each cited document actually covers, and cite
    document, edition and clause. Remove "Compliant" badges.
R9  Costs are ILLUSTRATIVE. Move the cost formula to a configurable rate card (config file +
    admin UI), label "Illustrative estimate, not an official Schedule of Rates", and show the
    formula and assumptions in the UI.
R10 Benchmarks: show only numbers produced by scripts on real devices (bench/*.json with device,
    date, model hash, runtime). Anything else is "UNTESTED". Remove unmeasured FPS/latency claims.
R11 Licences: record the Ultralytics AGPL-3.0 decision, dataset CC BY-SA 4.0 share-alike duties
    and attributions in docs/DECISIONS.md and README. Resolve the MIT claim honestly (e.g., state
    AGPL implications or choose a compatible licence plan).
R12 Never weaken or delete a test to pass. Fix root causes. Add a regression test for every bug.
R13 Never print or commit secrets. Scan history; if secrets exist, report file+line, tell me to
    rotate them. Never rewrite history without asking me.
R14 Read-before-write: inspect files, grep references before changing or deleting anything.
R15 Stop and ask ONLY for: missing secrets, licence doubts, destructive actions, hardware I must
    operate, my own data/labelling. Queue these in docs/HUMAN_TODO.md and keep working.

=====================================================================================
1. AUTONOMOUS LOOP AND STATE
=====================================================================================
Keep ml/STATE.json and docs/FIX_STATE.md (phase, status, evidence paths, open issues, next action).
For each phase: write a short plan -> implement -> run checks -> SELF-REVIEW GATE -> commit
(Conventional Commits) -> tag fix-phase-N-done -> next. Resume from state after any interruption.
Gate fails -> root-cause, fix, re-run (max 3 attempts per issue; same error twice = change
approach; then mark blocked, record why, continue independent work).
After all phases: run PASS 2 (hostile re-audit) and PASS 3 (clean-clone reproduction), see 9.

=====================================================================================
PHASE 1 — REAL AUDIT (read-only first)
=====================================================================================
Produce docs/STATUS_AUDIT.md with evidence: repo tree, git log, LOC per folder, actual stack from
lockfiles, real architecture, real API routes, DB tables, pages, models/weights present, datasets
actually downloaded, tests run and results, lint/type/build results. Module status scale:
NOT_STARTED / SCAFFOLD / PARTIAL / WORKING / VERIFIED. Search for mocks, hardcoded results,
dead buttons, TODO/FIXME, fake metrics, secrets, committed data/weights, leakage risks.
Verify every README claim; build a table: claim | true / false / unverifiable | evidence | action.
Known suspects to check first: preset severity/cost values, hardware benchmark table, "Zero Mock
Data", "Zero Mixed Language", IRC compliance badges, MoRTH cost basis, PyTorch/Python versions
in the README, Colab/Kaggle notebook filename mismatch, repo name vs folder name, /map route
redirect (map removed), dashboard seed data, Kalman-filter dedup claim vs actual code, privacy
blur actually implemented and measured.
GATE: audit written; every README claim classified.

=====================================================================================
PHASE 2 — HONESTY AND CLAIM FIXES
=====================================================================================
Fix everything the audit found false or unverifiable (R2, R7–R11). Rewrite README from evidence:
what exists, what works, measured results (linked files), limitations, licences, honest status of
each module. Replace badges with truthful ones generated from real outputs (test counts, coverage,
mAP from metrics.json). Add DEMO DATA badges. Fix notebook links, repo naming, docs paths.
Rename/rewrite branding per R7. Add docs/LIMITATIONS.md entries for everything unfinished.
GATE: a script `scripts/check_claims.py` greps README/docs/UI strings for banned phrases
("Government of India", "Compliant", "Zero Mock", "mission-critical", unmeasured FPS numbers)
and for numbers not traceable to generated files; it must pass in CI.

=====================================================================================
PHASE 3 — ML CORRECTNESS AND EVIDENCE
=====================================================================================
- Verify dataset pipeline: download scripts with SHA-256, audit (duplicates within/across
  datasets via perceptual hash, corrupt files, bad boxes), VOC->YOLO conversion, class mapping log,
  group-aware splits (by country/source/sequence), leakage test.
- If a trained model exists, re-evaluate on a clean TEST split and generate: precision, recall, F1,
  mAP@50, mAP@50-95 per class and overall, PR curves, confusion matrix, calibration (ECE),
  per-country/India slice, small-object slice, negative-only false-positive rate.
  Output ml/runs/<id>/metrics.json -> docs/AI_EVALUATION.md (generated, never hand-typed).
- Check the ONNX/INT8 export: parity test PyTorch vs ONNX vs INT8 on 200 images; report mAP drop.
  The browser (WASM) model and the server model must be the same hash or clearly documented.
- Hard-negative mining round (shadows, patches, stains, puddles, markings, manholes) with before/
  after precision and false positives per km. Keep changes only if they beat baseline beyond seed
  spread; failed ideas stay logged in docs/EXPERIMENTS.md.
- Tracking/dedup: verify what is really implemented (ByteTrack/BoT-SORT vs a Kalman filter). Build
  a test with a video of one repeated defect -> exactly one canonical defect with N observations;
  merges reversible and logged. Report ID switches and duplicate rate on whatever labelled video
  exists; otherwise queue labelling in HUMAN_TODO.
- Severity engine: configurable weights file, factor breakdown, missing-factor renormalisation,
  needs_human_review flag, human override preserved as a new row. Unit tests for every factor.
- Training harness: resumable, seeds fixed, config + git SHA + dataset hash saved per run; the
  Colab/Kaggle notebooks run end to end (dry-run on a tiny subset) and push only small result files.
GATE: metrics files exist and docs regenerate from them with one command; all ML tests pass.

=====================================================================================
PHASE 4 — BACKEND, DATABASE, SECURITY
=====================================================================================
- Real PostgreSQL + PostGIS (not SQLite in prod), Alembic migrations up/down on a fresh DB, GiST
  indexes, canonical defects + immutable observations, complaint state machine with enforced
  transitions and history, work-order lifecycle with SLA timers, roles/RBAC enforced server-side,
  audit log, idempotency keys on uploads (replay x5 -> one record).
- Security: argon2id, short-lived JWT + refresh rotation, upload validation (magic bytes, size, type,
  re-encode), rate limits, CORS allow-list, input validation (Pydantic v2), secrets in env only,
  bandit + pip-audit + npm audit with triaged findings, security headers.
- Replace any fake endpoint with real logic or remove it. OpenAPI complete with examples.
- Tests: pytest with a real PostGIS container, RBAC matrix, state-machine tests, spatial tests on
  known geometry, upload-security tests, migration up/down.
GATE: `make test` green; EXPLAIN shows GiST use; coverage report generated.

=====================================================================================
PHASE 5 — RESTORE THE MAP AND CORE GIS FEATURES
=====================================================================================
Bring back /map as a first-class page: Leaflet + OpenStreetMap tiles with attribution, severity
markers, clustering, heat layer, filters (class, severity, status, ward, date), segment popups,
defect detail drawer with observation timeline, geofence/ward polygons, search by place, "nearest
team" query, route view for inspectors (heuristic labelled as such). GPS accuracy radius shown;
dedup radius derived from GPS accuracy. Reverse-geocoding via a cached, rate-limit-safe provider;
graceful fallback when offline. Road Health Index per segment labelled "ScamRoad Health Index
(project methodology)" with stored components and "Not enough data" for low coverage.
GATE: Playwright test: report/detect -> marker appears -> open detail -> create work order.

=====================================================================================
PHASE 6 — FRONTEND CODE QUALITY
=====================================================================================
TypeScript strict, no `any`, ESLint + Prettier, API client generated from OpenAPI, TanStack Query
for data, error boundaries per route, code-splitting and lazy routes, ONNX model + WASM loaded
lazily in a Web Worker (never block the main thread), model caching, cancellable requests, skeleton
loaders. i18n via keys only (i18next), no hardcoded strings, missing-key test that fails CI.
Languages: English, Hindi, Punjabi, Tamil, Telugu, Bengali. Mark non-English files "needs native
review". Remove the "zero mixed language" claim; where a term is intentionally kept in English
(e.g., "AI"), document it in a glossary. Bundle fonts (Noto Sans Devanagari, Gurmukhi, Tamil,
Telugu, Bengali) with font-display: swap and subsetting; verify no tofu boxes in screenshots.
Unit tests (Vitest + RTL) for logic and components; Playwright E2E replaces/extends Selenium.
GATE: lint, types, unit, E2E, production build all green; bundle size report saved.

=====================================================================================
PHASE 7 — UI/UX REDESIGN (the visual overhaul)
=====================================================================================
Design goal: a confident, modern "civic-tech command center" — trustworthy, calm, data-dense but
readable, with delightful motion that never gets in the way. Original identity, no government
insignia. Premium feel on a phone and on a control-room monitor.

7.1 Brand and tone
- Name: ScamRoad. Hindi tagline in UI only as a localisable string. Keep the English tagline in the
  hero and splash only. Footer carries the student-project disclaimer (R7).
- Voice: clear, plain, no jargon; every number has a unit and an "estimated/measured" label.

7.2 Design tokens (CSS variables + Tailwind theme; never hardcode colours in components)
Light theme "Daybreak":
  --bg #F6F8FC, --bg-elevated #FFFFFF, --surface #FFFFFF, --surface-2 #EEF2F9,
  --border #DDE3EE, --text #0B1220, --text-muted #4B5675,
  --primary #2F6BFF (action), --primary-2 #6A4DFF (accent), --accent #00B894 (success/verified),
  --warn #FF9F1C, --danger #E5484D, --critical #B4232A, --info #0EA5E9
Dark theme "Midnight Asphalt":
  --bg #070B14, --bg-elevated #0D1424, --surface rgba(18,26,46,.72), --surface-2 #121A2E,
  --border rgba(120,150,220,.18), --text #E8EEFB, --text-muted #9AA8C7,
  --primary #5B8CFF, --primary-2 #8B7BFF, --accent #2EE6A6, --warn #FFB84D,
  --danger #FF6B72, --critical #FF4D57, --info #38BDF8
Severity scale (colour AND icon AND label, never colour alone): Minor #2EC4B6 / Moderate #FFB703 /
Severe #FB6A2F / Critical #E5233A. Verify WCAG AA contrast (>=4.5:1 text, >=3:1 UI) with an
automated check; fix failures.
Shape and depth: radius 12/16/24, soft layered shadows (light), subtle glass + 1px inner border
(dark), 8-pt spacing grid. Typography: Inter (UI) + Space Grotesk or Sora (headings) + JetBrains Mono
(numbers/IDs) with Noto scripts for Indian languages; fluid type scale (clamp()), tabular numbers
for metrics, line-height tuned per script (taller for Devanagari/Tamil/Telugu/Bengali).

7.3 Backgrounds and atmosphere (all GPU-cheap, no heavy video)
- Hero: animated road-perspective grid (CSS/SVG or canvas) with a slow parallax of dashed centre
  lines moving toward the horizon, a gradient sky-to-asphalt mesh, and a soft vignette. A tiny
  pothole "crater" glow pulses where a scan ping lands; scan-line sweeps across a sample frame.
- App background: layered mesh gradient (2–3 blurred radial blobs drifting slowly, 40–60 s loops),
  fine noise overlay at 3–4% opacity, optional topographic contour lines in the map area.
- Dark mode: faint star-dust/particle field (<=60 particles, canvas, paused when tab hidden or
  reduced motion), neon edge glows on active cards.
- Light mode: clean, luminous, paper-like depth; no dot matrix, no heavy gradients behind text.
- Backgrounds never reduce text contrast; test contrast on the worst-case region.

7.4 Motion system (Framer Motion + CSS; one source of truth in motion.ts)
- Tokens: durations 120/200/320/520 ms; easings cubic-bezier(.2,.8,.2,1) (standard),
  (.3,0,0,1) (emphasised), spring {stiffness 260, damping 26}.
- Page transitions: fade + 8 px rise, shared-element for list->detail.
- Micro-interactions: button press scale .98, hover lift 2 px + glow, focus ring animation,
  ripple on primary actions, toggle morph for the theme switch (sun/moon), language switcher
  with animated underline.
- Data motion: count-up numbers on dashboard cards (once, 700 ms), chart line draw-in, bar grow,
  staggered card entrance (40 ms steps), skeleton shimmer, live "pulse" dot for streaming status.
- Scanner motion: bounding boxes animate in with scale + glow, confidence ring fills, detection
  scan-beam sweeps the image while inference runs, progress indicates real worker progress,
  result panel slides in, severity gauge animates to value with colour change at thresholds.
- Map motion: marker drop with bounce, cluster expand spring, heat layer fade, smooth fly-to.
- Kanban: drag with spring physics, column highlight, card flip to show evidence photos.
- Empty states: small looping illustrations (SVG/Lottie < 30 KB), helpful call-to-action.
- Celebratory moment: subtle confetti or ring burst only when a work order is verified and closed.
- RESPECT `prefers-reduced-motion`: disable parallax, particles, count-ups, large transitions;
  keep only fades. Provide a visible "Reduce motion" toggle saved in settings. Pause all
  animations when the tab is hidden. Keep 60 fps; no layout thrash (animate transform/opacity).

7.5 Layout and navigation
- Desktop: collapsible left rail (icons + labels), top bar with global search (Ctrl/Cmd+K command
  palette), theme toggle, language menu, notifications bell, role/user menu. Breadcrumbs on deep pages.
- Mobile: bottom tab bar (Scanner, Map, Orders, Reports, More), sticky compact header,
  thumb-reachable primary actions, swipe gestures on cards, safe-area padding.
- Tablet: adaptive two-pane layouts (list + detail).
- Role-based dashboards: Citizen, Inspector, Maintenance Manager, Admin — each shows only what the
  role can do; hidden controls are also blocked on the server.

7.6 Page specs (all must be real, functional, responsive)
1. Landing: hero with animated road scene and live (real) counters from the API (or hidden if
   unavailable), "How it works" 4-step animated flow (Capture -> Detect -> Track -> Repair),
   capability cards, honest "What works today / What's next" roadmap, disclaimer footer.
2. Login/Register: split layout, animated illustration, inline validation, password strength,
   role selection limited to Citizen at signup (staff roles by admin only).
3. Dashboard: KPI cards (count-up), 14-day trend (Recharts, observed vs forecast visually
   distinct), ward health heat-grid, SLA leaderboard, recent activity stream, DEMO badge where
   seeded, "data as of" timestamp.
4. AI Scanner: drag-drop / camera / video; before-after slider with annotated overlay; per-defect
   cards (class icon, confidence ring, severity gauge, relative area %, uncalibrated notice,
   illustrative cost with "why?" popover showing formula, recommended action); quality warnings
   (blur/exposure) with reason codes; batch upload queue; privacy-blur toggle shown as ON by
   default with preview; "Create work order" requires confirmation and role.
5. Map: full-bleed map, floating filter panel, legend, layer toggles (markers/clusters/heat/
   wards), timeline slider, detail drawer.
6. Defect Registry: virtualised table + card view, filters, saved views, detail page with
   observation timeline, image carousel, merge history (undo), audit trail.
7. Complaints: submission wizard (photo, GPS auto + manual pin, anonymous option), tracking ID,
   status stepper animation, upvote, duplicate suggestions before submit.
8. Maintenance Kanban + list: SLA countdown chips, overdue pulsing badge, evidence upload,
   engineer verification dialog with before/after comparison, immutable history.
9. Repair Verification: side-by-side before/after, AI suggestion labelled advisory, mandatory human
   decision with reason.
10. Analytics and Reports: filters, charts, export PDF/Excel/CSV from DB only, labelled
    "Estimated" vs "Verified".
11. Models and Benchmarks: version table with hashes, metrics (from metrics.json), device
    benchmarks (only measured; others UNTESTED), model activate/rollback with confirm.
12. Notifications, Users/Roles, Settings (theme, language, reduce motion, units, rate card), Audit
    log, Help/About (limitations, licences, dataset attribution, standards notes).

7.7 UX quality bars
- Every action gives feedback within 100 ms; long tasks show real progress and are cancellable.
- Toasts for outcomes, inline errors with recovery steps, undo for destructive actions.
- Forms: autosave drafts, keyboard flows, clear labels, input masks, helpful microcopy.
- Accessibility: WCAG 2.2 AA, full keyboard navigation, visible focus, ARIA landmarks/labels,
  screen-reader announcements for live results, colour never sole signal, 44 px touch targets,
  RTL-safe layout utilities, zoom to 200% without loss.
- Performance budgets: Lighthouse (mobile) Performance >= 85, Accessibility >= 95,
  Best Practices >= 95; LCP < 2.5 s on throttled 4G for the landing page; JS initial bundle
  < 250 KB gzip (model/WASM lazy); CLS < 0.1; INP < 200 ms. Report real scores.
- Offline/PWA: installable, service worker caches shell, offline banner, queued actions with
  retry status, no data loss.
- Trust cues: "measured vs estimated" chips, data-as-of stamps, limitations link on every
  analytical page.

7.8 Visual QA (automated, evidence saved)
Use the browser agent / Playwright to capture screenshots for every page x {light, dark} x
{360, 768, 1440 px} x {English, Hindi, Tamil} at minimum, then all six languages for the
Scanner and Dashboard. Check: no text overflow/clipping, no tofu glyphs, no overlapping, no
horizontal scroll, readable contrast, animations stop with reduced motion. Save to
docs/PHASE_REPORTS/ui/ with an index; fix every defect found and re-capture.
Add visual regression snapshots to CI for key pages.
GATE: Lighthouse reports, axe-core report (0 serious/critical), screenshot matrix, and E2E all pass.

=====================================================================================
PHASE 8 — TESTS, CI, DOCS, DEPLOY
=====================================================================================
- CI (GitHub Actions): lint, type-check, unit, integration (PostGIS service), Playwright, build,
  docker build, claim checker, security scans. Branch protection recommended.
- docker-compose: web, api, worker, postgres/postgis, redis, minio, with healthchecks; `make dev`,
  `make test`, `make demo`; `.env.example` for all variables.
- Docs generated/updated: README (honest), ARCHITECTURE (Mermaid reflecting the real code),
  API, DATASETS (licences + attributions), DECISIONS, LIMITATIONS, AI_EVALUATION (generated),
  UI_GUIDE (tokens, components, motion rules), STATUS_AUDIT, CHANGELOG, demo script (10 min) with
  labelled demo data and an offline fallback video.
- Backup/restore drill for the DB.
GATE: fresh clone -> `docker compose up` -> app works from README alone.

=====================================================================================
9. SELF-REFINEMENT PASSES
=====================================================================================
PASS 2 (hostile re-audit): re-read STATUS_AUDIT, claims table, test output, screenshots, Lighthouse
and axe reports. List the 15 weakest points by user impact, write docs/IMPROVEMENT_BACKLOG.md,
fix in impact order, re-run affected gates. Keep a change only if it improves its metric without
regressing others (tolerance: no protected metric worse than before by more than seed spread or
1 pt). Revert and log failed ideas.
PASS 3 (verify and freeze): clean-clone reproduction on a reduced budget; final TEST/LOCAL
evaluation once; re-check every doc claim against generated files; tag v1.1.0.
STOP when: two consecutive rounds give no measurable gain, max 3 passes, or budget exhausted.
Budget guard: estimate GPU hours before any training job, never exceed my limit (set below).
```
