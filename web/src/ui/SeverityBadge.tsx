import React from "react";
import { SeverityLevel, getSeveritySign } from "./tokens";
import { Sign } from "./Sign";

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
  const cfg = getSeveritySign(score !== undefined ? score : (level || "Moderate"));

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3.5 py-1.5 text-sm gap-2",
  }[size];

  return (
    <span
      role="status"
      aria-label={`Severity level: ${cfg.level}, SLA: ${cfg.slaHours} hours`}
      className={`inline-flex items-center font-bold rounded-lg border shadow-xs transition-transform hover:scale-[1.02] ${sizeStyles} ${className}`}
      style={{
        backgroundColor: `${cfg.color}18`, // 10% tint
        borderColor: `${cfg.color}66`,     // 40% border
        color: cfg.color,
      }}
      title={`${cfg.label} — ${cfg.description} (Target SLA: ${cfg.slaHours}h)`}
    >
      <Sign level={cfg.level} size={size === "lg" ? "md" : "sm"} showIconOnly />
      <span className="font-extrabold uppercase tracking-wide">{cfg.level}</span>
      {showScore && score !== undefined && (
        <span
          className="font-mono text-[10px] px-1 py-0.2 rounded font-black ml-0.5"
          style={{
            backgroundColor: cfg.color,
            color: cfg.textColor,
          }}
        >
          {Math.round(score)}
        </span>
      )}
    </span>
  );
};

