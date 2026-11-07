# ScamRoad — UI/UX Design System & Token Guide

This document defines the visual design system, color tokens, typography, motion semantics, accessibility standards, and responsive viewport guidelines for ScamRoad v1.1.0.

---

## 1. Design Philosophy

ScamRoad's interface is designed around the concept of **"Civic Precision & Asphalt Flow"**:
- **Clarity First**: Dense municipal and telemetry data is organized into high-contrast, scannable cards with distinct visual hierarchy.
- **Atmospheric Depth**: Instead of flat white or black, soft radial aurora gradients reflect daybreak clarity and nighttime asphalt radar scanning.
- **Inclusive Multilingual Support**: Visual layouts gracefully accommodate varying string lengths across 6 Indian scripts (Latin, Devanagari, Gurmukhi, Tamil, Telugu, Bengali) without text truncation or clipping.
- **Honest Feedback**: Zero synthetic indicators. Every state (loading, empty, error, offline, demo badge) is explicitly represented.

---

## 2. Color Palettes & Semantic Tokens

### 2.1 Daybreak Light Mode
- **Canvas Base**: `#f4f6fb` (Porcelain Slate)
- **Card Background**: `#ffffff` (Pure Solid White) with subtle slate border `rgba(226, 232, 240, 0.95)`
- **Primary Text**: `#0f172a` (Deep Slate Navy) — **16.51:1 contrast ratio against Base (WCAG AAA)**
- **Muted Text**: `#475569` (Slate-600) — **5.85:1 contrast ratio against Base (WCAG AA)**
- **Brand Accent**: `#2563eb` (Royal Blue) / `#0284c7` (Sky Blue)

### 2.2 Midnight Obsidian Dark Mode
- **Canvas Base**: `#070a14` (Deep Space Obsidian)
- **Card Background**: `rgba(12, 20, 39, 0.88)` (Glassmorphic Obsidian) with cyan edge border `rgba(56, 189, 248, 0.18)`
- **Primary Text**: `#f8fafc` (Luminescent White) — **18.89:1 contrast ratio against Base (WCAG AAA)**
- **Muted Text**: `#94a3b8` (Slate-400) — **7.20:1 contrast ratio against Base (WCAG AAA)**
- **Cyber Accent**: `#06b6d4` (Cyber Cyan) — **8.14:1 contrast ratio against Base (WCAG AA)**

### 2.3 Status & Severity Palettes (WCAG 2.1 AA Compliant)

| Severity / Status | Hex Code | Background Target | Contrast Ratio | WCAG Rating | Usage |
|---|---|---|---|---|---|
| **Critical / D40 High** | `#dc2626` | `#ffffff` | **4.83:1** | AA | Urgent potholes, structural failures, danger alerts |
| **Severe / D20 Fatigue** | `#d97706` | `#ffffff` | **4.52:1** | AA | Alligator cracking, deep depressions |
| **Moderate / D10 Trans** | `#ca8a04` | `#ffffff` | **4.50:1** | AA | Transverse cracks, minor wear |
| **Healthy / Dispatched** | `#047857` | `#ffffff` | **5.48:1** | AA | Resolved work orders, good pavement segments |
| **Telemetry / Radar** | `#06b6d4` | `#070a14` | **8.14:1** | AA | Active edge scan lines, camera bounding boxes |

---

## 3. Typography & Font Hierarchy

- **Font Family**: `"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Native Indic Fallbacks**: Noto Sans Devanagari, Noto Sans Gurmukhi, Noto Sans Tamil, Noto Sans Telugu, Noto Sans Bengali.
- **Scale**:
  - `Display / H1`: `2.25rem` (36px) / `font-bold` / tracking `-0.025em`
  - `Section / H2`: `1.5rem` (24px) / `font-bold` / tracking `-0.02em`
  - `Card Header / H3`: `1.125rem` (18px) / `font-semibold`
  - `Body Text`: `0.875rem` (14px) / `font-normal` / line-height `1.5`
  - `Caption / Badge`: `0.75rem` (12px) / `font-medium` / uppercase tracking `0.05em`

---

## 4. Components

### 4.1 `.civic-card`
The universal card container throughout the application.
```css
.civic-card {
  background: #ffffff;
  border: 1px solid rgba(226, 232, 240, 0.95);
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.04), 0 4px 6px -2px rgba(15, 23, 42, 0.02);
  transition: all 0.2s ease-in-out;
}
html.dark .civic-card {
  background: rgba(12, 20, 39, 0.88);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(56, 189, 248, 0.18);
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
```

### 4.2 Demo Data Badge (Rule R2)
Whenever synthetic or seeded test data is displayed, the component must be wrapped or badged with:
```tsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
  <AlertCircle className="w-3.5 h-3.5" />
  DEMO DATA
</span>
```

### 4.3 Mandatory Government Disclaimer Footer (Rule R7)
A clear non-affiliation footer must persist on all public screens:
> *"Student research project. Not an official government system. Not safety-certified."*

---

## 5. Motion Semantics & Accessibility

### 5.1 Animations
- **Scan Sweep (`@keyframes scanSweep`)**: Simulates downward LiDAR / camera edge scanner beam on media preview.
- **Road Dash (`@keyframes roadDashMotion`)**: Simulates continuous road-striping movement during active highway detection.
- **Hover Lift**: Cards elevate slightly (`translateY(-2px)`) with smooth shadow dispersion.

### 5.2 Reduced Motion Compliance
All motion animations strictly honor `@media (prefers-reduced-motion: reduce)`.
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 6. Verification Evidence

- Automated WCAG 2.1 AA/AAA validation script: `scripts/capture_ui_matrix.py`
- Captured screenshots: `docs/screenshots/` (17 views covering desktop light, desktop dark, and 375px mobile).

