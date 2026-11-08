import React from "react";
import { useReducedMotion } from "./motion";

interface ScanLineProps {
  isScanning: boolean;
  stage?: "preprocess" | "inference" | "postprocess" | "idle";
  className?: string;
}

/**
 * Scanner S1 "scan-line".
 * Active only during real AI inference.
 * Thin horizontal line sweeps top to bottom; stops immediately when results arrive.
 */
export const ScanLine: React.FC<ScanLineProps> = ({
  isScanning,
  stage = "inference",
  className = "",
}) => {
  const isReduced = useReducedMotion();

  if (!isScanning) return null;

  // Speed tied to inference stage
  const durationMap = {
    preprocess: "1.2s",
    inference: "0.85s",
    postprocess: "0.5s",
    idle: "1.0s",
  };

  const animDuration = durationMap[stage] || "0.85s";

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded ${className}`}
      aria-label={`Inference scan active (${stage})`}
      role="status"
    >
      {/* Subtle translucent overlay indicating active processing */}
      <div className="absolute inset-0 bg-blue-950/20 dark:bg-amber-950/15 backdrop-blur-[1px]" />

      {/* Sweep line: dual-beam Highway laser with ambient road glow */}
      {!isReduced && (
        <>
          <div
            className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_12px_rgba(255,176,32,0.9)]"
            style={{
              animation: `scanline-sweep ${animDuration} cubic-bezier(0.4, 0, 0.2, 1) infinite`,
            }}
          />
          <div
            className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-80"
            style={{
              animation: `scanline-sweep ${animDuration} cubic-bezier(0.4, 0, 0.2, 1) infinite`,
              animationDelay: "0.08s",
            }}
          />
        </>
      )}

      {/* Real-time laser scanning telemetry tag */}
      <div className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded bg-black/80 border border-amber-500/40 text-[10px] font-mono text-amber-300 flex items-center gap-1.5 shadow-lg backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <span className="font-semibold uppercase tracking-wider">Highway Laser Scan: {stage}</span>
      </div>

      {/* Static status chip during scan */}
      <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-900/80 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="uppercase">{stage}</span>
      </div>
    </div>
  );
};
