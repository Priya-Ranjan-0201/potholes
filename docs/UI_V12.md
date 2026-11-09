# SCAMROAD — PREMIUM THEMED UI PROMPT v12 ("NIGHT HIGHWAY, DONE PROPERLY")

This supersedes v8, v9, v10 and v11 for visual direction. It keeps their good rules (no jargon, no fake data, 4 tabs, functional motion) and adds back a strong road/India theme with real craft: layered animated backgrounds, polished components and rich motion, applied where it belongs. Frontend only (`web/`). Branch `ui/v12-premium`.

PROJECT: ScamRoad (scam_road) — road defect management portal. Redesign the whole frontend (web/) so it looks
premium, intentional and unmistakably road + India themed, while staying clear, fast and credible.
Backend/ML behaviour does not change.

ROLE: Art director + senior product designer + senior front-end engineer + motion designer + QA, working
AUTONOMOUSLY. Quality bar: it should look like a funded product, not a template and not a novelty demo.

THE CORE DESIGN IDEA: TWO ZONES
The earlier UI failed in two opposite ways: first it was kitsch (ornaments on data tables, jargon, blobs),
then it was bland. Fix both with a strict zone system.
 ATMOSPHERE ZONE (rich, themed, animated): landing page, login/register, app background layer behind
   content, empty states, loading screens, 404, section headers, the Scanner dropzone, the sidebar header.
 DATA ZONE (calm, dense, precise): tables, charts, forms, detail panels, dialogs. Flat surfaces, 1px borders,
   functional motion only. Nothing decorative ever overlaps or sits behind data text.
The theme lives in the Atmosphere zone and in colour, type, icons and illustration style. The Data zone stays
quiet so the product is readable and trusted.

=====================================================================================
0. RULES
=====================================================================================
V1  No internal jargon in the UI: no "Rule R4", "Rule B6", "Clause", "IRC:SP", "Phase", "Pass", "Frozen",
    "Zero Mock Data" anywhere (components, i18n, tooltips, alt text, toasts, page titles).
V2  Plain, confident copy. No hype words (empirical, autonomous, hyper-, revolutionary, command center,
    next-gen). Product name "ScamRoad". Descriptor: "Road defect management". Sentence case.
V3  Exactly 4 primary nav items: Overview, Scanner, Maintenance, Model Benchmarks (Maintenance holds Work
    orders, Defects, Citizen reports as sub-tabs; Scanner holds Upload, Video, Live camera as modes).
    No hidden pages, no design lab, no theme picker in production. One theme with light and dark modes.
V4  Real data only. Charts/trends computed from database rows; fewer than 7 distinct days of data -> show a
    table and "Not enough history yet (N records)". No interpolated or padded history. Demo data is flagged
    is_demo and shows a plain "Demo data" badge; seed a realistic set (80-150 defects, 20-40 work orders,
    15-30 reports, 6-10 corridors, 30-60 day spread, fixed random seed). Data timestamp on every chart.
V5  Truthful motion: progress reflects real progress; success animations only after server confirmation;
    AI results never trigger celebration.
V6  Cultural respect: original artwork only; no deities or religious symbols; no stereotypes; no real people;
    no brands; no government emblem, Ashoka Chakra, flag-like tricolour arrangement or "official" wording.
    All fonts/icons/art open-licensed or hand-made SVG; list in docs/ASSET_CREDITS.md.
V7  No map UI anywhere (location is text + "Open in your maps app" link).
V8  Footer on every page: "Student research project. Not an official government system. Not safety-certified."
V9  Accessibility and performance are features (section 8). Reduced motion honoured everywhere.
V10 Never weaken or delete a test to pass; regression test per bug. Ask only for licence doubts or destructive
    actions; otherwise decide, log in docs/UI_DECISIONS.md and continue.

=====================================================================================
1. AUTONOMOUS LOOP WITH A DESIGN-QUALITY GATE
=====================================================================================
State in docs/UI_STATE.md. Per phase: plan -> implement -> screenshots -> RUBRIC REVIEW -> fix -> checks ->
commit (Conventional Commits) -> tag ui12-phase-N-done. No approval between phases.
RUBRIC (score every page 1-10 on each; a page passes only if every criterion >= 8 and you can justify the
score with a screenshot crop): 1 visual hierarchy (one clear focal point), 2 spacing rhythm (4/8 grid, no
cramped or floating elements), 3 alignment and grid consistency, 4 typography scale and line length,
5 colour harmony and contrast, 6 component consistency, 7 theme expression (road + India feel without kitsch),
8 motion quality (purposeful, smooth, not distracting), 9 density and readability of data, 10 polish of
empty/loading/error states. Write scores and fixes to docs/DESIGN_REVIEW.md. Do at least two critique-and-fix
iterations per page. If a rubric score stays < 8 after 3 attempts, simplify the design instead of adding more.

=====================================================================================
2. ART DIRECTION: "NIGHT HIGHWAY, MORNING INDIA"
=====================================================================================
Mood: a modern control surface lit like a highway at night (asphalt, reflective signs, headlight bloom) in
dark mode; a bright, warm, morning-light version in light mode. India shows up through colour, type, pattern
and illustration, not through clutter.
Palette tokens (CSS variables; no hardcoded colours in components):
 DARK "Night highway":
  bg #070B14, bg-raised #0C1220, surface rgba(16,24,40,.82), surface-solid #111A2C, border #1E2A42,
  border-strong #2B3A5A, text #EAF0FA, muted #93A3BF, faint #5E6E8A,
  primary (road-sign amber) #FFB020, primary-hover #FFC24D, primary-contrast #1A1200,
  accent-teal (reflector) #19D3C5, accent-indigo #6366F1, accent-magenta #F43F8E (sparingly: highlights only),
  success #34D399, warn #FBBF24, danger #F87171, focus #FFD166.
 LIGHT "Morning India":
  bg #FFF9F0, bg-sky gradient #FFF9F0 -> #EAF3FF, surface #FFFFFF, border #E8DFD0, border-strong #D8CCB8,
  text #14161F, muted #53586B, primary (deep indigo) #3730A3, primary-hover #4338CA, primary-contrast #FFFFFF,
  accent-saffron #F59E0B, accent-teal #0D9488, accent-magenta #DB2777 (sparingly), success #15803D,
  warn #B45309, danger #B91C1C, focus #3730A3.
 Severity (shape + icon + text, never colour alone): Minor #0EA5A4, Moderate #D97706, Severe #EA580C,
  Critical #DC2626; badges drawn as small road-sign shapes (round / triangle / diamond / octagon).
 Verify WCAG AA contrast for every pair automatically; adjust tokens until all pass.
Type: headings Plus Jakarta Sans (600-700), body Inter (400-500), numbers/coordinates/IDs JetBrains Mono
 (tabular), Noto Sans scripts for Hindi, Punjabi, Tamil, Telugu, Bengali (bundled, subset, font-display: swap).
 Scale 12/13/14/16/20/28/40/56; hero uses 56-72 clamp(). Tight tracking on large headings.
Surfaces: Atmosphere zone may use glass (backdrop blur 12-16 px) with 1px borders and a 1px inner top
 highlight; Data zone uses solid surfaces, 1px borders, radius 10, shadow at most 0 1px 2px rgba(0,0,0,.08).
Icons: Lucide (16-20 px, 1.5 stroke) plus a small custom set (road, pothole, crack types, work order, scan).
Illustration style: flat geometric SVG, 2-3 tones from the palette, rounded joins, no outlines heavier than
 2 px; consistent across pages. India accents (use sparingly, Atmosphere zone only): faint jaali lattice
 (3-4% opacity) in hero/footers, a thin truck-art scallop edge on the landing hero bottom, a marigold-amber
 accent colour, Devanagari secondary tagline on landing ("सड़क सुरक्षा" as a small subtitle), regional
 languages in the language menu.

=====================================================================================
3. BACKGROUND SYSTEM (Atmosphere zone; layered, cheap, pausable)
=====================================================================================
B1 "Night road" (dark default backdrop for landing/login and, at low intensity, behind the app):
   layer 1 deep gradient (bg -> bg-raised); layer 2 perspective road plane drawn in canvas/CSS 3D with faint
   edge lines and a dashed centre line flowing toward the horizon (speed 0.15x, opacity 10-14%); layer 3
   distant headlight bokeh (6-10 soft circles, amber and teal, slow drift 60-90 s, opacity 6-10%);
   layer 4 faint horizon glow in primary colour (6%); layer 5 2% noise. Vignette to keep edges dark.
B2 "Morning road" (light): warm cream-to-sky gradient, softly lit road plane with pale lane dashes, a few
   long soft shadows from roadside trees (SVG shapes at 5% opacity), tiny drifting dust motes (<= 20).
B3 "Rain and reflections" (optional, landing hero only): thin diagonal rain streaks at 4-6% opacity and a
   wet-asphalt reflection of the headline glow; disabled on low-power devices and reduced motion.
B4 "Vehicles in the distance": rare, tiny, original silhouettes (truck, bus, auto-rickshaw) crossing the far
   road plane every 20-40 s in the landing hero only, with their headlights; paused when hidden.
B5 App shell backdrop: B1/B2 at 35-50% intensity behind a solid content area; the sidebar header area
   carries a faint jaali pattern; content panels are always solid so data text keeps contrast >= AA.
B6 Section transitions on the landing page: scroll-linked camera move down the road (CSS scroll-driven
   animations or IntersectionObserver), with the dashed centre line speeding up slightly while scrolling.
Performance rules: backgrounds are canvas or CSS only, run on a single requestAnimationFrame loop, cap at
30 fps when idle, pause when the tab is hidden or the section is off-screen, use OffscreenCanvas where
available, degrade to a static gradient when prefers-reduced-motion, save-data, or low-end device (hardware-
Concurrency <= 4 and deviceMemory <= 4). Background CPU cost target < 5% on a mid-range laptop. Provide a
"Reduce motion" setting that also freezes backgrounds.

=====================================================================================
4. ANIMATION CATALOGUE
=====================================================================================
Tokens in web/src/motion/motion.ts: durations fast 120, base 200, slow 320, chart 600, ambient 40-90 s;
easings standard (.2,0,0,1), enter (0,0,.2,1), exit (.4,0,1,1); springs {380,32} and {260,28}; stagger 30 ms
(max 10 items). Framer Motion (code-split) or CSS; max 25 KB gzip of added JS for motion.

ATMOSPHERE ANIMATIONS (decorative allowed, Atmosphere zone only)
 A1 Landing hero: headline reveals word by word (40 ms), a scan beam passes across a real sample frame and
    boxes draw around actual detections from a bundled sample result file (labelled "Sample image"), counters
    below pull real numbers from generated metrics files; headlight sweep across the heading on load (once).
 A2 Landing "How it works": a road path drawn with SVG stroke animation as you scroll, with 4 stops (Capture,
    Detect, Track, Repair) lighting up in order; each stop shows a real screenshot crop.
 A3 Login/Register: left side night-road scene with slow-moving lane dashes and a car's tail-light trail;
    form side stays calm; field focus animations are functional only.
 A4 Loading screen: logo mark with a lane-dash progress arc; real progress only when known, else a calm
    indeterminate dash loop (an allowed spinner).
 A5 Empty states: small static or one-time-animated illustration (pothole with a scan ring that plays once)
    plus a single sentence and action.
 A6 404: plain "Page not found" with a closed-road sign illustration (static) and a "Back to overview" button.
 A7 Sidebar header: logo mark with a subtle reflector glint that sweeps once on first load.
 A8 Scanner dropzone: lane dashes slowly flow along the dashed border while idle; drag-over state speeds them
    up and tints the border primary; when a file is dropped, dashes converge into a progress bar.
 A9 Section dividers on landing: dashed lane line that extends as it enters the viewport.
 A10 Theme switch: a horizontal "sunrise/sunset" wipe (clip-path, 400 ms) that swaps tokens; reduced motion
    uses a plain crossfade.

FUNCTIONAL ANIMATIONS (Data zone; reference docs/MOTION_V11.md if it exists, otherwise implement)
 Scanner: scan-line tied to real inference stages; staggered bounding-box draw-in (max 10); list <-> box
 hover linking; confidence/severity fills; before/after compare slider (keyboard accessible); zoom/pan viewer
 with minimap; real-byte upload progress; video scrubber with detection ticks, track trails and ID merge
 chips; live-camera recording dot, FPS/latency readouts; privacy blur preview crossfade; "Create work order"
 button -> spinner -> check on server success -> Maintenance badge increments.
 Overview: KPI numbers roll only on real change (no count-up on first load); charts draw once; tooltips follow
 pointer; table layout animations for sort/filter; row-to-side-panel shared-element slide; live activity
 inserts with "N new events" pill.
 Maintenance: kanban drag with spring and keyboard alternative; optimistic updates with rollback; status chip
 crossfade and timeline append; engineer sign-off with before/after slider and a calm check on success;
 bulk-action bar; citizen-report stepper fills to the real state.
 Model Benchmarks: bars grow once; confusion matrix cells fade by row, clickable to failure examples; PR curve
 draw + hover marker; FP32 <-> INT8 comparison morph; unmeasured devices show "Not measured".
 Global: page transitions 160 ms; toasts with undo; skeletons shaped like content; command palette (Ctrl/Cmd+K);
 shortcuts overlay (?); offline banner; inline validation expansion; copy-to-clipboard tooltip.

MOTION GUARDRAILS: max 3 concurrent non-background animations per view; infinite animations allowed only for
backgrounds (B1-B4), A8 idle dashes, spinners/skeletons, the live-camera dot and the active scan line;
nothing flashes faster than 3 Hz; every animation has a reduced-motion fallback; animate transform/opacity
(plus clip-path/stroke-dashoffset for the named cases).

=====================================================================================
5. COMPONENT POLISH (web/src/ui, each with unit tests and visual states)
=====================================================================================
AppShell (glass sidebar with 4 items, active indicator that slides between items, collapse to icons, top bar
with search, language menu, theme toggle, notifications, user menu; mobile bottom tab bar), PageHeader with
breadcrumb text (plain, no milestone badges) and primary action, StatCard (value, delta chip, sparkline from
real data, data-as-of), DataTable (sticky header, sort, filter, column visibility, density toggle, virtualised,
keyboard nav, row hover preview), SeverityBadge (road-sign shapes), StatusChip (dot + label), Tabs and
SegmentedControl with sliding indicator, SidePanel, Dialog, Toast with undo, FormField with inline validation,
FileDropzone (A8), CompareSlider, ImageViewer, Scrubber, EmptyState, Skeleton variants, ProgressBar,
LanguageMenu (shows native names: English, हिन्दी, ਪੰਜਾਬੀ, தமிழ், తెలుగు, বাংলা), ThemeToggle, CommandPalette.
Spacing: 4/8 grid; page max width 1440; content gutters 24/32; table row 40 px, control height 36 px, hit
targets 44 px on mobile. Consistent radius (10 data, 16 atmosphere cards, 999 chips). Focus ring 2 px focus
colour with 2 px offset. Hover/active/disabled/loading/error states for every interactive component.

=====================================================================================
6. PAGE SPECS
=====================================================================================
LANDING (Atmosphere): nav (logo, Sign in), hero with B1/B2 backdrop, headline "Find, track and fix road
 defects", subline in plain English, primary CTA "Open scanner", secondary "View benchmarks", Devanagari subtitle,
 sample detection card (A1), results strip from real files (mAP@50, precision, recall, latency on measured
 device), A2 how-it-works road, honest "Works today / Not yet" lists, tech and licence row, footer with
 disclaimer. Weight < 150 KB art; LCP < 2.5 s on throttled 4G.
LOGIN/REGISTER: A3 layout, inline validation, password strength, clear errors.
OVERVIEW (Data): 4 KPI cards, corridor health table (real), open work orders and SLA list, recent activity,
 trend chart only if >= 7 days of data, otherwise table; demo badge and data-as-of.
SCANNER: mode switch (Upload / Video / Live camera); large dropzone (A8); result layout with image viewer,
 detections list, quality warnings, actions; batch queue; privacy preview.
MAINTENANCE: sub-tabs Work orders (table + kanban toggle), Defects (table + side panel with observation
 timeline and merge history), Citizen reports (table + status stepper).
MODEL BENCHMARKS: headline numbers from generated files, per-class table and bars, confusion matrix, PR
 curve, FP32 vs INT8, split sizes, failure gallery, device latency (measured only), model hash, limitations.
SETTINGS/ABOUT: language, theme (light/dark/system), reduce motion, rate card editor, limitations, licences,
 dataset attribution, asset credits.

=====================================================================================
7. COPY AND LANGUAGE
=====================================================================================
Plain, short, sentence case. Examples: "Road defect management", "Upload image", "Create work order",
"Override severity", "Confidence", "Area (% of image, pixel-based)", "Estimated cost (illustrative)",
"Closing a work order requires engineer sign-off", "Not enough history yet (N records)", "Not measured".
All strings via i18n keys in 6 languages (non-English flagged "needs native review"); no layout break with
long Tamil/Telugu/Bengali strings; no tofu glyphs. Playful road wording only in empty/loading/success states,
never in errors, safety text or data labels.

=====================================================================================
8. QUALITY BARS (measured; docs/QUALITY_REPORT.md)
=====================================================================================
Accessibility: WCAG 2.2 AA, keyboard navigation, visible focus, ARIA landmarks/labels, live regions for
results, 44 px targets, 200% zoom, forced-colors safe, axe-core 0 serious/critical.
Performance: Lighthouse mobile Performance >= 85 on landing (>= 90 on app pages), Accessibility >= 95, Best
Practices >= 95; CLS < 0.1; INP < 200 ms; initial JS < 220 KB gzip; ONNX/WASM lazy in a Web Worker; art as
inline/sprite SVG; hero total < 150 KB; frame-rate sample during backgrounds and scans on a 4x CPU slowdown
must stay >= 45 fps or the background degrades automatically.
Tests: Vitest + RTL for components; Playwright E2E (light/dark, desktop/mobile) for scan -> result ->
work order -> engineer sign-off; anti-slop test (exactly 4 nav items, no banned strings, footer present, no
console errors); reduced-motion test (no movement, backgrounds frozen); chart-to-database-row test.
Anti-slop CI script scripts/check_ui_copy.py fails on: "Rule R", "Rule B", "(Rule", "Clause", "IRC:SP",
"Empirical", "Autonomous", "Hyper-", "Command Center", "Sparkles", "dhaba", "PatternBand", "CatsEye",
"milestone", "KM 0", "Zero Mock", "Frozen", "Design Lab", "ambient-glow-mesh"; also fails when decorative
classes/backgrounds are used inside the Data zone (lint rule: components under web/src/ui/data cannot import
from web/src/ui/atmosphere).
Visual QA: screenshots of every page x {light, dark} x {360, 768, 1440 px} x {English, Hindi, Tamil}
(all six languages for Scanner and Overview); check clipping, overflow, overlap, tofu glyphs, contrast; save
in docs/screenshots with an index; fix and re-capture; save short GIFs of the named animations (A1-A10, plus
scan flow) in docs/motion. Replace README screenshots.

=====================================================================================
9. PHASES
=====================================================================================
P1  Audit current UI (use attached screenshots if any): list what looks poor and why, per page, against the
    rubric; baseline Lighthouse, bundle size, CLS; remove leftover gimmicks, jargon and fake charts.
P2  Foundations: tokens (light/dark), fonts, icons, motion.ts, zone separation (ui/atmosphere vs ui/data),
    background engine (B1-B6) with degrade rules, component library with tests.
P3  App shell and navigation (4 tabs), command palette, settings, footer, theme switch (A10).
P4  Landing and auth pages (A1-A4, A9) with real sample result file and real metrics strip.
P5  Overview and Maintenance with realistic seeded demo data and honest charts.
P6  Scanner (all modes) with functional animations and A8.
P7  Model Benchmarks, Settings/About, empty states, 404, loading screen.
P8  i18n completion across 6 languages and glyph checks; copy deck applied; CI guards added.
P9  Visual QA, rubric scoring (all pages >= 8), accessibility and performance reports, GIFs, README.
GATE each phase: build, lint, types, unit and E2E green; reduced-motion passes; CLS < 0.1; rubric >= 8 for
the pages built so far; no banned strings; every data animation tied to a real event.

