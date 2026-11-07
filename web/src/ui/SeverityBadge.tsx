import React from "react";
import { SEVERITY_COLORS, SeverityLevel, getSeverityFromScore } from "./tokens";

interface SeverityBadgeProps {
  score?: number;
  level?: SeverityLevel | string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  className?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  score,
  level,
  size = "md",
  showScore = true,
  className = "",
}) => {
  const resolvedLevel: SeverityLevel =
    score !== undefined
      ? getSeverityFromScore(score)
      : (level as SeverityLevel) in SEVERITY_COLORS
      ? (level as SeverityLevel)
      : "Minor";

  const color = SEVERITY_COLORS[resolvedLevel];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1.5",
    md: "px-2.5 py-0.5 text-xs gap-1.5",
    lg: "px-3 py-1 text-sm gap-2",
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${sizeClasses} ${className}`}
      style={{
        backgroundColor: `${color}12`,
        borderColor: `${color}40`,
        color: color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="font-semibold">{resolvedLevel}</span>
      {showScore && score !== undefined && (
        <span className="font-mono text-[10px] opacity-80">
          ({Math.round(score)})
        </span>
      )}
    </span>
  );
};
