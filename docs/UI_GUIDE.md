# ScamRoad Component & UI Guide (v8: "Truck Art Meets Night Highway")

## 1. Design System Structure (`web/src/ui/`)
- `tokens.ts`: Canonical color values, severity levels, and road sign definitions.
- `motion.ts`: Motion timing constants, spring curves, and reduced-motion checks.
- `Sign.tsx`: Traffic sign SVG shapes (Circle, Triangle, Diamond, Octagon).
- `SeverityBadge.tsx`: Combined sign badge with shape, icon, text, and numerical score.
- `Plate.tsx`: Dhaba painted signboard heading plate with painted border and tilt.
- `MilestoneHeader.tsx`: Kilometre-stone header and breadcrumbs ("KM 00 · Overview").
- `OrnamentFrame.tsx`: Reusable truck-art ornament frames (scallop, bumperChevron, jaaliDivider).
- `CatsEye.tsx`: Tiny reflector dots with CSS hover/focus glow.
- `RoadLoader.tsx`: Progress bar with moving lane markings and vehicle silhouettes.
- `EmptyState.tsx`: Friendly "Gaddha" crater mascot for empty/no-results states.

## 2. Usage Examples

### Severity Sign Badge
```tsx
import { SeverityBadge } from "../ui";

// Automatic shape & color resolution
<SeverityBadge score={82} size="md" /> // Renders Octagon "Critical 82"
<SeverityBadge level="Moderate" />     // Renders Triangle "Moderate"
```

### Dhaba Signboard Heading Plate
```tsx
import { Plate } from "../ui";

<Plate tilt="left" color="marigold" subtitle="National Highway 44 Division">
  <span>Ward Hotspot Grid</span>
</Plate>
```

### Kilometre Stone Breadcrumbs
```tsx
import { MilestoneHeader } from "../ui";

<MilestoneHeader km="01" title="AI Road Scanner" highway="NH-44" variant="yellow" />
```
