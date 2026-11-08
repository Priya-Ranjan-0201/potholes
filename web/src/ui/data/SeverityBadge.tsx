import React from "react";

export type SeverityLevel = "Minor" | "Moderate" | "Severe" | "Critical";

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  Minor: "#0EA5A4",
  Moderate: "#D97706",
  Severe: "#EA580C",
  Critical: "#DC2626",
};

export function getSeverityFromScore(score: number): SeverityLevel {
  if (score >= 75) return "Critical";
  if (score >= 50) return "Severe";
  if (score >= 25) return "Moderate";
  return "Minor";
}

interface SeverityBadgeProps {
  score?: number;
  level?: SeverityLevel | string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  className?: string;
}

/**
 * Road-Sign Severity Badge (SPEC v12).
 * Combines physical road-sign shape + icon + text (never color alone).
 * - Minor: Round / Circle (#0EA5A4)
 * - Moderate: Warning Triangle (#D97706)
 * - Severe: Yield Diamond (#EA580C)
 * - Critical: Hazard Octagon (#DC2626)
 */
export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  score,
  level,
  size = "md",
  showScore = true,
  className = "",
}) => {
  const normalizeLevel = (lvl?: string): SeverityLevel => {
    if (!lvl) return "Minor";
    const lower = lvl.toLowerCase();
    if (lower === "critical") return "Critical";
    if (lower === "severe") return "Severe";
    if (lower === "moderate") return "Moderate";
    return "Minor";
  };

  const resolvedLevel: SeverityLevel =
    score !== undefined ? getSeverityFromScore(score) : normalizeLevel(level);

  const color = SEVERITY_COLORS[resolvedLevel];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    md: "px-2.5 py-0.5 text-xs gap-1.5",
    lg: "px-3 py-1 text-sm gap-2",
  }[size];

  // Road-sign shape SVGs
  const renderShapeIcon = () => {
    switch (resolvedLevel) {
      case "Minor":
        // Circle / Round
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
            <circle cx="8" cy="8" r="2" fill={color} />
          </svg>
        );
      case "Moderate":
        // Warning Triangle
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
              d="M8 2L14.5 13.5H1.5L8 2Z"
              fill={color}
              fillOpacity="0.2"
              stroke={color}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <line x1="8" y1="6" x2="8" y2="9.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="8" cy="11.5" r="0.75" fill={color} />
          </svg>
        );
      case "Severe":
        // Warning Diamond
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect
              x="8"
              y="1"
              width="9.5"
              height="9.5"
              rx="1.5"
              transform="rotate(45 8 1)"
              fill={color}
              fillOpacity="0.2"
              stroke={color}
              strokeWidth="1.8"
            />
            <path d="M8 5V9M8 11H8.01" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
      case "Critical":
        // Hazard Octagon
        return (
          <svg className="w-3 h-3 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <polygon
              points="5,2 11,2 14,5 14,11 11,14 5,14 2,11 2,5"
              fill={color}
              fillOpacity="0.2"
              stroke={color}
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${sizeClasses} ${className}`}
      style={{
        backgroundColor: `${color}14`,
        borderColor: `${color}40`,
        color: color,
      }}
    >
      {renderShapeIcon()}
      <span className="font-semibold">{resolvedLevel}</span>
      {showScore && score !== undefined && (
        <span className="font-mono text-[10px] opacity-80">
          ({Math.round(score)})
        </span>
      )}
    </span>
  );
};
