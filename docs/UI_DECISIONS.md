# ScamRoad Design Decisions (v8: "Truck Art Meets Night Highway")

## 1. Visual Theme Philosophy
The interface brings together the warmth and celebratory flair of Indian truck art (hand-painted typography, scalloped borders, marigold and peacock-teal accents) with the functional precision of nighttime highway navigation (retro-reflective signs, cat's-eye reflector studs, milestone markers, high-contrast dashboards).

## 2. Accessibility & Standards (WCAG 2.2 AA)
- **Severity as Road Signs:** Color is never the sole indicator of severity. Each level pairs a unique geometric road sign with distinct icons and clear text:
  - **Minor (0–25):** Blue circle information sign (`#1E78D0`).
  - **Moderate (26–50):** Yellow equilateral triangle warning sign (`#F2B705`).
  - **Severe (51–75):** Orange diamond hazard sign (`#F26A1B`).
  - **Critical (76–100):** Red octagon stop hazard sign (`#D7263D`).
- **No Reliance on Government Branding:** In strict accordance with Rule F3, no official emblems, Ashoka Chakras, or flag tri-color compositions are used. All pages feature the mandatory disclaimer:
  *"Student research project. Not an official government system. Not safety-certified."*

## 3. Two Sister Themes
- **Dhaba Dawn (Light):** Cream paper canvas (`#FFF8EC`), marigold (`#FFB300`) and vermilion (`#E8452C`) accents, indigo (`#2B2F8F`) and peacock-teal (`#00A3A3`) data elements, painted signboard heading plates.
- **Highway Night (Dark):** Deep asphalt (`#0A0C12`), cat's-eye reflector glows, illuminated milestone markers, high-contrast typography (`#F3EEE2`).

## 4. Layout Architecture
- Fluid full-width container (`w-full px-4 sm:px-6 lg:px-8 xl:px-12`) ensuring no black bars or cramped columns.
- Dedicated glass and painted plates for text over road perspective backgrounds to prevent dashed lines from overlapping copy.
- Mobile bottom milestone navigation bar with touch-friendly 44px+ hit targets.

