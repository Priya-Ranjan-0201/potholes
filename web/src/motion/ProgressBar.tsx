import React from "react";
import { useReducedMotion } from "./motion";

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  statusText?: string;
  className?: string;
  variant?: "primary" | "warning" | "success";
}

/**
 * Truthful Progress Bar.
 * Strictly mirrors real upload bytes or job percentage.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  statusText,
  className = "",
  variant = "primary",
}) => {
  const isReduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, progress));

  const colorMap = {
    primary: "bg-blue-600 dark:bg-blue-500",
    warning: "bg-amber-500 dark:bg-amber-400",
    success: "bg-emerald-600 dark:bg-emerald-500",
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || statusText) && (
        <div className="flex justify-between items-center text-xs font-mono">
          {label && <span className="text-slate-600 dark:text-slate-300">{label}</span>}
          {statusText && <span className="text-slate-500 dark:text-slate-400">{statusText}</span>}
        </div>
      )}
      <div
        className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full ${colorMap[variant]} ${
            isReduced ? "" : "transition-all duration-150 ease-out"
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
