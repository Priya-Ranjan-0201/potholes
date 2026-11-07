# ScamRoad UI Audit (v10 Anti-Slop Baseline)

**Date:** 2026-11-08  
**Baseline Anti-Slop Violations:** 222 violations detected by `scripts/check_ui_copy.py`.

## 1. Purge List Elements Identified

| Category | Specific Elements Identified | Action |
| :--- | :--- | :--- |
| **Gimmick Components** | `PatternBand.tsx`, `CatsEye.tsx`, `OrnamentFrame.tsx`, `ThemePicker.tsx`, `RoadStory.tsx`, `MilestoneHeader.tsx`, `PetalBurst.tsx`, `MarqueeTicker.tsx`, `GaddhaMascot` | DELETE completely |
| **Gimmick Pages** | `DesignLabPage.tsx` | DELETE |
| **CSS Classes** | `.dhaba-card`, `.dhaba-*`, `.ambient-glow-mesh`, `driftMesh`, `neon glow box-shadows`, `blur-3xl`, multi-theme variables (A, B, C, D) | PURGE from `index.css` |
| **Prompt Jargon in UI** | `Rule R4`, `Rule B6`, `Rule R1`, `Rule F3`, `Clause 4.2`, `Phase`, `Frozen`, `Zero Mock Data` in components, comments, and buttons | PURGE & replace with plain English |
| **Buzzword Soup** | `Empirical Edge AI & Municipal Workflow Command Center`, `Autonomous Road Infrastructure Intelligence`, `Hyper-Quantized Neural Perception` | Replace with: `Road Defect Management System` |
| **8-Tab Nav Sprawl** | Nav currently splits into 8 tabs + Design Lab | Consolidate to exactly 4 tabs: **Overview, Scanner, Maintenance, Model Benchmarks** |
| **Theme System** | 4 multi-theme definitions with color swatches | Consolidate to 1 single quiet theme: Light & Dark |

## 2. Target Design Language
- **Linear / GitHub / Stripe Dashboard Restraint:** Flat 1px border lines, slate surfaces, compact 40px table rows, high density, JetBrains Mono for numbers/coordinates, Plus Jakarta Sans for UI.
- Real data only. Demo data flagged with plain DEMO badge.

