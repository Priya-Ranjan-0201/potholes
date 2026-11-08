# ScamRoad UI Decisions Log (SPEC v12)

| Date | Decision | Rationale | Alternatives Considered |
| :--- | :--- | :--- | :--- |
| 2026-11-08 | Transition from v11 to v12 "Night Highway, Done Properly" | v11 successfully stripped out jargon and established functional motion tokens, but the visual aesthetic became generic and lacked the Indian road infrastructure identity. v12 solves this via the Two-Zone system. | Keeping monochrome slate (too sterile) or returning to v8/v9 (too kitsch). |
| 2026-11-08 | Implement Two-Zone Architecture: `ui/atmosphere` and `ui/data` | Strict separation prevents decorative elements or glowing gradients from ever degrading tabular readability or WCAG AA contrast. | Allowing glass/gradients on data tables (fails contrast & clarity). |
| 2026-11-08 | Exact CSS Tokens for Night Highway & Morning India | CSS variables ensure clean theme switching without hardcoded hex strings across components. | Hardcoded Tailwind color classes (breaks theme switching). |
| 2026-11-08 | Road-Sign Severity Badges (Circle, Triangle, Diamond, Octagon) | Shapes provide instant physical road cognition and comply with accessibility rules (never color alone). | Standard rounded rectangles with colored text. |
| 2026-11-08 | Lightweight Canvas Background Engine with auto-degrade | Single rAF loop, < 5% CPU cost, auto-pauses when tab/section hidden, freezes on reduced-motion or low-spec devices. | Heavy three.js or video backdrops (too slow, high battery drain). |
