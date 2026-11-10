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

  const getColor = (sev?: string) => {
    if (colorScheme === "emerald") {
      return "#10b981"; // Clean, readable emerald green
    }
    switch (sev?.toLowerCase()) {
      case "critical":
        return "#ef4444"; // Red
      case "severe":
        return "#f59e0b"; // Amber
      case "moderate":
        return "#3b82f6"; // Blue
      default:
        return "#10b981";
    }
  };

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none select-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {sorted.map((d, index) => {
        const [x, y, w, h] = d.box;
        const isActive = activeId === d.id;
        const isDimmed = activeId !== null && !isActive;
        const color = getColor(d.severity);

        const shouldAnimate = !isReduced && index < 12;
        const delayMs = index * 25;

        // Position label above the box; if too close to top edge, place inside top of box
        const labelHeight = 2.8;
        const labelY = y < 3.5 ? y + 0.3 : y - labelHeight - 0.2;
        const labelWidth = Math.max(14, Math.min(w, 24));

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
            aria-label={`${d.label} with confidence ${(d.confidence * 100).toFixed(0)}%`}
          >
            {/* Box fill: transparent by default, subtle highlight when hovered */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={isActive ? color : "transparent"}
              fillOpacity={isActive ? 0.12 : 0}
              rx={0.3}
            />

            {/* Box Stroke: Crisp 1.5px equivalent */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill="none"
              stroke={color}
              strokeWidth={isActive ? 0.6 : 0.35}
              rx={0.3}
              style={{
                strokeDasharray: shouldAnimate ? "400" : "none",
                strokeDashoffset: shouldAnimate ? "400" : "0",
                animation: shouldAnimate
                  ? `detection-box-draw 180ms ease-out ${delayMs}ms forwards`
                  : "none",
              }}
            />

            {/* Corner Label Chip */}
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
                rx={0.3}
              />
              <text
                x={0.7}
                y={labelHeight * 0.72}
                fill="#ffffff"
                fontSize={1.7}
                fontFamily="system-ui, -apple-system, sans-serif"
                fontWeight="600"
              >
                Pothole {Math.round(d.confidence * 100)}%
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
