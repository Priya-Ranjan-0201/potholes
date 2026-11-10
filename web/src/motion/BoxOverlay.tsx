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
      {sorted.map((d, index) => {
        const [x, y, w, h] = d.box;
        const isActive = activeId === d.id;
        const isDimmed = activeId !== null && !isActive;
        const color = getColor(d.label, d.severity);
        const defectName = getDefectName(d.label);

        const shouldAnimate = !isReduced && index < 12;
        const delayMs = index * 25;

        // Position label above the box; if too close to top edge, place inside top of box
        const labelHeight = 3.0;
        const labelY = y < 3.8 ? y + 0.4 : y - labelHeight - 0.2;
        const labelWidth = Math.max(defectName.length > 8 ? 22 : 16, Math.min(w, 32));

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

            {/* Corner Label Chip: Dark, solid, crisp */}
            <g
              transform={`translate(${x}, ${labelY})`}
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
                strokeWidth={0.15}
                rx={0.3}
              />
              <text
                x={0.8}
                y={labelHeight * 0.72}
                fill="#ffffff"
                fontSize={1.75}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="700"
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
