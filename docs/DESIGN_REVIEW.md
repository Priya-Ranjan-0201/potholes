# ScamRoad Design Review & Rubric Scores (SPEC v12)

This document tracks autonomous design quality evaluations against the 10-point rubric defined in `docs/UI_V12.md`.
A page passes a phase only if every criterion is >= 8/10 with screenshot crop justification.

## 10-Point Rubric
1. **Visual hierarchy**: One clear focal point per viewport
2. **Spacing rhythm**: Strict 4/8 grid, no cramped or floating elements (max-width 1440px, gutters 24/32px)
3. **Alignment & grid consistency**: Columns and cards adhere to strict layout alignment
4. **Typography scale & line length**: Plus Jakarta Sans headings, Inter body, JetBrains Mono numbers, max 75ch line length
5. **Colour harmony & contrast**: WCAG 2.2 AA compliant tokens (Night Highway dark / Morning India light)
6. **Component consistency**: Shared UI tokens, radius 10 (data) / 16 (atmosphere) / 999 (chips)
7. **Theme expression**: Road + India craft (road-sign amber, reflector teal, road-sign severity shapes, jaali accent, Devanagari secondary subtitle) without kitsch
8. **Motion quality**: Purposeful, smooth (tokens in `motion.ts`), <= 3 concurrent non-background animations, respects reduced motion
9. **Density & readability of data**: High tabular legibility, flat solid data surfaces, no background noise behind text
10. **Polish of states**: Custom empty states (A5), loading spinner (A4), 404 (A6), and inline error transitions

---

## P1 Baseline Audit Scores

| Criterion | Overview | Scanner | Maintenance | Benchmarks | Landing / Shell |
| :--- | :---: | :---: | :---: | :---: | :---: |
| 1. Visual Hierarchy | 7/10 | 7/10 | 7/10 | 7/10 | 5/10 |
| 2. Spacing Rhythm | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 |
| 3. Alignment & Grid | 7/10 | 8/10 | 7/10 | 8/10 | 6/10 |
| 4. Typography Scale | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 |
| 5. Colour Harmony | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 |
| 6. Component Consistency | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 |
| 7. Theme Expression | 5/10 | 6/10 | 5/10 | 6/10 | 4/10 |
| 8. Motion Quality | 7/10 | 7/10 | 7/10 | 7/10 | 5/10 |
| 9. Density & Readability | 8/10 | 8/10 | 8/10 | 8/10 | 6/10 |
| 10. Polish of States | 6/10 | 7/10 | 6/10 | 7/10 | 4/10 |
| **Overall Average** | **6.8** | **7.1** | **6.7** | **7.2** | **5.4** |

### P1 Findings & Deficiencies
1. **Theme Identity**: The interface currently uses generic dark slate (`#0B1120`, `#0F172A`) with standard blue accents. It lacks the distinctive **Night Highway** palette (`#FFB020` road-sign amber, `#19D3C5` reflector teal, `#070B14` night tarmac).
2. **Missing Atmosphere Zone vs Data Zone**: Backgrounds are completely flat or lack the perspective road canvas (B1/B2) behind the app shell.
3. **Severity Badges**: Badges are pill shapes rather than the mandated road-sign geometry (Round for Minor, Triangle for Moderate, Diamond for Severe, Octagon for Critical).
4. **App Shell & Glass Navigation**: Sidebar / Navbar needs the glass blur (12-16px) with 1px border and sliding active indicator.
5. **Scanner Dropzone**: Lacks the animated flowing lane-dash border (A8) that converges into a progress bar on file drop.
6. **Landing Page**: Needs the full A1 hero with sample detection overlay, headline reveal, Devanagari secondary tagline ("सड़क सुरक्षा"), and A2 how-it-works road progression.

---

## Target Gate
All pages must reach **>= 8/10** on all 10 criteria before Phase 9 final freeze.
