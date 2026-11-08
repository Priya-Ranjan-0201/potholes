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
}

/**
 * Scanner S2 "detection-draw" & S3 "box-list linking".
 * Draws bounding boxes with stroke-dashoffset (200ms) in confidence order.
 * Dims non-hovered boxes to 40% and highlights corresponding list item.
 */
export const BoxOverlay: React.FC<BoxOverlayProps> = ({
  detections,
  activeId,
  onHover,
  onSelect,
  className = "",
}) => {
  const isReduced = useReducedMotion();

  // Sort by confidence descending to draw highest confidence first
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);

  const getSeverityColor = (sev?: string) => {
    switch (sev?.toLowerCase()) {
      case "critical":
        return "#EF4444"; // Red
      case "severe":
        return "#F97316"; // Orange
      case "moderate":
        return "#F59E0B"; // Amber
      default:
        return "#3B82F6"; // Blue
    }
  };

  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        {sorted.map((d) => {
          const color = getSeverityColor(d.severity);
          return (
            <linearGradient key={`grad-${d.id}`} id={`grad-${d.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          );
        })}
      </defs>

      {sorted.map((d, index) => {
        const [x, y, w, h] = d.box;
        const isActive = activeId === d.id;
        const isDimmed = activeId !== null && !isActive;
        const color = getSeverityColor(d.severity);

        // Cap animation at first 10 items
        const shouldAnimate = !isReduced && index < 10;
        const delayMs = index * 30; // 30ms stagger

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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(d.id);
              }
            }}
          >
            {/* Box Fill */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={`url(#grad-${d.id})`}
              rx={0.5}
            />

            {/* Box Stroke (with stroke-dashoffset draw on appearance) */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill="none"
              stroke={color}
              strokeWidth={isActive ? 0.75 : 0.45}
              rx={0.5}
              style={{
                strokeDasharray: shouldAnimate ? "400" : "none",
                strokeDashoffset: shouldAnimate ? "400" : "0",
                animation: shouldAnimate
                  ? `detection-box-draw 200ms cubic-bezier(0, 0, 0.2, 1) ${delayMs}ms forwards`
                  : "none",
              }}
            />

            {/* Top Label Tag */}
            <g
              transform={`translate(${x}, ${Math.max(2, y - 0.5)})`}
              style={{
                opacity: shouldAnimate ? 0 : 1,
                animation: shouldAnimate
                  ? `fade-in 150ms ease-out ${delayMs + 100}ms forwards`
                  : "none",
              }}
            >
              <rect
                x={0}
                y={-3.2}
                width={Math.max(w * 0.9, 14)}
                height={3.4}
                fill="#0F172A"
                fillOpacity={0.9}
                stroke={color}
                strokeWidth={0.2}
                rx={0.4}
              />
              <text
                x={0.8}
                y={-1.0}
                fill="#FFFFFF"
                fontSize={2.0}
                fontFamily="monospace"
                fontWeight="bold"
              >
                {d.label.slice(0, 10)} {(d.confidence * 100).toFixed(0)}%
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
