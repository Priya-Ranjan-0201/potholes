import React from "react";
import { useReducedMotion } from "./motion";

interface ScanLineProps {
  isScanning: boolean;
  stage?: "preprocess" | "inference" | "postprocess" | "idle";
  className?: string;
}

/** Subtle scanning overlay shown while an image is being analyzed. */
export const ScanLine: React.FC<ScanLineProps> = ({
  isScanning,
  stage = "inference",
  className = "",
}) => {
  const isReduced = useReducedMotion();

  if (!isScanning) return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden rounded ${className}`}
      aria-label={`Scanning image (${stage})`}
      role="status"
    >
      <div className="absolute inset-0 bg-slate-950/25" />

      {!isReduced && (
        <div
          className="absolute left-0 right-0 h-[2px] bg-blue-500/80"
          style={{
            animation: "scanline-sweep 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite",
          }}
        />
      )}

      <div className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700 text-[11px] font-medium text-slate-100 flex items-center gap-1.5 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span>Scanning image...</span>
      </div>
    </div>
  );
};
