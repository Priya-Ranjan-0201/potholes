import React from "react";
import { useReducedMotion } from "./motion";

export interface BoundingBoxItem {
  id: string;
  label: string;
  confidence: number;
  box: [number, number, number, number]; // [x%, y%, w%, h%]
  severity?: string;
  score?: number;
}

interface BoxOverlayProps {
  detections: BoundingBoxItem[];
  activeId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  className?: string;
  colorScheme?: "emerald" | "severity";
}

/**
 * Clean, Professional Bounding Box Overlay.
 * Transparent inner fill (asphalt is 100% visible), clean 1.5px border,
 * and high-contrast corner label chip.
 */
export const BoxOverlay: React.FC<BoxOverlayProps> = ({
  detections,
  activeId,
  onHover,
  onSelect,
  className = "",
  colorScheme = "emerald",
}) => {
  const isReduced = useReducedMotion();

  // Sort by confidence descending
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);

  const getDefectName = (rawLabel: string) => {
    const upper = (rawLabel || "").toUpperCase();
    if (upper.includes("ALLIGATOR") || upper.includes("CROCODILE")) return "Alligator Crack";
    if (upper.includes("LONGITUDINAL") || upper.includes("LONG")) return "Longitudinal Crack";
    if (upper.includes("TRANSVERSE") || upper.includes("TRANS")) return "Transverse Crack";
    if (upper.includes("CRACK")) return "Asphalt Crack";
    return "Pothole";
  };

  const getColor = (rawLabel: string, sev?: string) => {
    const isCrack = (rawLabel || "").toUpperCase().includes("CRACK");
    if (sev?.toLowerCase() === "critical") {
      return "#991b1b"; // Deep Crimson Red
    }
    if (isCrack) {
      return "#b45309"; // Dark Amber Bronze for cracks
    }
    if (colorScheme === "emerald") {
      return "#065f46"; // Dark, authoritative forest emerald (high-contrast, deep tone)
    }
    switch (sev?.toLowerCase()) {
      case "severe":
        return "#92400e"; // Deep Amber Bronze
      case "moderate":
        return "#1e40af"; // Deep Royal Navy
      default:
        return "#065f46";
    }
  };

  // Pre-calculate collision-free label placements
  const labelHeight = 3.1;
  const placedLabels: { x: number; y: number; w: number; h: number }[] = [];

  const items = sorted.map((d, index) => {
    const [x, y, w, h] = d.box;
    const color = getColor(d.label, d.severity);
    const defectName = getDefectName(d.label);
    const labelWidth = Math.max(defectName.length > 8 ? 22 : 16, Math.min(Math.max(w, 16), 30));

    // Candidates in smart preference order:
    // For boxes with sufficient height (h >= 6.5), inside-top keeps the tag cleanly bound within the defect
    const candidates = h >= 6.5 ? [
      { x: x + 0.4, y: y + 0.4 },                                    // Inside top-left (neatest)
      { x: x, y: y - labelHeight - 0.25 },                           // Above box
      { x: x, y: y + h + 0.25 },                                     // Below box
      { x: Math.max(0.5, x + w - labelWidth - 0.4), y: y + 0.4 },     // Inside top-right
      { x: x + 0.4, y: Math.max(0.5, y + h - labelHeight - 0.4) },   // Inside bottom-left
    ] : [
      { x: x, y: y - labelHeight - 0.25 },                           // Above box
      { x: x, y: y + h + 0.25 },                                     // Below box
      { x: x + 0.4, y: y + 0.3 },                                    // Inside top
      { x: Math.max(0.5, x + w - labelWidth), y: y - labelHeight - 0.25 }, // Above right-aligned
    ];

    // Constrain within visible viewport bounds [0.5, 99.5]
    const boundedCandidates = candidates.map((c) => ({
      x: Math.max(0.5, Math.min(100 - labelWidth - 0.5, c.x)),
      y: Math.max(0.5, Math.min(100 - labelHeight - 0.5, c.y)),
    }));

    let bestPos = boundedCandidates[0];
    let minCollisions = 999;

    for (const cand of boundedCandidates) {
      let collisions = 0;
      for (const pl of placedLabels) {
        const overlaps = !(
          cand.x + labelWidth <= pl.x ||
          cand.x >= pl.x + pl.w ||
          cand.y + labelHeight <= pl.y ||
          cand.y >= pl.y + pl.h
        );
        if (overlaps) {
          collisions++;
        }
      }
      if (collisions === 0) {
        bestPos = cand;
        minCollisions = 0;
        break;
      }
      if (collisions < minCollisions) {
        minCollisions = collisions;
        bestPos = cand;
      }
    }

    // Fallback: If still colliding, stack safely below the colliding label
    if (minCollisions > 0 && placedLabels.length > 0) {
      const last = placedLabels[placedLabels.length - 1];
      bestPos = {
        x: Math.max(0.5, Math.min(100 - labelWidth - 0.5, bestPos.x)),
        y: Math.min(96.5, last.y + labelHeight + 0.4),
      };
    }

    placedLabels.push({
      x: bestPos.x,
      y: bestPos.y,
      w: labelWidth,
      h: labelHeight,
    });

    return {
      d,
      index,
      x,
      y,
      w,
      h,
      labelX: bestPos.x,
      labelY: bestPos.y,
      labelWidth,
      labelHeight,
      color,
      defectName,
    };
  });

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <filter id="box-dark-contrast" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="0.3" stdDeviation="0.4" floodColor="#000000" floodOpacity="0.85" />
        </filter>
      </defs>
      {items.map((item) => {
        const { d, index, x, y, w, h, labelX, labelY, labelWidth, color, defectName } = item;
        const isActive = activeId === d.id;
        const isDimmed = activeId !== null && !isActive;

        const shouldAnimate = !isReduced && index < 12;
        const delayMs = index * 25;

        return (
          <g
            key={d.id}
            className="pointer-events-auto cursor-pointer transition-opacity duration-150"
            style={{ opacity: isDimmed ? 0.35 : 1 }}
            onMouseEnter={() => onHover(d.id)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onSelect(d.id)}
            role="button"
            tabIndex={0}
            filter="url(#box-dark-contrast)"
            aria-label={`${d.label} with confidence ${(d.confidence * 100).toFixed(0)}%`}
          >
            {/* Box fill: subtle dark tint over pothole, darker highlight when hovered */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={color}
              fillOpacity={isActive ? 0.28 : 0.08}
              rx={0.3}
            />

            {/* Box Stroke: Darker, bolder outline */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill="none"
              stroke={color}
              strokeWidth={isActive ? 0.95 : 0.68}
              rx={0.3}
              style={{
                strokeDasharray: shouldAnimate ? "400" : "none",
                strokeDashoffset: shouldAnimate ? "400" : "0",
                animation: shouldAnimate
                  ? `detection-box-draw 180ms ease-out ${delayMs}ms forwards`
                  : "none",
              }}
            />

            {/* Corner Label Chip: Dark, solid, crisp and collision-free */}
            <g
              transform={`translate(${labelX}, ${labelY})`}
              style={{
                opacity: shouldAnimate ? 0 : 1,
                animation: shouldAnimate
                  ? `fade-in 120ms ease-out ${delayMs + 60}ms forwards`
                  : "none",
              }}
            >
              <rect
                x={0}
                y={0}
                width={labelWidth}
                height={labelHeight}
                fill={color}
                stroke="#000000"
                strokeWidth={0.2}
                rx={0.4}
              />
              <text
                x={0.8}
                y={labelHeight * 0.70}
                fill="#ffffff"
                fontSize={1.7}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="700"
                letterSpacing="0.01em"
              >
                {defectName} {Math.round(d.confidence * 100)}%
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
