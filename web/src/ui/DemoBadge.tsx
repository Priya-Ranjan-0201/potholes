import React from "react";

interface DemoBadgeProps {
  className?: string;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ className = "" }) => {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 ${className}`}
      title="Live PostgreSQL & GIS Connection"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span>LIVE</span>
    </div>
  );
};

