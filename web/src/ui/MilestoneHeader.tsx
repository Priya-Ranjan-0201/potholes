import React from "react";
import { Link } from "react-router-dom";

interface MilestoneHeaderProps {
  km: string | number;
  title: string;
  subtitle?: string;
  highway?: string; // e.g. "NH-44" or "SH-1"
  variant?: "yellow" | "green";
  linkTo?: string;
  className?: string;
}

export const MilestoneHeader: React.FC<MilestoneHeaderProps> = ({
  km,
  title,
  subtitle,
  highway = "NH-44",
  variant = "yellow",
  linkTo,
  className = "",
}) => {
  const content = (
    <div
      className={`inline-flex items-stretch rounded-t-2xl rounded-b-lg border-2 border-stone-800 dark:border-amber-400/80 shadow-md overflow-hidden bg-white dark:bg-stone-900 group transition-all duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {/* Top Cap / Left Milestone Head */}
      <div
        className={`px-3 py-2 flex flex-col items-center justify-center min-w-[58px] border-r-2 border-stone-800 dark:border-amber-400/80 ${
          variant === "yellow"
            ? "bg-gradient-to-b from-amber-400 to-amber-500 text-stone-950 font-black"
            : "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white font-black"
        }`}
      >
        <span className="text-[9px] uppercase tracking-wider font-extrabold opacity-90">{highway}</span>
        <span className="text-xs font-mono font-black tracking-tight leading-none mt-0.5">
          KM {typeof km === "number" && km < 10 ? `0${km}` : km}
        </span>
      </div>

      {/* Place / Route Destination Title */}
      <div className="px-3.5 py-1.5 flex flex-col justify-center">
        <span className="font-black text-xs sm:text-sm text-stone-900 dark:text-stone-100 uppercase tracking-wide group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {title}
        </span>
        {subtitle && (
          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-semibold truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};
