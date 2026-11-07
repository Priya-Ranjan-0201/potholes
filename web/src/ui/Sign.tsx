import React from "react";
import { SeverityLevel, SEVERITY_SIGNS } from "./tokens";

interface SignProps {
  level: SeverityLevel | string | number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showIconOnly?: boolean;
}

export const Sign: React.FC<SignProps> = ({
  level,
  size = "md",
  className = "",
  showIconOnly = false,
}) => {
  const normLevel: SeverityLevel =
    typeof level === "number"
      ? level >= 76
        ? "Critical"
        : level >= 51
        ? "Severe"
        : level >= 26
        ? "Moderate"
        : "Minor"
      : (level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()) as SeverityLevel;

  const cfg = SEVERITY_SIGNS[normLevel] || SEVERITY_SIGNS.Moderate;

  const dims = {
    sm: { box: 20, stroke: 1.5, text: "text-[10px]" },
    md: { box: 28, stroke: 2, text: "text-xs" },
    lg: { box: 40, stroke: 2.5, text: "text-sm" },
  }[size];

  // Render SVG Shape according to road sign geometry (Rule 2.1)
  const renderShape = () => {
    switch (cfg.shape) {
      case "circle": // Minor Info Sign
        return (
          <svg
            width={dims.box}
            height={dims.box}
            viewBox="0 0 32 32"
            fill="none"
            className="shrink-0 drop-shadow-xs"
            aria-hidden="true"
          >
            <circle cx="16" cy="16" r="14" fill={cfg.color} stroke={cfg.borderColor} strokeWidth={dims.stroke} />
            <circle cx="16" cy="16" r="12" stroke="#FFFFFF" strokeWidth="1" strokeOpacity="0.4" />
            <circle cx="16" cy="11" r="1.75" fill="#FFFFFF" />
            <rect x="14.5" y="15" width="3" height="7" rx="1.5" fill="#FFFFFF" />
          </svg>
        );

      case "triangle": // Moderate Warning Sign
        return (
          <svg
            width={dims.box}
            height={dims.box}
            viewBox="0 0 32 32"
            fill="none"
            className="shrink-0 drop-shadow-xs"
            aria-hidden="true"
          >
            <polygon
              points="16,3 30,28 2,28"
              fill={cfg.color}
              stroke={cfg.borderColor}
              strokeWidth={dims.stroke}
              strokeLinejoin="round"
            />
            <polygon
              points="16,7 26,26 6,26"
              stroke="#1A1200"
              strokeWidth="1.2"
              fill="none"
              strokeOpacity="0.3"
            />
            {/* Exclamation Mark */}
            <line x1="16" y1="12" x2="16" y2="19" stroke={cfg.textColor} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="23.5" r="1.5" fill={cfg.textColor} />
          </svg>
        );

      case "diamond": // Severe Hazard Sign
        return (
          <svg
            width={dims.box}
            height={dims.box}
            viewBox="0 0 32 32"
            fill="none"
            className="shrink-0 drop-shadow-xs"
            aria-hidden="true"
          >
            <polygon
              points="16,2 30,16 16,30 2,16"
              fill={cfg.color}
              stroke={cfg.borderColor}
              strokeWidth={dims.stroke}
              strokeLinejoin="round"
            />
            <polygon
              points="16,5 27,16 16,27 5,16"
              stroke="#FFFFFF"
              strokeWidth="1"
              fill="none"
              strokeOpacity="0.4"
            />
            {/* Alert Cross/Bang */}
            <line x1="16" y1="10" x2="16" y2="18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="16" cy="22" r="1.5" fill="#FFFFFF" />
          </svg>
        );

      case "octagon": // Critical Stop Hazard Sign
        return (
          <svg
            width={dims.box}
            height={dims.box}
            viewBox="0 0 32 32"
            fill="none"
            className="shrink-0 drop-shadow-xs"
            aria-hidden="true"
          >
            <polygon
              points="10,2 22,2 30,10 30,22 22,30 10,30 2,22 2,10"
              fill={cfg.color}
              stroke={cfg.borderColor}
              strokeWidth={dims.stroke}
              strokeLinejoin="round"
            />
            <polygon
              points="11,4 21,4 28,11 28,21 21,28 11,28 4,21 4,11"
              stroke="#FFFFFF"
              strokeWidth="1"
              fill="none"
              strokeOpacity="0.6"
            />
            {/* Stop Bar */}
            <rect x="8" y="14" width="16" height="4" rx="1" fill="#FFFFFF" />
          </svg>
        );
    }
  };

  if (showIconOnly) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`} title={`${cfg.label} (${cfg.rangeText})`}>
        {renderShape()}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold ${dims.text} ${className}`}
      style={{ color: cfg.color }}
      title={`${cfg.label}: ${cfg.description} (SLA: ${cfg.slaHours}h)`}
    >
      {renderShape()}
      <span className="leading-tight">{cfg.label}</span>
    </span>
  );
};

