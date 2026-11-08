import React from "react";
import { NumberTransition } from "../motion/NumberTransition";

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number | string;
    trend: "up" | "down" | "neutral";
    label?: string;
  };
  subtext?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  subtext,
  icon,
  badge,
  className = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`card p-4 flex flex-col justify-between transition-colors ${onClick ? "cursor-pointer hover:border-slate-400 dark:hover:border-slate-600" : ""
        } ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
        <span>{label}</span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
          {typeof value === "number" ? <NumberTransition value={value} /> : value}
        </span>
        {change && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 transition-opacity duration-200 ${change.trend === "up"
              ? "text-emerald-600 dark:text-emerald-400"
              : change.trend === "down"
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400"
              }`}
          >
            {change.trend === "up" && "↑"}
            {change.trend === "down" && "↓"}
            {change.value}
            {change.label && <span className="text-slate-400 dark:text-slate-500 ml-0.5">({change.label})</span>}
          </span>
        )}
      </div>

      {subtext && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          {subtext}
        </div>
      )}
    </div>
  );
};
