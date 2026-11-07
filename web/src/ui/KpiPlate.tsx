import React from "react";

interface KpiPlateProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  variant?: "default" | "critical" | "warning" | "success" | "accent";
  className?: string;
  onClick?: () => void;
}

export const KpiPlate: React.FC<KpiPlateProps> = ({
  label,
  value,
  subtext,
  icon,
  badge,
  variant = "default",
  className = "",
  onClick,
}) => {
  const variantStyles = {
    default: "border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/80 hover:border-amber-500/50",
    critical: "border-red-500/40 bg-red-500/[0.04] dark:bg-red-950/20 hover:border-red-500/70",
    warning: "border-amber-500/40 bg-amber-500/[0.04] dark:bg-amber-950/20 hover:border-amber-500/70",
    success: "border-emerald-500/40 bg-emerald-500/[0.04] dark:bg-emerald-950/20 hover:border-emerald-500/70",
    accent: "border-purple-500/40 bg-purple-500/[0.04] dark:bg-purple-950/20 hover:border-purple-500/70",
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`dhaba-card p-5 flex flex-col justify-between min-h-[142px] relative overflow-hidden transition-all duration-200 ${variantStyles} ${
        onClick ? "cursor-pointer active:scale-98" : ""
      } ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider font-mono text-stone-500 dark:text-stone-400">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-stone-100 dark:bg-stone-800/80 shadow-xs shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric & Subtext */}
      <div className="mt-3">
        <div className="flex items-baseline gap-2.5">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-stone-900 dark:text-stone-100">
            {value}
          </span>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {subtext && (
          <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block truncate font-medium">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
