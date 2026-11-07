import React from "react";
import { useLanguage, LanguageCode } from "../context/LanguageContext";

export type PatternType =
  | "scallops"    // Truck Art (English default)
  | "madhubani"   // Hindi
  | "phulkari"    // Punjabi
  | "kolam"       // Tamil
  | "kalamkari"   // Telugu
  | "alpana"      // Bengali
  | "jaali"       // Neutral screen
  | "marigold"    // Floral celebration
  | "ikat";       // Geometric zig-zag

interface PatternBandProps {
  type?: PatternType;
  regional?: boolean; // When true, derives pattern from current language
  className?: string;
  height?: number;
  opacity?: number;
}

export const PatternBand: React.FC<PatternBandProps> = ({
  type,
  regional = true,
  className = "",
  height = 14,
  opacity = 0.6,
}) => {
  const { language } = useLanguage();

  // Map language to authentic regional Indian folk art pattern
  const resolvePattern = (): PatternType => {
    if (type) return type;
    if (!regional) return "scallops";

    switch (language as LanguageCode) {
      case "hi":
        return "madhubani";
      case "pa":
        return "phulkari";
      case "ta":
        return "kolam";
      case "te":
        return "kalamkari";
      case "bn":
        return "alpana";
      case "en":
      default:
        return "scallops";
    }
  };

  const pattern = resolvePattern();

  // Render authentic SVG motifs
  const renderSvgPattern = () => {
    switch (pattern) {
      case "phulkari":
        // 8-point geometric star diamond grid
        return (
          <pattern id="pat-phulkari" width="24" height="24" patternUnits="userSpaceOnUse">
            <polygon points="12,2 15,9 22,12 15,15 12,22 9,15 2,12 9,9" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </pattern>
        );

      case "kolam":
        // Interlaced looping dot-grid lines
        return (
          <pattern id="pat-kolam" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
            <path d="M0,10 Q10,0 20,10 Q10,20 0,10" fill="none" stroke="currentColor" strokeWidth="1.2" />
          </pattern>
        );

      case "madhubani":
        // Geometric cross-hatching and stylized leaf fins
        return (
          <pattern id="pat-madhubani" width="28" height="20" patternUnits="userSpaceOnUse">
            <path d="M2,10 Q14,0 26,10 Q14,20 2,10 Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <line x1="8" y1="6" x2="20" y2="14" stroke="currentColor" strokeWidth="0.8" />
            <line x1="14" y1="3" x2="14" y2="17" stroke="currentColor" strokeWidth="0.8" />
          </pattern>
        );

      case "kalamkari":
        // Flowing lotus leaf vine curves
        return (
          <pattern id="pat-kalamkari" width="24" height="20" patternUnits="userSpaceOnUse">
            <path d="M0,10 Q6,2 12,10 T24,10" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="12" cy="5" r="2" fill="currentColor" opacity="0.8" />
          </pattern>
        );

      case "alpana":
        // Graceful radiating white rice-paste concentric spirals
        return (
          <pattern id="pat-alpana" width="22" height="20" patternUnits="userSpaceOnUse">
            <path d="M2,18 C2,10 11,2 20,18" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="11" cy="9" r="1.5" fill="currentColor" />
          </pattern>
        );

      case "jaali":
        // Geometric Mughal stone latticework
        return (
          <pattern id="pat-jaali" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(45 8 8)" />
            <circle cx="8" cy="8" r="1" fill="currentColor" />
          </pattern>
        );

      case "marigold":
        // Abstract 8-petal marigold bloom
        return (
          <pattern id="pat-marigold" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="3" fill="currentColor" />
            <circle cx="10" cy="4" r="2" fill="currentColor" opacity="0.6" />
            <circle cx="10" cy="16" r="2" fill="currentColor" opacity="0.6" />
            <circle cx="4" cy="10" r="2" fill="currentColor" opacity="0.6" />
            <circle cx="16" cy="10" r="2" fill="currentColor" opacity="0.6" />
          </pattern>
        );

      case "scallops":
      default:
        // Indian truck-art scalloped border
        return (
          <pattern id="pat-scallops" width="16" height="14" patternUnits="userSpaceOnUse">
            <path d="M0,0 Q8,12 16,0" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <circle cx="8" cy="4" r="1.5" fill="currentColor" />
          </pattern>
        );
    }
  };

  const patternId = `pat-${pattern}`;

  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden pointer-events-none select-none text-amber-500/70 dark:text-amber-400/60 ${className}`}
      style={{ height: `${height}px`, opacity }}
    >
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>{renderSvgPattern()}</defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
};

