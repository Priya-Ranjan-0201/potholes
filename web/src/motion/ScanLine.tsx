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
      <div className="absolute inset-0 bg-blue-950/10 dark:bg-blue-900/15" />

      {/* Sweep line: only active when reduced motion is OFF */}
      {!isReduced && (
        <div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.6)]"
          style={{
            animation: `scanline-sweep ${animDuration} cubic-bezier(0.4, 0, 0.2, 1) infinite`,
          }}
        />
      )}

      {/* Static status chip during scan */}
      <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-900/80 text-blue-400 border border-blue-500/30 flex items-center gap-1.5 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        <span className="uppercase">{stage}</span>
      </div>
    </div>
  );
};
