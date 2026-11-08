# SCAMROAD — FUNCTIONAL MOTION AND INTERACTION SPECIFICATION v11

Apply AFTER v10 (professional UI). v10 removed decorative gimmicks, so this prompt adds only animation that carries information or confirms an action: detection scans, progress, status changes, data updates, drag and drop, comparisons. Nothing loops for decoration. Frontend only (`web/`). Branch `ui/v11-motion`.

=====================================================================================
0. RULES
=====================================================================================
M1  Functional motion only. FORBIDDEN (stays removed from v10): decorative loops, parallax, particles, floating
    blobs, tilt/magnetic effects, marquee tickers, confetti, mascots, truck-art/cultural ornaments, glow pulses,
    gradient-shift buttons, scroll-jacking. The CI check scripts/check_ui_copy.py keeps failing on banned
    terms; extend its allow-list ONLY for the named animations in section 3.
M2  Truthful motion. Progress animations reflect real progress (inference stage, upload bytes, job status).
    Never fake progress with timers. Never animate numbers to values that are not in the data. Never play a
    success animation unless the server confirmed the action. AI results never trigger celebration.
M3  Reduced motion. Honour prefers-reduced-motion and a Settings toggle "Reduce motion": replace movement with
    instant state change or a 100 ms fade; no spring, no slide, no path draw. Test it.
M4  Performance. Animate transform and opacity only (plus clip-path/width for bars where needed). No layout-
    thrashing animations. Max 3 concurrent animations per view. Infinite animations allowed ONLY for: loading
    spinner/skeleton, the live-camera "recording" dot, and the active inference scan line while inference is
    running. Added JS from motion work <= 25 KB gzip (lazy-load heavy pieces). CLS < 0.1, INP < 200 ms,
    Lighthouse mobile Performance >= 90 must still hold.
M5  Accessibility. Motion never hides information; state changes also announce via aria-live (polite) text;
    no flashing faster than 3 Hz; focus is managed correctly after dialogs/panels; keyboard equivalents for
    every drag interaction.
M6  Consistency. One motion.ts file defines all durations, easings and springs; components import from it.
    No ad-hoc numbers.
M7  Never weaken or delete a test to pass. Regression test per bug. Ask only for licence doubts or
    destructive actions; otherwise decide and log in docs/UI_DECISIONS.md.

=====================================================================================
1. MOTION TOKENS (web/src/motion/motion.ts)
=====================================================================================
duration: instant 0, fast 120 ms, base 200 ms, slow 320 ms, chart 600 ms (once)
easing: standard cubic-bezier(.2,0,0,1); enter cubic-bezier(0,0,.2,1); exit cubic-bezier(.4,0,1,1)
spring: { type: "spring", stiffness: 380, damping: 32 } (panels, drag), softer { stiffness: 260, damping: 28 }
stagger: 30 ms (max 10 items, then no stagger)
Hooks: useReducedMotion(), useMotionPreset(name) returning variants that collapse to fades when reduced.
Library: Framer Motion (code-split) or CSS transitions where enough. No other animation libraries.

=====================================================================================
2. GLOBAL INTERACTIONS
=====================================================================================
- Page transitions: 160 ms fade + 6 px rise on route change; keep sidebar static; restore scroll and focus.
- Toasts: slide/fade in 200 ms, auto-dismiss 5 s with a thin progress bar, pause on hover, "Undo" action for
  reversible operations (status change, delete, merge); stack with layout animation.
- Skeleton loaders shaped like the real content (table rows, cards, charts) with a subtle shimmer; swap to real
  content with a 120 ms crossfade; no layout shift.
- Buttons: 100 ms press state; async buttons show an inline spinner and become disabled; success shows a check
  for 800 ms only after server success.
- Inputs/forms: inline validation messages expand with a 120 ms height transition; error fields get a 1-time
  2-pixel shake ONLY if reduced motion is off and only on submit failure.
- Theme toggle: 200 ms colour crossfade of tokens (CSS variables with transition on background/colour/border).
- Command palette (Ctrl/Cmd+K): fade+scale from .98, result list with keyboard highlight that slides; actions:
  go to page, search defects by ID/corridor, create work order, switch theme, switch language.
- Keyboard shortcuts overlay (?): list of shortcuts, fade in. Shortcuts: g o / g s / g m / g b (go to tabs),
  / (search), n (new work order), esc (close), j/k (move in tables), [ and ] (previous/next defect).
- Offline/online banner: slides down 200 ms; sync status chip animates between Pending -> Syncing -> Synced
  using real outbox state; counts update with a short number transition.
- Empty states: static simple icon + one sentence + action (no looping art).
- Hover/focus: row hover highlight 100 ms; focus ring appears instantly (no delay) with a 100 ms fade.

=====================================================================================
3. PAGE-SPECIFIC ANIMATION (named, so they can be allow-listed)
=====================================================================================
SCANNER (the showcase page)
 S1 "scan-line": while inference runs, a thin horizontal line sweeps top to bottom over the image; its speed is
    tied to the real stage (preprocess -> inference -> postprocess) via progress events; stops immediately when
    results arrive. If progress is indeterminate, show a determinate-less shimmer on the image instead.
 S2 "detection-draw": bounding boxes draw in (stroke-dashoffset, 200 ms) one by one in confidence order,
    each with its label chip fading in; list rows highlight in sync; capped at 10 animated boxes, rest appear
    instantly.
 S3 "box-list linking": hovering a list row highlights its box (thicker stroke, dims others to 40%); hovering a
    box scrolls and highlights the row; keyboard focus does the same; click pins the selection.
 S4 "confidence and severity": confidence bar fills from 0 to value once (300 ms); severity badge transitions
    colour/label with a 150 ms crossfade when an engineer overrides it; the factor breakdown (if shown) expands
    with a height animation.
 S5 "before/after": a draggable divider slider comparing original vs annotated image (pointer + keyboard arrow
    keys); position persists while switching detections.
 S6 "image viewer": wheel/pinch zoom and drag pan with inertia; minimap showing the viewport; double-click to
    fit; zoom buttons; resets with a 200 ms transition.
 S7 "upload dropzone": drag-over state (border colour + slight scale 1.01, 120 ms), file chips animate in,
    per-file progress bars reflect real bytes uploaded, failed files get a retry button; batch queue reorders
    smoothly when items finish.
 S8 "video review": scrubber timeline with detection ticks; tracks drawn as short trails following each tracked
    defect (ID chips); play/pause/step frame; clicking a tick seeks and highlights the box; track merging
    shown as two IDs joining into one chip (200 ms) when the backend reports a merge.
 S9 "live camera": a small recording dot (the one allowed pulse), FPS and latency readout with number
    transitions, detections appear with the S2 draw (no stagger in live mode), a frame-skip indicator when
    adaptive skipping engages, offline queue chip as in section 2.
 S10 "privacy blur preview": a toggle that crossfades between blurred and original preview; label states the
    stored image is always blurred.
 S11 "create work order": clicking the button morphs into a spinner, then a check on server success; the new
    order chip flies a short distance (shared-element transition, 250 ms) into the Maintenance tab badge
    count, which increments with a number transition.

OVERVIEW
 O1 "kpi update": KPI values transition (digit roll, 300 ms) only when data refreshes and the value changes;
    first load shows the final value with no count-up. Delta chip (up/down) fades in.
 O2 "charts": line/bar charts draw in once on first view (600 ms); tooltips follow the pointer with a 100 ms
    ease; legend items toggle series with a 150 ms fade; time-range switch animates the transition between
    datasets (path morph or crossfade).
 O3 "corridor table": sort and filter changes animate row reordering (layout animation, 200 ms); new rows from
    live updates highlight for 1.2 s then fade; clicking a row opens the side panel (O4).
 O4 "side panel": slides in from the right (spring), content staggers by section; shared-element continuity
    of the row title; esc and click-outside close it; focus returns to the row.
 O5 "activity feed": new real events insert at the top with a 200 ms expand; no auto-scrolling when the user has
    scrolled; "N new events" pill appears instead.
 O6 "SLA indicators": countdown chips change colour at thresholds with a 200 ms transition and announce changes
    to screen readers; overdue items show a static warning icon (no pulsing).

MAINTENANCE
 M1 "kanban drag": cards lift (shadow + 1.02 scale) while dragging, drop targets highlight, cards settle with a
    spring; keyboard alternative (select card, arrow keys to move between columns, Enter to confirm); status
    changes call the API first (optimistic update with rollback animation and an error toast if it fails).
 M2 "status change": the status chip crossfades and the timeline appends a new entry with an expand animation;
    "Undo" available for 5 s where the API supports it.
 M3 "defect timeline": observations reveal top-down with 30 ms stagger on first open; selecting an observation
    swaps the image with a crossfade; merge/unmerge animates the two records combining/splitting (150-250 ms).
 M4 "engineer sign-off": the before/after comparison uses the S5 slider; the Approve button requires a short
    reason field; on server confirmation, the order moves to Closed with a check-draw (400 ms) and a calm green
    status transition; no confetti.
 M5 "bulk actions": selecting rows slides up a bottom action bar (200 ms) with a count; bulk assign/close shows a
    progress bar tied to real requests; failures listed with retry.
 M6 "filters": filter chips animate in/out; result count updates with a number transition; saved views switch
    with a crossfade.
 M7 "citizen reports": status stepper (Submitted -> Under review -> Verified -> Assigned -> In progress ->
    Resolved, matching the actual states) fills step by step to the current state on first view; changing state
    animates the fill to the new step.

MODEL BENCHMARKS
 B1 bars (per-class AP, INT8 vs FP32) grow from zero once, 600 ms, staggered 30 ms.
 B2 confusion matrix cells fade in by row (30 ms stagger) once; hovering a cell highlights its row/column and
    shows count and percentage; clicking a cell opens the example images for that cell (failure gallery filter).
 B3 PR curve draws along its path once (600 ms); hovering shows the threshold, precision and recall at that
    point with a moving marker; a draggable threshold slider updates displayed precision/recall from the stored
    curve (no fabricated values; interpolate only between stored points and mark it as such).
 B4 comparison toggles (FP32 <-> INT8, model A <-> B): numbers and bars morph in 300 ms.
 B5 device latency table: bars proportional to measured ms; unmeasured rows show "Not measured" with no bar.

