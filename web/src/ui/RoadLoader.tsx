import React from "react";

interface RoadLoaderProps {
  progress?: number; // 0 to 100, if omitted runs infinite scanning animation
  vehicle?: "truck" | "auto";
  label?: string;
  className?: string;
}

export const RoadLoader: React.FC<RoadLoaderProps> = ({
  progress,
  vehicle = "truck",
  label = "Scanning Highway...",
  className = "",
}) => {
  const isIndeterminate = progress === undefined;
  const clampedProgress = isIndeterminate ? 65 : Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-amber-300">
          <span className="flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            {label}
          </span>
          {!isIndeterminate && (
            <span className="font-mono font-black">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}

      {/* Road Track with Moving Dashed Markings */}
      <div className="relative h-10 w-full bg-stone-900 rounded-lg overflow-hidden border border-stone-700 shadow-inner flex items-center">
        {/* Curbs / Road Shoulders */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-stone-400 to-amber-500 opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-stone-400 to-amber-500 opacity-60" />

        {/* Center Dashed Lane Marking with SVG Animation */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 1000 40"
        >
          <line
            x1="0"
            y1="20"
            x2="1000"
            y2="20"
            stroke="#FFB300"
            strokeWidth="2.5"
            strokeDasharray="20 16"
            className="road-lane-animated"
          />
        </svg>

        {/* Vehicle Silhouette positioned by progress */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 ${
            isIndeterminate ? "animate-pulse" : ""
          }`}
          style={{
            left: `calc(${clampedProgress}% - 24px)`,
          }}
        >
          {vehicle === "truck" ? (
            // Hand-crafted Indian Highway Truck Silhouette SVG
            <svg
              width="44"
              height="24"
              viewBox="0 0 44 24"
              fill="none"
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              {/* Truck Cargo Body */}
              <rect x="2" y="4" width="24" height="13" rx="2" fill="#E8452C" stroke="#FFB300" strokeWidth="1" />
              {/* Truck Cabin */}
              <path d="M26,8 L36,8 L40,13 L40,17 L26,17 Z" fill="#2B2F8F" stroke="#FFB300" strokeWidth="1" />
              {/* Cabin Windshield */}
              <polygon points="31,9 35,9 38,13 31,13" fill="#00D1D1" opacity="0.9" />
              {/* Headlight beam */}
              <polygon points="40,14 44,12 44,18 40,16" fill="#FFF7CC" opacity="0.8" />
              {/* Wheels */}
              <circle cx="8" cy="18" r="3.5" fill="#141926" stroke="#F7C61B" strokeWidth="1" />
              <circle cx="20" cy="18" r="3.5" fill="#141926" stroke="#F7C61B" strokeWidth="1" />
              <circle cx="34" cy="18" r="3.5" fill="#141926" stroke="#F7C61B" strokeWidth="1" />
            </svg>
          ) : (
            // Auto-Rickshaw Silhouette SVG
            <svg
              width="36"
              height="24"
              viewBox="0 0 36 24"
              fill="none"
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            >
              {/* Yellow Top Canopy */}
              <path d="M6,6 Q18,3 30,7 L30,12 L6,12 Z" fill="#FFB300" stroke="#1B1308" strokeWidth="1" />
              {/* Green Base */}
              <rect x="6" y="12" width="24" height="6" fill="#2FA66A" />
              {/* Front Wheel */}
              <circle cx="28" cy="19" r="3" fill="#141926" stroke="#FFB300" strokeWidth="1" />
              {/* Rear Wheel */}
              <circle cx="10" cy="19" r="3" fill="#141926" stroke="#FFB300" strokeWidth="1" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
};

