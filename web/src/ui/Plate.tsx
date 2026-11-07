import React from "react";

interface PlateProps {
  children: React.ReactNode;
  subtitle?: React.ReactNode;
  tilt?: "none" | "left" | "right";
  color?: "default" | "marigold" | "vermilion" | "peacock";
  className?: string;
  badge?: React.ReactNode;
}

export const Plate: React.FC<PlateProps> = ({
  children,
  subtitle,
  tilt = "none",
  color = "default",
  className = "",
  badge,
}) => {
  const tiltClass = {
    none: "",
    left: "-rotate-1 hover:rotate-0 transition-transform duration-200",
    right: "rotate-1 hover:rotate-0 transition-transform duration-200",
  }[tilt];

  const colorStyles = {
    default: "bg-[#FFF0D6] dark:bg-[#141926] border-[#1B1308] dark:border-[#FFB300] text-[#1B1308] dark:text-[#F3EEE2]",
    marigold: "bg-amber-100 dark:bg-amber-950/70 border-amber-600 dark:border-amber-400 text-amber-950 dark:text-amber-100",
    vermilion: "bg-red-100 dark:bg-red-950/70 border-red-600 dark:border-red-400 text-red-950 dark:text-red-100",
    peacock: "bg-teal-100 dark:bg-teal-950/70 border-teal-600 dark:border-teal-400 text-teal-950 dark:text-teal-100",
  }[color];

  return (
    <div
      className={`relative inline-flex flex-col px-4 py-2 rounded-md border-2 shadow-[3px_3px_0px_0px_rgba(27,19,8,0.85)] dark:shadow-[3px_3px_0px_0px_rgba(255,179,0,0.5)] ${tiltClass} ${colorStyles} ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="font-black tracking-tight text-base sm:text-lg flex items-center gap-2">
          {children}
        </div>
        {badge && <div className="ml-auto">{badge}</div>}
      </div>
      {subtitle && (
        <span className="text-[11px] font-bold opacity-80 mt-0.5 tracking-normal">
          {subtitle}
        </span>
      )}
    </div>
  );
};

