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
      className={`card p-3.5 bg-slate-900/90 dark:bg-slate-950/80 border border-slate-700/80 rounded-xl shadow-xs transition-all duration-200 hover:border-slate-500 ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
        <span className="truncate pr-2">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge}
          {icon && <span className="text-slate-400">{icon}</span>}
        </div>
      </div>

      <div className="flex items-baseline gap-2 my-1">
        <span className="text-2xl font-extrabold tracking-tight text-white font-mono leading-none">
          {typeof value === "number" ? <NumberTransition value={value} /> : value}
        </span>
        {change && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 transition-opacity duration-200 ${
              change.trend === "up"
                ? "text-emerald-400"
                : change.trend === "down"
                ? "text-rose-400"
                : "text-slate-400"
            }`}
          >
            {change.trend === "up" && "↑"}
            {change.trend === "down" && "↓"}
            {change.value}
            {change.label && <span className="text-slate-500 ml-0.5">({change.label})</span>}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/80">
        {subtext && <span className="truncate">{subtext}</span>}
        {dataAsOf && <span className="font-mono text-[10px] text-slate-500 ml-auto shrink-0">as of {dataAsOf}</span>}
      </div>
    </motion.div>
  );
};
