import React, { useState, useRef } from "react";
import { UploadCloud } from "../../components/Icons";
import { useReducedMotion } from "../../motion/motion";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number | null; // 0 to 100
  acceptedFormats?: string;
  className?: string;
}

/**
 * Scanner Dropzone with Flowing Lane Dashes (SPEC v12 A8).
 * - Dashed border with stroke-dashoffset animation simulating highway lane dashes.
 * - Speeds up and tints to primary amber/indigo on drag-over.
 * - Converges to real-byte progress bar on upload.
 */
export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  isUploading = false,
  uploadProgress = null,
  acceptedFormats = "image/jpeg,image/png,image/webp,video/mp4",
  className = "",
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isReduced = useReducedMotion();
  const showProgress = isUploading || uploadProgress !== null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group cursor-pointer rounded-atmosphere p-8 transition-all duration-200 overflow-hidden ${
        isDragOver
          ? "bg-primary/10 shadow-lg"
          : "bg-surface-solid hover:bg-bg-raised/70"
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* SVG Animated Flowing Lane Border (A8) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none rounded-atmosphere"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="1"
          y="1"
          width="calc(100% - 2px)"
          height="calc(100% - 2px)"
          rx="15"
          ry="15"
          fill="none"
          stroke={isDragOver ? "var(--primary)" : "var(--border-strong)"}
          strokeWidth="1.5"
          strokeDasharray="10 8"
          strokeDashoffset={isReduced ? 0 : undefined}
          style={{
            animation: isReduced
              ? "none"
              : `flowingDashes ${isDragOver ? "1.2s" : "4s"} linear infinite`,
          }}
        />
      </svg>

      <style>{`
        @keyframes flowingDashes {
          to {
            stroke-dashoffset: -36px;
          }
        }
      `}</style>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2">
        <div
          className={`p-3 rounded-full transition-transform duration-200 ${
            isDragOver
              ? "scale-110 bg-primary/20 text-primary"
              : "bg-bg-raised text-muted group-hover:text-primary"
          }`}
        >
          <UploadCloud className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold text-text">
            {isDragOver ? "Drop road frame or video here" : "Click to browse or drop an inspection frame"}
          </p>
          <p className="text-xs text-muted font-mono">
            Supports JPEG, PNG, WebP (up to 4K resolution) or MP4 dashcam footage
          </p>
        </div>

        {/* Real Byte Upload Progress Bar */}
        {showProgress && (
          <div className="w-full max-w-xs mt-3 pt-2">
            <div className="flex justify-between text-[11px] font-mono text-muted mb-1">
              <span>Uploading frame...</span>
              <span>{Math.round(uploadProgress ?? 60)}%</span>
            </div>
            <div className="w-full h-1.5 bg-bg-raised rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-120"
                style={{ width: `${uploadProgress ?? 60}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
