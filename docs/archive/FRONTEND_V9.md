# SCAMROAD — VIBRANT INDIAN ROAD THEME UPGRADE PROMPT v9 (colour, animation, UX)

Use after v8 (or instead of its colour/visual sections). Frontend only (`web/`). Paste the block into the Antigravity Agent Manager, or save as `docs/FRONTEND_V9.md` and say "follow docs/FRONTEND_V9.md exactly".

Before pasting: branch `ui/v9-vibrant`; terminal auto-run with a deny-list; app stays working at every commit. If you have reference images you like (screenshots, posters, apps), attach them and add the line: "Extract palette and mood from the attached references."

---

```
PROJECT: ScamRoad (scam_road) — frontend ONLY (web/). React 18 + Vite + TypeScript + Tailwind + Framer Motion.
PROBLEM: the current UI/UX and colours look dull and unattractive. Make it vibrant, rich, joyful, modern and
unmistakably Indian + road themed, while staying readable, fast, accessible and honest.

ROLE: Art director + lead product designer + senior front-end + motion designer + accessibility engineer,
working AUTONOMOUSLY. Taste matters, so DO NOT guess one palette: build, compare, and ship selectable themes.

=====================================================================================
0. RULES
=====================================================================================
U1  Frontend only; no backend/ML changes. Missing API data -> clean empty state, logged in
    docs/FRONTEND_GAPS.md. Never fake numbers; seeded data shows DEMO DATA.
U2  No government identity (no emblem, Ashoka Chakra, flag-like tricolour layouts, MoRTH/NHAI/PWD logos,
    "official" wording). Footer: "Student research project. Not an official government system. Not
    safety-certified."
U3  Culture with respect: inspiration from truck art, rangoli/kolam/alpana, Phulkari, Madhubani, Warli,
    Kalamkari/ikat/bandhani textile patterns, jaali, kites, chai stalls, auto-rickshaws, milestone stones and
    hand-painted signboards. ORIGINAL artwork only. No deities, religious symbols, caste/community
    stereotypes, real people, brands or copyrighted characters; nothing traced or ripped. Fonts/icons/art
    must be open-licensed or hand-made SVG; list all in docs/ASSET_CREDITS.md. No map UI anywhere.
U4  Colour never carries meaning alone (shape + icon + text). WCAG AA contrast enforced by an automated check
    on every token pair; fix tokens, never remove the check.
U5  Fun lives in empty/loading/success states and decoration. Errors, safety messages and data labels stay
    plain and clear. AI never triggers celebration; only human engineer sign-off does.
U6  Respect prefers-reduced-motion, forced-colors, and a visible "Reduce motion" setting. Animate only
    transform/opacity/filter-lite. Pause everything when the tab is hidden.
U7  Never weaken a test to pass; regression test per bug. Ask only for licence doubts or destructive actions.
U8  Performance budget holds (section 8) even with rich art.

=====================================================================================
1. AUTONOMOUS LOOP
=====================================================================================
State in docs/UI_STATE.md. Per phase: plan -> implement -> checks -> SELF-REVIEW GATE -> commit (Conventional
Commits) -> tag ui9-phase-N-done. Fix failures at the root (max 3 attempts, then mark blocked and continue).
No approval between phases except the THEME CHOICE (section 3), where you apply the default and keep going.
Then PASS 2 (hostile design review) and PASS 3 (freeze).

=====================================================================================
2. DESIGN DIRECTION: "INDIA ON THE ROAD" — BOLD, WARM, GLOWING, LAYERED
=====================================================================================
Look and feel: colourful and confident like Indian truck art and festival streets, precise like a night
highway dashboard. Think saturated gradients, glowing edges, layered paper-cut shapes, patterned borders,
big friendly type, generous spacing, and a clear visual hierarchy. Less beige, less flat, less boxy.

Core visual moves (implement all, tastefully):
1. GRADIENT-FIRST SURFACES: hero, KPI plates and primary buttons use rich multi-stop gradients with a thin
   inner highlight; data areas keep calm solid/glass surfaces for readability.
2. MESH + GLOW BACKGROUNDS: large blurred colour blobs drifting slowly behind content, a faint pattern layer
   (jaali / phulkari-star / kolam dots at 3-5% opacity), and a soft vignette. Dark mode adds bloom and
   reflector dots; light mode adds paper-cut layered hills/road shapes.
3. PATTERN LIBRARY (original SVG, tileable): truck-art scallops and paisley-like leaf shapes, marigold-like
   floral abstracts, phulkari star grids, kolam dot-lines, Madhubani-style fish/peacock-feather abstractions
   (geometry only), Warli-style stick-figure road scenes, ikat zig-zags, bandhani dot clusters, jaali screens.
   Use as card corners, dividers, header bands, empty-state art and loader frames.
4. SEVERITY AS ROAD SIGNS: Minor = blue round info sign, Moderate = yellow warning triangle, Severe = orange
   diamond, Critical = red stop-style octagon; glow intensity grows with severity.
5. KILOMETRE-STONE NAVIGATION: page headers and mobile tabs as milestone stones with place names/KM numbers.
6. SIGNBOARD HEADINGS: poster display type on a painted plate with slight tilt, drop shadow and shine sweep.
7. REGIONAL FLAVOUR: the selected language adds a subtle accent pattern to headers/footers (Hindi: Madhubani-
   style motif, Punjabi: phulkari stars, Tamil: kolam, Telugu: Kalamkari-inspired leaves, Bengali: alpana
   curves, English: truck-art scallops). Keep colours the same; only the ornament changes. Mark as decorative
   (aria-hidden).
8. ROAD AS A STORY: landing page scroll tells the journey Capture -> Detect -> Track -> Repair along a winding
   road that draws itself as you scroll, with milestone stops and vehicles passing.

=====================================================================================
3. THEMES (ship all four; user picks in Settings; default = A)
=====================================================================================
Build a dev-only /design-lab route (removed from production build) that renders the same 5 sample screens
(landing hero, dashboard, scanner result, registry, kanban) in every theme, light and dark, so I can compare.
Capture side-by-side screenshots into docs/screenshots/theme-compare/. Then ship these as selectable themes
with a live preview in Settings. All colours are CSS variables; no hardcoded colours in components.

THEME A — "HOLI HIGHWAY" (default; vibrant, festive, high energy)
  Light: bg #FFF6EC -> #FFE9F1 soft gradient wash, surface #FFFFFF, surface-2 #FFF1E0, text #1A1026,
  muted #5A4A6B, primary gradient #FF3D81 -> #FF8A00 (magenta to saffron-orange), secondary #5B3DF5
  (violet), accent-teal #00B8A9, accent-lime #7ED321, focus-ring #5B3DF5.
  Dark: bg #0B0714, surface rgba(28,16,48,.78), text #F7F1FF, muted #B7A8D1, primary gradient
  #FF4D94 -> #FFB000, secondary #8C6BFF, accent-teal #2EE6D6, glow magenta/violet/saffron.
THEME B — "TRUCK ART NEON" (bold, high contrast, poster-like)
  Light: bg #FFFBEA, surface #FFFFFF, text #14110A, primary gradient #E8161C -> #FF9F00, secondary #0B3C8C
  (royal blue), accent #00A859 (leaf), accent-2 #FFD400 (milestone yellow), borders in ink #14110A at 2 px
  for sticker-style cards.
  Dark: bg #0A0A0F, surface #14141C, text #FFF8E1, primary gradient #FF3B3B -> #FFC21A, secondary #3D7BFF,
  accent #1FE08A, neon glow edges.
THEME C — "MONSOON DUSK" (calm, cinematic, teal-indigo-mango)
  Light: bg #F2FBFA, surface #FFFFFF, text #0E1B2B, primary gradient #0FB5AE -> #4F46E5, accent mango
  #FFB020, accent-2 coral #FF6B57.
  Dark: bg #060E1B, surface rgba(10,24,44,.8), text #E9F6FF, primary gradient #22D3C5 -> #7C6CFF, accent
  mango #FFC15A, rain-streak and reflection effects.
THEME D — "PUNJAB FIELDS" (nod to Punjab: mustard, wheat, phulkari pink)
  Light: bg #FFFCEB, surface #FFFFFF, text #1D1606, primary gradient #F5B400 -> #E4572E, secondary #0C7A43
  (field green), accent phulkari pink #E83E8C, accent-2 sky #2D9CDB.
  Dark: bg #0C0F08, surface rgba(24,28,14,.8), text #FFF7D6, primary gradient #FFC933 -> #FF6F3C, accent
  #2EC27E, accent-2 #FF5FA2.
Common tokens per theme: bg, bg-wash, surface, surface-2, border, text, muted, primary, primary-contrast,
primary-gradient, secondary, accent, accent-2, success, warn, danger, focus-ring, glow-1/2/3, shadow-colour,
plus severity sign colours: Minor #1E78D0, Moderate #F2B705, Severe #F26A1B, Critical #D7263D (adjusted per
theme only if contrast fails). Text on gradients uses the darker or lighter contrast token that passes AA.
Also provide a colour-blind check (deuteranopia/protanopia simulation screenshots) for severity signs.

=====================================================================================
4. TYPOGRAPHY AND LAYOUT
=====================================================================================
Fonts (open-licensed, bundled, subset, font-display: swap): Display "Yatra One" or "Rozha One" for English/
Hindi headings, "Baloo 2" family for friendly headings where it covers the script, Body "Inter" or "Mukta",
Numbers "JetBrains Mono" (tabular), Noto Sans Devanagari/Gurmukhi/Tamil/Telugu/Bengali for scripts.
Verify no missing glyphs; larger line-height for Indic scripts; fluid type with clamp().
Layout: BENTO-GRID dashboards (mixed card sizes, strong hierarchy, one hero metric per page), big readable
numbers, 8-pt grid, radii 12/20/32, generous whitespace, sticky action bars on mobile, one primary action
per screen, progressive disclosure for advanced details. Desktop: collapsible rail + command palette
(Ctrl/Cmd+K). Mobile: bottom milestone tab bar with thumb-reachable actions and safe-area padding.

=====================================================================================
5. ANIMATION CATALOGUE (all via motion.ts tokens; durations 120/200/320/520/900 ms; easing
cubic-bezier(.2,.8,.2,1); spring {stiffness 260, damping 26})
=====================================================================================
AMBIENT (cheap, pausable)
- Drifting gradient blobs; slow parallax of 3 hero layers; road dashes streaming to the horizon; cat's-eye
  reflectors pulsing in sequence; floating kites (3-5, SVG) in the landing sky; chai-steam wisps in the
  empty-state art; a vehicle silhouette (truck, auto-rickshaw, bus; original) drifting along footer road;
  tailgate-style marquee ticker for live activity ("NEW: 3 potholes logged on ...") with pause-on-hover.
INTERACTION
- Cards: gentle 3D tilt + glow follow-pointer (desktop only); buttons: magnetic hover, gradient shift, press
  .98, ripple shaped like a rangoli ring; links: animated underline in a lane-dash style; inputs: floating
  labels with a glowing focus ring; toggles with springy knobs; theme switch = sunrise/sunset wipe;
  language switch = ornament crossfade; command palette with blurred backdrop.
DATA
- Count-up numbers (once), number roll for live updates, chart draw-in, bars growing from the road line,
  sparkline trace, gauge needle sweep, progress "roads" with a driving vehicle driven by real progress,
  stagger entrances (40 ms), skeletons with colour-shimmer.
SCANNER SIGNATURE
- Scan-beam sweeping the image driven by real inference progress; boxes pop with spring + colour glow;
  confidence ring fills; severity sign drops in with a bounce; before/after slider with a reflective handle;
  "scan complete" tick with a short road-sign shine sweep.
STORY / SCROLL
- Landing route draws itself with SVG path animation as you scroll; milestone stops pop in; vehicles pass;
  sections reveal with paper-cut layer slides; results strip counts up from generated files.
CELEBRATION (human sign-off only)
- Marigold-petal and colour-powder burst (canvas, <1 s, <=80 particles) when an ENGINEER verifies and closes a
  work order; a small "Road repaired" stamp animation.
DELIGHT
- Optional "Horn OK Please" ripple on the logo (sound OFF by default, opt-in only, never auto-play);
  404 "Road closed - diversion ahead" with the original mascot "Gaddha" driving off; loading screen with a
  wheel/road animation; easter egg when typing "chai" in the command palette (decorative, harmless).
SAFETY OF MOTION: disable tilt, parallax, particles, kites, marquee movement and loops under reduced motion;
keep fades only. No flashing faster than 3 Hz. Cap total animated elements per view; use will-change
sparingly; test on a throttled mid-range device profile.

=====================================================================================
6. PAGES TO RE-DESIGN (all real, all states; no map)
=====================================================================================
Landing (scroll story, hero scene day/night, honest roadmap, results strip); Login/Register (split layout
with animated illustration and inline validation); Dashboard (bento KPIs, trend chart, Ward Hotspot Grid
as coloured tiles, worst-corridors list, SLA leaderboard, activity ticker); AI Scanner; Capture (PWA);
Defect Registry + detail (observation timeline as a road with milestones; location as text + "Open in your
maps app" link); Complaints (step-by-step wizard, status stepper as a journey); Maintenance Kanban (lanes
as road lanes, SLA chips, engineer sign-off dialog with before/after); Repair Verification; Evaluation
(presentation-ready charts from generated files); Models; Reports; Settings (theme picker with live preview
cards for A-D, light/dark/system, language, reduce motion, rate card); Help/About; 404; Demo mode (guided
6-step tour for the viva, bigger type, labelled demo data).
Microcopy: short, warm, plain, in i18n keys for six languages (flag "needs native review"); road-flavoured
lines only in empty/loading/success states.

=====================================================================================
7. UX FIXES (do these even if visuals change)
=====================================================================================
- Reduce clutter: one hero metric + max 4 secondary per view; collapse advanced filters; consistent spacing.
- Clear primary action per page; consistent button hierarchy (primary gradient, secondary outline, tertiary
  text); destructive actions need confirm + undo.
- Faster feel: optimistic UI where safe, skeletons, prefetch on hover, instant theme/language switch.
- Better forms: inline validation, autosave drafts, helpful examples, keyboard flows.
- Onboarding: first-run 3-card intro (what it does, how to scan, limits), dismissible and re-openable.
- Trust cues: "measured vs estimated" chips, data-as-of stamps, "Why this score?" popovers, limitations link.
- Consistent iconography (one icon set, e.g. Lucide) plus custom road/sign icons.

=====================================================================================
8. QUALITY BARS (measured, saved in docs/QUALITY_REPORT.md)
=====================================================================================
Accessibility: WCAG 2.2 AA target, keyboard navigation, visible focus, ARIA landmarks, live regions, 44 px
targets, 200% zoom, axe-core 0 serious/critical, contrast check for all themes in light and dark.
Performance: Lighthouse mobile Performance >= 85 (rich landing >= 80 acceptable if documented), Accessibility
>= 95, Best Practices >= 95; LCP < 2.5 s on throttled 4G; CLS < 0.1; INP < 200 ms; initial JS < 250 KB gzip;
ONNX/WASM lazy in a Web Worker; art as inline/sprite SVG (<40 KB each, hero total <150 KB); lazy-load
below-the-fold art; subset fonts.
i18n: keys only, missing-key test, long Tamil/Telugu/Bengali strings don't break layouts, no tofu glyphs.
Code: strict TypeScript, no `any`, ESLint/Prettier; reusable UI kit in web/src/ui (SeveritySign, Plate,
MilestoneHeader, OrnamentFrame, PatternBand, RoadLoader, KpiPlate, BentoGrid, ThemePicker, EmptyState,
Marquee, PetalBurst) each unit-tested; optional Storybook.
Tests: Vitest + RTL, Playwright E2E for scan -> result -> work order, complaint, engineer sign-off in light/
dark and mobile/desktop; visual-regression snapshots for key pages in each theme.

=====================================================================================
9. PHASES
=====================================================================================
P1 Audit current UI, list what looks dull/cluttered, remove dead code and map leftovers, set up token system
   for 4 themes x light/dark, motion.ts, pattern library scaffolding.
P2 Design Lab: render sample screens in all themes, capture comparison screenshots, check contrast and
   colour-blind simulation; fix tokens; set default = Theme A.
P3 UI kit and pattern/ornament library (original SVG), icon set, fonts, asset credits.
P4 Shell, navigation, command palette, theme picker with previews, regional-flavour accents.
P5 Landing + auth with the scroll story, hero scene day/night, kites, marquee.
P6 Dashboard (bento), Registry, Complaints, Kanban, Repair Verification.
P7 Scanner, Evaluation, Models, Reports, Settings, Help, 404, Demo mode.
P8 Motion polish, reduced-motion, performance tuning, i18n and glyph checks.
P9 Visual QA: screenshots of every page x 4 themes x {light, dark} x {360, 768, 1440 px} x {English, Hindi,
   Tamil} (all six languages for Scanner and Dashboard); check clipping, overflow, tofu, overlap, horizontal
   scroll, contrast; Lighthouse + axe + Playwright; fix and re-capture; write the quality report.
GATE each phase: build, lint, types, unit, E2E green; screenshots captured; no regressions.

PASS 2 (hostile design review): review as a sceptical art director and an Indian user on a mid-range phone in
sunlight. Is it vivid yet readable, coherent, fast, culturally respectful and original? List the 15 weakest
points in docs/UI_BACKLOG.md; fix in impact order; keep a change only if it improves its measure without
regressions; log reverted ideas.
PASS 3 (freeze): clean-clone build and test; final screenshots and quality report; update README screenshots;
tag ui-v2.0.
STOP when two rounds show no measurable gain or after 3 passes.

FINAL OUTPUT: summary per phase; theme comparison screenshots; Lighthouse/axe/test results with paths; asset
credits; open issues and HUMAN_TODO (choose the final default theme, native-speaker review of translations,
real-phone daylight check, licence confirmations). START NOW with P1 and continue automatically.
```

