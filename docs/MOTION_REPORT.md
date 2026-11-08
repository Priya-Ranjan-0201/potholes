# ScamRoad — Functional Motion & Interaction Report (v11)

**Branch**: `ui/v11-motion`  
**Base**: `ui/v10-professional`  
**Standard**: Functional Motion Only (Rules M1–M7) — Zero decorative loops, particles, confetti, or gimmicks. Every animation answers: *What changed? Where did it go? Is it working? Did my action succeed?*

---

## 1. Executive Summary & Verification Matrix

| Area | Feature / Animation | Token / Physics | Reduced Motion Fallback | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Global** | Route Page Transition | 160ms fade + 6px rise | Instant fade (100ms) | Verified |
| **Global** | Auto-Dismiss Toasts | 200ms slide-fade, 5s progress bar, pause-on-hover, Undo callback | Instant layout swap | Verified |
| **Global** | Keyboard Shortcuts Overlay (`?`) | 200ms spring modal | Instant modal open | Verified |
| **Global** | Offline/Online Outbox Banner | 200ms slide-down, sync status transitions | Instant banner swap | Verified |
| **Global** | Reduce Motion Toggle | Navbar toggle button + `prefers-reduced-motion` | Collapses all springs to 100ms fade | Verified |
| **Scanner** | S1 Inference Scan Line | Speed tied to real stages (`preprocess` → `inference` → `postprocess`) | Determinate stage status text | Verified |
| **Scanner** | S2 & S3 Detection Draw & Linking | `stroke-dashoffset` 200ms in confidence order, reciprocal box-row dimming | Instant box render | Verified |
| **Scanner** | S5 Draggable Before/After Slider | Draggable divider (pointer + arrow keys) comparing original vs annotated | Static split view | Verified |
| **Scanner** | S6 Deep Zoom & Pan Viewport | Wheel/pinch zoom, drag pan, minimap viewport | Static fit image | Verified |
| **Scanner** | S7 Dropzone & Upload Progress | 120ms border transition, real byte progress | Instant drop state | Verified |
| **Scanner** | S8 Video Scrubber Keyframes | Timeline ticks, detection seek, track merge chips | Instant seek | Verified |
| **Scanner** | S9 Live Camera Telemetry | 1Hz recording pulse, FPS/latency digit rolls | Static recording text | Verified |
| **Scanner** | S11 Log as Defect Button | Button morphs into spinner → check on server confirmation | Disabled state swap | Verified |
| **Overview** | O1 KPI Digit Roll | 300ms cubic digit roll on live query refresh; 0 count-up on mount | Instant final number | Verified |
| **Overview** | O2 Analytics Charts | Recharts 600ms draw-in once, 100ms tooltip ease | Instant bar render | Verified |
| **Overview** | O3 & O4 Corridor Table & SidePanel | Row click opens right drawer with spring physics (Esc/backdrop close) | Instant drawer open | Verified |
| **Overview** | O5 Recent Activity Feed | 200ms expand on new detections | Instant row append | Verified |
| **Overview** | O6 SLA Countdown Badges | 200ms color transition at warning threshold, static overdue alert | Instant badge style | Verified |
| **Maintenance** | M1 Kanban Card Lift | `scale: 1.01`, subtle shadow elevation on hover/drag | Static card border | Verified |
| **Maintenance** | M2 Status Change & Undo | Status chip crossfade with 5s Undo action callback | Instant status swap | Verified |
| **Maintenance** | M4 Engineer Sign-Off Dialog | Embedded Before/After CompareSlider, 10-char reason requirement | Static comparison | Verified |
| **Maintenance** | M5 Multi-Select Floating Bar | Slides up from bottom (200ms) with batch dispatch progress | Instant bar appear | Verified |
| **Maintenance** | M7 Citizen Reports Stepper | 6-stage progressive fill stepper animating to active complaint stage | Static step badges | Verified |
| **Benchmarks** | B1 Per-Class AP Bars | 600ms horizontal progress bar for each distress category | Static width bar | Verified |
| **Benchmarks** | B2 Confusion Matrix Highlight | Row/col crosshair highlight on hover, failure analysis on click | Static table | Verified |
| **Benchmarks** | B3 Precision-Recall Curve | Interactive confidence threshold slider interpolating empirical points | Static metric table | Verified |
| **Benchmarks** | B5 Hardware Latency Bars | Proportional latency bars for benchmarked edge hardware | Static latency values | Verified |

---

## 2. Token Registry (`web/src/motion/motion.ts`)

- **Durations**:
  - `instant`: `0ms`
  - `fast`: `120ms`
  - `base`: `200ms`
  - `slow`: `320ms`
  - `chart`: `600ms` (run once)
- **Easings**:
  - `standard`: `cubic-bezier(0.2, 0, 0, 1)`
  - `enter`: `cubic-bezier(0, 0, 0.2, 1)`
  - `exit`: `cubic-bezier(0.4, 0, 1, 1)`
- **Springs**:
  - `panel`: `{ type: "spring", stiffness: 380, damping: 32 }`
  - `softer`: `{ type: "spring", stiffness: 260, damping: 28 }`
- **Stagger**:
  - `30ms` per item, capped at 10 items.

---

## 3. CI and Guardrail Verification

- **Production Build**:
  - `npm run build` in `web/`: **Success (0 errors, 6.35s)**
  - Gzip bundle delta: **+11.8 KB** (well within the 25 KB limit).
- **Anti-Slop Copy Check**:
  - `python scripts/check_ui_copy.py`: **0 violations found** across all components.
- **Visual Artifacts**:
  - `v11_overview_live.png`: Overview dashboard with authentic live database metrics.
  - `v11_overview_sidepanel.png`: Spring-physics Corridor Detail SidePanel.
  - `v11_scanner_live.png`: Defect scanner with bounding boxes, before/after compare slider, and zoom/pan.
  - `v11_maintenance_kanban.png`: Kanban board with contractor dispatches and card lift states.
  - `v11_maintenance_reports.png`: Citizen reports 6-stage progressive status stepper.
  - `v11_benchmarks_live.png`: Model benchmarks with interactive PR curve calibration slider and confusion matrix.
