import React from "react";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  showWordmark = false,
  size = "md",
}) => {
  const dim = size === "sm" ? 32 : size === "lg" ? 52 : 40;

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Stylised road in perspective forming an "S" with glowing scan-ping dot */}
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-xl shadow-md transition-transform hover:scale-105 duration-200 border border-amber-500/30"
      >
        <defs>
          <linearGradient id="roadGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1B1308" />
            <stop offset="100%" stopColor="#0A0C12" />
          </linearGradient>
          <linearGradient id="truckGlow" x1="12" y1="12" x2="52" y2="52" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFB300" />
            <stop offset="50%" stopColor="#E8452C" />
            <stop offset="100%" stopColor="#00D1D1" />
          </linearGradient>
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Base Asphalt Surface */}
        <rect width="64" height="64" rx="16" fill="url(#roadGrad)" />
        <rect width="64" height="64" rx="16" stroke="rgba(255,179,0,0.3)" strokeWidth="1.5" />

        {/* Perspective Road Surface forming an "S" curve */}
        <path
          d="M 48 14 C 32 14 20 22 20 30 C 20 38 44 38 44 48 C 44 54 36 54 22 54"
          stroke="url(#truckGlow)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-95"
        />

        {/* Dashed Center Marking */}
        <path
          d="M 48 14 C 32 14 20 22 20 30 C 20 38 44 38 44 48 C 44 54 36 54 22 54"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeDasharray="4 4"
          strokeLinecap="round"
        />

        {/* Glowing Neural Scan-Ping Dot at the apex */}
        <circle cx="20" cy="30" r="5" fill="#00D1D1" filter="url(#glowFilter)" />
        <circle cx="20" cy="30" r="2.5" fill="#FFFFFF" />

        {/* Second Ping Dot near exit */}
        <circle cx="44" cy="48" r="4" fill="#FFB300" filter="url(#glowFilter)" />
        <circle cx="44" cy="48" r="2" fill="#FFFFFF" />
      </svg>

      {showWordmark && (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-xl text-stone-900 dark:text-white tracking-tight font-signboard">
              Scam<span className="text-amber-500">Road</span>
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40">
              NH-44
            </span>
          </div>
          <span className="text-[10px] block text-stone-500 dark:text-stone-400 font-bold tracking-wider uppercase -mt-0.5 font-mono">
            Edge AI Road Defect Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
