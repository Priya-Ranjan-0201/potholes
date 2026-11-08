import React from "react";
import { motion } from "framer-motion";
import { NumberTransition } from "../../motion/NumberTransition";
import { useReducedMotion } from "../../motion/motion";

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number | string;
    trend: "up" | "down" | "neutral";
    label?: string;
  };
  subtext?: string;
  dataAsOf?: string;
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
  dataAsOf,
  icon,
  badge,
  className = "",
  onClick,
}) => {
  const isReduced = useReducedMotion();

  return (
    <motion.div
      onClick={onClick}
      whileHover={
        isReduced
          ? undefined
          : {
              y: -2,
              transition: { duration: 0.16, ease: "easeOut" },
            }
      }
      className={`card p-4 flex flex-col justify-between transition-all duration-200 hover:border-slate-400 dark:hover:border-slate-600 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-medium text-muted mb-2">
        <span>{label}</span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <span className="text-muted">{icon}</span>}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-bold tracking-tight text-text font-mono">
          {typeof value === "number" ? <NumberTransition value={value} /> : value}
        </span>
        {change && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 transition-opacity duration-200 ${
              change.trend === "up"
                ? "text-emerald-500"
                : change.trend === "down"
                ? "text-rose-500"
                : "text-muted"
            }`}
          >
            {change.trend === "up" && "↑"}
            {change.trend === "down" && "↓"}
            {change.value}
            {change.label && <span className="text-muted ml-0.5">({change.label})</span>}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted mt-1">
        {subtext && <span>{subtext}</span>}
        {dataAsOf && <span className="font-mono text-[10px] text-faint ml-auto">as of {dataAsOf}</span>}
      </div>
    </motion.div>
  );
};
