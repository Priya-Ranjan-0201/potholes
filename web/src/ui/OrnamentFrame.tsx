import React from "react";

interface OrnamentFrameProps {
  children?: React.ReactNode;
  variant?: "scallop" | "bumperChevron" | "jaaliDivider" | "cornerFlourish";
  className?: string;
  accentColor?: string;
}

export const OrnamentFrame: React.FC<OrnamentFrameProps> = ({
  children,
  variant = "scallop",
  className = "",
  accentColor = "#FFB300",
}) => {
  if (variant === "bumperChevron") {
    // Truck rear bumper reflective chevron band
    return (
      <div className={`w-full overflow-hidden rounded-md h-3.5 my-2 ${className}`}>
        <svg width="100%" height="14" preserveAspectRatio="repeat-x" className="w-full h-full">
          <defs>
            <pattern id="truckChevron" width="24" height="14" patternUnits="userSpaceOnUse">
              <polygon points="0,0 8,0 16,14 8,14" fill="#FFB300" />
              <polygon points="8,0 16,0 24,14 16,14" fill="#E8452C" />
              <polygon points="16,0 24,0 32,14 24,14" fill="#1B1308" />
            </pattern>
          </defs>
          <rect width="100%" height="14" fill="url(#truckChevron)" />
        </svg>
      </div>
    );
  }

  if (variant === "jaaliDivider") {
    // Abstract geometric jaali screen lattice pattern divider
    return (
      <div className={`w-full flex items-center gap-3 my-4 ${className}`}>
        <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-[#EBD9B8] dark:via-amber-400/30 to-transparent" />
        <div className="flex items-center gap-1.5 opacity-80">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="8" y="1" width="7" height="7" transform="rotate(45 8 1)" stroke={accentColor} strokeWidth="1.5" />
            <circle cx="8" cy="8" r="2" fill="#E8452C" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="4" stroke="#00A3A3" strokeWidth="1.5" />
          </svg>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="8" y="1" width="7" height="7" transform="rotate(45 8 1)" stroke={accentColor} strokeWidth="1.5" />
            <circle cx="8" cy="8" r="2" fill="#E8452C" />
          </svg>
        </div>
        <div className="h-0.5 flex-1 bg-gradient-to-r from-transparent via-[#EBD9B8] dark:via-amber-400/30 to-transparent" />
      </div>
    );
  }

  if (variant === "cornerFlourish") {
    // Card with 4 original geometric truck-art corner flourishes
    return (
      <div className={`relative p-5 rounded-xl border border-[#EBD9B8] dark:border-amber-400/25 bg-white/95 dark:bg-[#141926]/90 shadow-sm ${className}`}>
        {/* Top Left Flourish */}
        <svg className="absolute top-1.5 left-1.5 w-4 h-4 text-amber-500 opacity-80" viewBox="0 0 20 20" fill="currentColor">
          <path d="M0,0 L12,0 C6,2 2,6 0,12 Z" />
        </svg>
        {/* Top Right Flourish */}
        <svg className="absolute top-1.5 right-1.5 w-4 h-4 text-amber-500 opacity-80" viewBox="0 0 20 20" fill="currentColor">
          <path d="M20,0 L8,0 C14,2 18,6 20,12 Z" />
        </svg>
        {/* Bottom Left Flourish */}
        <svg className="absolute bottom-1.5 left-1.5 w-4 h-4 text-amber-500 opacity-80" viewBox="0 0 20 20" fill="currentColor">
          <path d="M0,20 L12,20 C6,18 2,14 0,8 Z" />
        </svg>
        {/* Bottom Right Flourish */}
        <svg className="absolute bottom-1.5 right-1.5 w-4 h-4 text-amber-500 opacity-80" viewBox="0 0 20 20" fill="currentColor">
          <path d="M20,20 L8,20 C14,18 18,14 20,8 Z" />
        </svg>
        {children}
      </div>
    );
  }

  // Scalloped Garland Border
  return (
    <div className={`relative overflow-hidden rounded-xl border-2 border-[#EBD9B8] dark:border-amber-400/30 ${className}`}>
      {/* Top Scalloped Garland Wave */}
      <div className="w-full h-2 bg-repeat-x opacity-90" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='8' viewBox='0 0 16 8'%3E%3Cpath d='M0,0 Q4,8 8,0 Q12,8 16,0 Z' fill='%23FFB300' /%3E%3C/svg%3E")`,
        backgroundSize: "16px 8px",
      }} />
      <div className="p-4">{children}</div>
    </div>
  );
};
