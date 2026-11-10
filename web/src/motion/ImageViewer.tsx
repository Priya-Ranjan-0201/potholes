import React, { useState, useRef } from "react";
import { useReducedMotion } from "./motion";

interface ImageViewerProps {
  src: string;
  alt: string;
  children?: React.ReactNode; // Overlays (e.g. bounding boxes)
  className?: string;
}

/**
 * Scanner S6 "image viewer".
 * Wheel / pinch zoom (1x to 4x), drag panning, minimap viewport indicator, double-click to reset.
 */
export const ImageViewer: React.FC<ImageViewerProps> = ({
  src,
  alt,
  children,
  className = "",
}) => {
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isReduced = useReducedMotion();

  const handleZoomIn = () => setScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))));
  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((prev) => {
      const next = Math.max(1, Math.min(4, Number((prev + delta).toFixed(2))));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return;
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning) return;
    const maxOffset = (scale - 1) * 200;
    const newX = Math.max(-maxOffset, Math.min(maxOffset, e.clientX - startPanRef.current.x));
    const newY = Math.max(-maxOffset, Math.min(maxOffset, e.clientY - startPanRef.current.y));
    setOffset({ x: newX, y: newY });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div
      className={`relative overflow-hidden rounded bg-slate-950 select-none ${className}`}
      onWheel={handleWheel}
      onDoubleClick={handleReset}
      style={{ cursor: scale > 1 ? (isPanning ? "grabbing" : "grab") : "default" }}
    >
      {/* Zoomed & Panned Content */}
      <div
        className="relative w-full h-full flex items-center justify-center"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          transition: isPanning || isReduced ? "none" : "transform 150ms ease-out",
          transformOrigin: "center center",
        }}
      >
        <div className="relative inline-block leading-none max-w-full max-h-full">
          <img
            src={src}
            alt={alt}
            className="block max-w-full max-h-[560px] w-auto h-auto select-none pointer-events-none"
          />
          {children}
        </div>
      </div>

      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 p-1 rounded bg-slate-900/80 border border-slate-700/60 backdrop-blur-sm text-xs font-mono text-slate-200">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="px-2 py-0.5 rounded hover:bg-slate-800 disabled:opacity-40"
          title="Zoom out"
          aria-label="Zoom out"
        >
          −
        </button>
        <span className="px-1 text-[11px] font-semibold">{scale.toFixed(1)}×</span>
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={scale >= 4}
          className="px-2 py-0.5 rounded hover:bg-slate-800 disabled:opacity-40"
          title="Zoom in"
          aria-label="Zoom in"
        >
          +
        </button>
        {scale > 1 && (
          <button
            type="button"
            onClick={handleReset}
            className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white"
            title="Reset zoom"
          >
            Reset
          </button>
        )}
      </div>

      {/* Minimap Viewport indicator (visible when zoomed) */}
      {scale > 1 && (
        <div className="absolute top-3 right-3 z-20 w-24 h-16 rounded border border-slate-700 bg-slate-900/90 overflow-hidden shadow-md pointer-events-none">
          <img src={src} alt="Minimap" className="w-full h-full object-cover opacity-40" />
          <div
            className="absolute border-2 border-blue-400 bg-blue-500/20"
            style={{
              width: `${(1 / scale) * 100}%`,
              height: `${(1 / scale) * 100}%`,
              left: `${50 - (offset.x / (scale * 200)) * 50 - ((1 / scale) * 100) / 2}%`,
              top: `${50 - (offset.y / (scale * 200)) * 50 - ((1 / scale) * 100) / 2}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};
