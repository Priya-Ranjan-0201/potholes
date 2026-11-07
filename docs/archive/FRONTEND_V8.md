# SCAMROAD — FRONTEND-ONLY PROMPT v8: "TRUCK ART MEETS NIGHT HIGHWAY"

```
PROJECT: ScamRoad (scam_road) — frontend redesign ONLY (folder web/). React 18 + Vite + TypeScript +
Tailwind. Existing pages, API contracts, i18n (English, Hindi, Punjabi, Tamil, Telugu, Bengali) and tests
stay functional. This is a semester project: polish, not scope creep.

ROLE: Lead product designer + senior front-end engineer + motion designer + accessibility engineer, working
AUTONOMOUSLY on the existing repo.

MISSION: Redesign the entire UI/UX into a distinctive, memorable, Indian-road-themed interface that looks
like nothing else in civic tech: hand-painted TRUCK ART warmth + NIGHT-HIGHWAY precision (reflective signs,
kilometre stones, cat's-eye reflectors, dhaba signboards). It must be beautiful, fast, accessible, honest and
usable on a phone in sunlight. "Unique" = a coherent, original design language; never copy another site.

=====================================================================================
0. RULES
=====================================================================================
F1  Frontend only. Do not change backend/ML behaviour. If an API field is missing, show a clean empty state
    and log it in docs/FRONTEND_GAPS.md; never fake data.
F2  Honesty in UI: no fake numbers. Every metric reads from the API or generated files. Seeded data shows a
    "DEMO DATA" badge. No centimetre/"depth" claims; use "relative area %" and an "uncalibrated" notice.
    Confidence is never shown as severity.
F3  No government identity: do not use the national emblem, Ashoka Chakra, tricolour-flag compositions,
    MoRTH/NHAI/PWD logos, "official" wording. Saffron/green/white may appear only as ordinary palette
    colours, never arranged as a flag. Footer on every page: "Student research project. Not an official
    government system. Not safety-certified."
F4  Cultural respect: use folk-art INSPIRATION (truck art, rangoli, jaali, Warli-style figures, milestone
    and signboard lettering) with ORIGINAL artwork only. No religious deities or symbols, no stereotypes,
    no real people, no brands, no copyrighted characters, no traced or ripped images. All fonts, icons and
    illustrations must be open-licensed (OFL / MIT / CC0) or hand-made SVG; record each in
    docs/ASSET_CREDITS.md. No map UI anywhere (the map feature was removed).
F5  No dead UI: every control works and handles loading / empty / error / success / offline states.
F6  Never weaken or delete a test to pass. Fix root causes. Regression test for every bug.
F7  Performance and accessibility are features: see section 7. Heavy art must be SVG, lazy-loaded and cheap.
F8  Respect prefers-reduced-motion, high-contrast and forced-colors modes. Never rely on colour alone.
F9  Stop and ask ONLY for: licence doubts, missing secrets, destructive actions. Otherwise decide, record
    in docs/UI_DECISIONS.md and continue.

=====================================================================================
1. AUTONOMOUS LOOP
=====================================================================================
State: docs/UI_STATE.md (phase, status, evidence, next action). Per phase: short plan -> implement -> run
checks -> SELF-REVIEW GATE -> commit (Conventional Commits) -> tag ui-phase-N-done -> next. Gate fails: root
cause, fix, re-run (max 3 attempts per issue; then mark blocked and continue elsewhere). No approval needed
between phases. After all phases run PASS 2 (hostile design review) and PASS 3 (freeze).

=====================================================================================
2. DESIGN CONCEPT: "TRUCK ART MEETS NIGHT HIGHWAY"
=====================================================================================
Two sister themes that share one soul:

DHABA DAWN (light): warm, hand-painted, sunlit. Cream "paper" canvas, marigold and vermilion accents,
peacock-teal and indigo for data, subtle printed-poster grain, ornamental truck-art borders around key
cards, chalk-and-signboard lettering for headings.

HIGHWAY NIGHT (dark): deep asphalt with reflective glows. Cat's-eye reflector dots, retro-reflective sign
panels, glowing lane dashes, headlight bloom, kilometre-stone markers. Control-room serious, still warm.

Signature ideas (implement all, keep each tasteful and light):
1. SEVERITY AS ROAD SIGNS: severity badges are drawn as road-sign shapes with icon + label + colour
   (Minor = blue round info sign, Moderate = yellow triangle warning, Severe = orange diamond, Critical =
   red octagon/stop-style). Shape + icon + text carry meaning, so colour is never the only signal.
2. KILOMETRE-STONE NAVIGATION: page headers and breadcrumbs styled as milestone stones (rounded-top stone
   with place text such as "Scanner · KM 02"). Mobile tab bar = a row of small milestone pills.
3. TRUCK-ART ORNAMENT SYSTEM: reusable SVG ornament kit (scalloped borders, paisley/peacock-feather motifs,
   marigold garlands, lotus-free abstract florals, chain-link rails, jaali screen patterns) used as card
   corners, dividers, section headers and loading frames. Original geometric drawings only.
4. DHABA SIGNBOARD HEADINGS: display headings in a bold poster face on a slightly rotated painted plate
   with a soft shadow; short, friendly microcopy (see 6.4).
5. CAT'S-EYE DETAILS: tiny reflector dots along card edges, dividers and the scroll rail that glow when
   focused or hovered (CSS only).
6. ROAD AS PROGRESS: loaders, progress bars and the scroll indicator are a road with moving dashed lane
   markings and a small vehicle silhouette (truck, auto-rickshaw, bus: original SVG, swappable) driving
   along. Real progress drives the vehicle position.
7. MASCOT (optional, original): a friendly crater character "Gaddha" drawn in simple folk style, used only in
   empty states, 404 and onboarding; never in data views. Must pass F4.
8. HORN OK PLEASE MOMENT: a playful, optional "horn" easter egg (visual ripple, sound OFF by default and only
   after explicit opt-in) on the logo; no auto-play audio ever.

=====================================================================================
3. DESIGN TOKENS (CSS variables + Tailwind theme; no hardcoded colours in components)
=====================================================================================
Truck-art accents (both themes): marigold #FFB300, vermilion #E8452C, peacock #00A3A3, indigo #2B2F8F,
magenta #D61F6B, leaf #2FA66A, milestone-yellow #F7C61B.
DHABA DAWN: bg #FFF8EC, surface #FFFFFF, surface-2 #FFF0D6, border #EBD9B8, text #1B1308, muted #5C4A2E,
  primary #2B2F8F, primary-contrast #FFFFFF, accent #E8452C, success #1F8F5F, warn #C77700, danger #C62828,
  focus-ring #00A3A3.
HIGHWAY NIGHT: bg #0A0C12, surface rgba(20,24,36,.78), surface-2 #141926, border rgba(255,200,80,.16),
  text #F3EEE2, muted #A9A18F, primary #FFB300, primary-contrast #1A1200, accent #00D1D1, success #35D49A,
  warn #FFB84D, danger #FF6B6B, focus-ring #FFD54A.
Severity sign colours: Minor #1E78D0 (blue), Moderate #F2B705 (yellow), Severe #F26A1B (orange),
  Critical #D7263D (red); each paired with its sign shape and icon.
Check every text/background pair for WCAG AA automatically (>=4.5:1 text, >=3:1 UI); fix failures by
adjusting tokens, not by dropping the check.
Typography (all open-licensed, bundled, font-display: swap, subsetted):
  Display: "Yatra One" or "Rozha One" (poster/signboard feel; check Devanagari support, otherwise pair with
  "Tiro Devanagari"/"Khand"); Body/UI: "Inter" or "Mukta"; Numbers/IDs: "JetBrains Mono" (tabular);
  Indian scripts: Noto Sans Devanagari, Gurmukhi, Tamil, Telugu, Bengali (headings may use Baloo 2 family
  where it covers the script). Verify no missing glyphs in screenshots; fall back gracefully.
Shape: radii 10/16/28; signboard plates 6px radius with painted-edge border; 8-pt spacing; fluid type with
clamp(); taller line-height for Indic scripts.
Depth: light = paper shadows + subtle grain (<=3% opacity); dark = glass + warm inner glow + reflector dots.

=====================================================================================
4. BACKGROUNDS AND ATMOSPHERE (cheap, GPU-friendly, pausable)
=====================================================================================
- Landing hero: a looping SVG/CSS scene. Day: sunrise over a highway with dashed centre line streaming toward
  the horizon, silhouettes of a decorated truck, an auto-rickshaw and roadside dhaba, rolling dust shimmer.
  Night: same scene with headlight bloom, glowing cat's eyes, stars. Parallax limited to 3 layers. A scan
  ping lands on a pothole crater; bounding boxes appear around it (decorative, clearly labelled "illustration").
- App canvas: slow-drifting warm gradient blobs (2-3, 40-60 s loops), faint jaali pattern at 3-4% opacity,
  paper grain in light mode, particle "dust/fireflies" (<=40) in dark mode. Content sits on solid or glass
  surfaces so text contrast never drops.
- Section dividers: animated lane-marking dashes or ornament borders; footer is a tiny road with a drifting
  vehicle silhouette.
- All background animation pauses when the tab is hidden and is disabled under reduced motion.

=====================================================================================
5. MOTION SYSTEM (Framer Motion + CSS; one motion.ts source of truth)
=====================================================================================
Tokens: durations 120/200/320/520 ms; easings cubic-bezier(.2,.8,.2,1) and (.3,0,0,1); spring {stiffness 260,
damping 26}. Animate transform/opacity only.
- Page transitions: fade + 8 px rise; list-to-detail shared-element.
- Entrance: staggered cards (40 ms steps), count-up KPIs (once, 700 ms), chart draw-in.
- Micro: button press .98, hover lift 2 px with warm glow, ornament corners "paint in" on first view,
  sign badges pop with a tiny rotation settle, theme toggle morphs sun <-> moon with a highway-sunrise wipe.
- Scanner: real-progress road loader; scan-beam sweeps the image while inference runs; boxes pop in with
  glow; confidence ring fills; severity sign drops in; before/after slider with a reflective handle.
- Kanban: drag with spring physics; column highlights as lane changes; when an ENGINEER verifies and closes
  an order, a restrained marigold petal/confetti burst (once, <1 s). The AI never triggers celebration.
- Reduced motion: replace movement with fades, stop parallax/particles/loops, keep a visible "Reduce motion"
  setting; also pause everything when hidden.

=====================================================================================
6. LAYOUT, NAVIGATION, PAGES AND MICROCOPY
=====================================================================================
6.1 Shell: desktop = collapsible left rail ("highway exits": icon + label), top bar with Ctrl/Cmd+K command
palette, theme toggle, language menu, notifications, user menu, and a milestone-style breadcrumb. Mobile =
bottom milestone tab bar (Scan, Defects, Orders, Reports, More), safe-area padding, thumb-reachable actions.
Tablet = two-pane list/detail. Footer with the student-project disclaimer.
6.2 Pages (all real and functional; no map): Landing, Login/Register, Dashboard, AI Scanner, Capture (PWA,
if present), Defect Registry + detail, Complaints, Maintenance Kanban, Repair Verification, Evaluation,
Models, Reports, Settings (theme, language, reduce motion, rate card), Help/About (limitations, licences,
dataset attribution), 404.
6.3 Page highlights:
- LANDING: animated hero, live real counters (hidden if API down), 4-stop route "Capture -> Detect -> Track ->
  Repair" drawn as a winding road with milestone stops, "What works today / What's next" honest roadmap,
  results strip reading mAP/FPS from generated files, tech badges, disclaimer.
- DASHBOARD: KPI "sign plates" with count-up, 14-day trend chart, Ward Hotspot Grid (coloured tiles, not
  geographic), Top-10 worst corridors list with sparklines, SLA leaderboard with progress "roads",
  activity stream as a "highway ticker", "data as of" stamp, DEMO badge where seeded.
- SCANNER: drag-drop/camera/video; annotated result with before/after slider; per-defect card = severity road
  sign + class icon + confidence ring + relative area % + "uncalibrated" notice + illustrative cost with a
  "why?" popover (formula from config/rate_card.json) + recommended action; quality warnings with reasons;
  batch queue; privacy blur ON by default with preview.
- DEFECT REGISTRY: sortable/virtualised table + card view, filters, saved views, detail page with observation
  timeline styled as a road with milestones, image carousel, merge history (undo), audit trail. Location is
  text: coordinates, corridor name, ward, GPS accuracy, "Copy coordinates", "Open in your maps app" (external).
- MAINTENANCE KANBAN: lanes as road lanes; SLA countdown chips; overdue badge with a gentle pulse; engineer
  sign-off dialog with before/after comparison.
- EVALUATION: presentation-ready charts (mAP, per-class, confusion matrix, PR curve, INT8 vs FP32, failure
  gallery) read from generated files; "No evaluation found" empty state.
- DEMO MODE (viva): toggle that enlarges type, hides admin clutter, runs a guided 6-step tour (Scan -> Track
  -> Registry -> Work order -> Engineer sign-off -> Evaluation) with keyboard shortcuts; labelled demo data.
- 404: "Road closed - diversion ahead" signboard with the mascot and a "Back to dashboard" button.
6.4 Microcopy: warm, plain, short, localisable (all strings in i18n keys). Friendly road-flavoured lines in
EMPTY/LOADING/SUCCESS states only (e.g., "Scanning the road...", "No potholes found. Smooth ride!"),
never in errors or safety messages. Hindi/Punjabi/Tamil/Telugu/Bengali versions flagged "needs native
review". Keep a glossary for terms intentionally left in English (e.g., "AI").

=====================================================================================
7. QUALITY BARS (measured, saved to docs/QUALITY_REPORT.md)
=====================================================================================
- Accessibility: WCAG 2.2 AA target; keyboard navigation; visible focus (reflector-style ring); ARIA
  landmarks/labels; live regions for detection results; 44 px touch targets; 200% zoom; forced-colors safe;
  axe-core: 0 serious/critical.
- Performance: Lighthouse mobile Performance >= 85, Accessibility >= 95, Best Practices >= 95; LCP < 2.5 s on
  throttled 4G for the landing page; CLS < 0.1; INP < 200 ms; initial JS < 250 KB gzip; ONNX/WASM lazy in a
  Web Worker; art as inline/sprite SVG, each illustration < 40 KB, total hero < 150 KB; fonts subset.
- Robustness: error boundaries per route, skeleton loaders, offline banner, retry UI, cancellable requests,
  TanStack Query caching.
- i18n: keys only; missing-key CI test; six languages; no layout break with long Tamil/Telugu/Bengali strings.
- Code: strict TypeScript, no `any`, ESLint + Prettier, component library in web/src/ui (tokens, Sign, Plate,
  MilestoneHeader, OrnamentFrame, RoadLoader, SeverityBadge, KpiPlate, EmptyState, etc.), each with a unit
  test; optional Storybook for the viva.
- Tests: Vitest + RTL for components; Playwright E2E for core flows (scan -> result -> work order; complaint;
  engineer sign-off) in light/dark and mobile/desktop; visual-regression snapshots for key pages.

=====================================================================================
8. PHASES
=====================================================================================
P1  Audit and cleanup: inventory web/, remove dead code, confirm no map remnants, list gaps in
    docs/FRONTEND_GAPS.md; set up tokens, theme provider, motion.ts, ornament kit scaffolding.
P2  Design system: tokens, fonts, icon set, SVG ornament kit, Sign/Plate/Milestone/Road components with
    tests; theme switch; docs/UI_GUIDE.md with usage rules and screenshots.
P3  Shell and navigation: rail, top bar, command palette, milestone breadcrumbs, mobile tab bar, footer.
P4  Landing and auth pages with the animated scene (day/night), honest roadmap and results strip.
P5  Dashboard, Defect Registry, Complaints, Kanban, Repair Verification with real data and all states.
P6  AI Scanner, Evaluation, Models, Reports, Settings, Help/About, 404, Demo mode.
P7  Motion polish, reduced-motion, performance tuning, asset credits, i18n completion and glyph checks.
P8  Visual QA and accessibility: capture screenshots of every page x {light, dark} x {360, 768, 1440 px} x
    {English, Hindi, Tamil} (all six languages for Scanner and Dashboard); check clipping, overflow, tofu
    glyphs, overlap, horizontal scroll, contrast, reduced motion; fix and re-capture; save in
    docs/screenshots/ with an index; run Lighthouse + axe + Playwright; write docs/QUALITY_REPORT.md.
GATE for each phase: build passes, lint/types/unit/E2E green, screenshots captured, no regressions.

=====================================================================================
9. PASSES
=====================================================================================
PASS 2 (hostile design review): act as a sceptical design examiner and an Indian user on a mid-range phone in
sunlight. Check: is it distinctive and coherent, is anything cliche, cluttered, slow, hard to read, culturally
careless or inaccurate? List the 15 weakest points in docs/UI_BACKLOG.md; fix in impact order; re-run gates.
Keep a change only if it improves its measure without regressing others; revert and log failures.
PASS 3 (freeze): clean-clone build and test; final screenshots and quality report; update README screenshots
and the UI section; tag ui-v1.0.
STOP when two consecutive rounds show no measurable gain or after 3 passes.

FINAL OUTPUT: summary per phase; Lighthouse, axe and test results with file paths; screenshot index;
asset credits; list of open issues and HUMAN_TODO items (native-speaker review of translations, real-phone
check, asset licence confirmations). START NOW with P1 and continue automatically.
```

