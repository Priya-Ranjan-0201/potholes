import React, { useState, useRef, useCallback } from "react";
import { useReducedMotion } from "./motion";

interface CompareSliderProps {
  beforeImage: string; // Original image
  afterImage: string; // Annotated image
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

/**
 * Scanner S5 "before/after" Comparison Slider.
 * Draggable divider comparing unannotated vs defect-annotated road surface.
 * Accessible with pointer dragging and keyboard ArrowLeft / ArrowRight navigation.
 */
export const CompareSlider: React.FC<CompareSliderProps> = ({
  beforeImage,
  afterImage,
  beforeLabel = "Original Capture",
  afterLabel = "AI Detections (INT8)",
  className = "",
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion();

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    setSliderPos(percent);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    handleMove(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Keyboard navigation
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setSliderPos((prev) => Math.max(0, prev - (e.shiftKey ? 10 : 2)));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setSliderPos((prev) => Math.min(100, prev + (e.shiftKey ? 10 : 2)));
    } else if (e.key === "Home") {
      e.preventDefault();
      setSliderPos(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setSliderPos(100);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded border border-slate-200 dark:border-slate-800 bg-slate-950 ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      tabIndex={0}
      role="slider"
      aria-label="Before and after inspection comparison"
      aria-valuenow={sliderPos}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={onKeyDown}
      style={{ touchAction: "none" }}
    >
      {/* 1. Underlying After (Annotated) Image */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="w-full h-auto block max-h-[560px] object-contain mx-auto pointer-events-none"
      />

      {/* 2. Clipped Before (Original) Image */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          clipPath: `polygon(0% 0%, ${sliderPos}% 0%, ${sliderPos}% 100%, 0% 100%)`,
          transition: isDragging || isReduced ? "none" : "clip-path 120ms ease-out",
        }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="w-full h-auto block max-h-[560px] object-contain mx-auto"
        />
      </div>

      {/* 3. Divider Line & Drag Handle */}
      <div
        className="absolute top-0 bottom-0 z-20 pointer-events-none"
        style={{
          left: `${sliderPos}%`,
          transform: "translateX(-50%)",
        }}
      >
        <div className="w-[2px] h-full bg-white shadow-[0_0_8px_rgba(0,0,0,0.6)]" />

        {/* Grab Handle */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-7 h-7 rounded-full bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-mono cursor-ew-resize">
          <span className="flex gap-0.5 tracking-tighter">⟨⟩</span>
        </div>
      </div>

      {/* 4. Badges */}
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-black/60 text-white backdrop-blur-sm pointer-events-none">
        {beforeLabel}
      </div>
      <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-blue-600/80 text-white backdrop-blur-sm pointer-events-none">
        {afterLabel}
      </div>
    </div>
  );
};
