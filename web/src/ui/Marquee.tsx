import React, { useState } from "react";
import { isReducedMotion } from "./motion";

interface MarqueeProps {
  items: string[];
  speedSeconds?: number;
  className?: string;
}

export const Marquee: React.FC<MarqueeProps> = ({
  items,
  speedSeconds = 25,
  className = "",
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const reduced = isReducedMotion();

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Live Road Telemetry Ticker"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`w-full overflow-hidden whitespace-nowrap bg-stone-900/90 text-amber-300 border-y border-amber-500/30 py-1.5 px-4 text-xs font-mono select-none relative flex items-center ${className}`}
    >
      <div className="flex items-center gap-2 pr-4 shrink-0 font-black uppercase text-[10px] text-amber-500 border-r border-amber-500/40 mr-4">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
        <span>LIVE HIGHWAY TICKER</span>
      </div>

      <div
        className="flex items-center gap-8 shrink-0 animate-marquee"
        style={{
          animationDuration: `${speedSeconds}s`,
          animationPlayState: isPaused || reduced ? "paused" : "running",
        }}
      >
        {items.concat(items).map((text, idx) => (
          <span key={idx} className="inline-flex items-center gap-2">
            <span>{text}</span>
            <span className="text-stone-600 font-bold">•</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
};

