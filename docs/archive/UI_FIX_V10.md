# SCAMROAD — PROFESSIONAL UI FIX PROMPT v10 ("QUIET, CLEAR, CREDIBLE")

This replaces the visual direction of v8 and v9. Frontend only (`web/`) plus the seed script and i18n files. Work on branch `ui/v10-professional`.

```
PROJECT: ScamRoad (scam_road) — road defect management portal. Frontend cleanup ONLY (web/, i18n files, seed
script, UI docs). Backend/ML behaviour does not change.

WHY: an expert review found the UI reads as AI-generated "slop": novelty theming (truck art, dhaba cards,
cat's-eye dots, milestone badges), prompt-rule codes printed in the interface, buzzword copy, decorative
glow/mesh blobs, a bloated 8-tab navigation, and charts showing history that does not exist in the database.
GOAL: a calm, dense, authoritative civil-engineering tool that a municipal engineer, a contractor and a viva
examiner would trust. Think Linear / GitHub / Stripe dashboard restraint: flat surfaces, 1px borders, tight
spacing, plain English, real numbers only.

ROLE: Senior product designer + front-end engineer + QA, working AUTONOMOUSLY.

=====================================================================================
0. RULES
=====================================================================================
P1  PURGE decoration that is not information. Remove every gimmick listed in section 2. Do not replace it
    with a new gimmick.
P2  NO internal jargon in the UI: no "Rule R4", "Rule B6", "R1-R15", "Clause 4.2", "Phase", "Pass", "v1.1.0
    (Frozen)", "Zero Mock Data", or any prompt/spec reference, in components, i18n files, tooltips, toasts, API
    messages shown to users, alt text, aria-labels, page titles or comments that ship to production.
P3  PLAIN, QUIET COPY. No hype words (empirical, autonomous, hyper-quantized, revolutionary, intelligent
    command center, next-gen, world-class, AI-powered everything). Say what the thing is and does.
P4  REAL DATA ONLY. Every chart, count and trend is computed from actual database rows or generated result
    files. No interpolation, smoothing, sine waves, padding with zeros to fake a history. If there are too few
    data points, show a table or "Not enough history yet (N records)" instead of a chart.
P5  ONE FOCUSED PRODUCT: exactly 4 primary navigation items (section 3). No hidden pages, no design lab, no
    theme picker in production.
P6  KEEP what is correct and valuable: honest labels (relative area %, estimated vs measured), DEMO DATA
    badges, human sign-off for work orders, student-project footer, accessibility, performance, 6-language
    support, privacy blur preview. No map UI. No government emblem or "official" wording.
P7  Never weaken or delete a test to pass. Fix root causes. Regression test per bug.
P8  Ask only for licence doubts or destructive actions; otherwise decide, log in docs/UI_DECISIONS.md, continue.
```

