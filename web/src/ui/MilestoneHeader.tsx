import React from "react";
import { Link } from "react-router-dom";

interface MilestoneHeaderProps {
  km?: string | number;
  tag?: string;
  title: string;
  subtitle?: string;
  highway?: string; // e.g. "NH-44" or "SH-1"
  variant?: "yellow" | "green" | "blue" | "neutral";
  linkTo?: string;
  className?: string;
}

export const MilestoneHeader: React.FC<MilestoneHeaderProps> = ({
  km,
  tag,
  title,
  subtitle,
  highway = "NH-44",
  variant = "yellow",
  linkTo,
  className = "",
}) => {
  const badgeLabel = tag || (km ? `${highway} · KM ${typeof km === "number" && km < 10 ? `0${km}` : km}` : null);

  const badgeStyle = {
    yellow: "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30",
    green: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    blue: "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30",
    neutral: "bg-stone-500/15 text-stone-800 dark:text-stone-300 border-stone-500/30",
  }[variant];

  const content = (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 ${className}`}>
      {badgeLabel && (
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider font-mono border ${badgeStyle}`}
          >
            {badgeLabel}
          </span>
        </div>
      )}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 font-signboard tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo} className="hover:opacity-90 transition">{content}</Link>;
  }

  return content;
};
