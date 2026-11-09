import React from "react";

interface JaaliLatticeProps {
  className?: string;
  opacity?: number; // default 0.035 (3.5%)
}

/**
 * Faint Jaali Geometric Lattice (SPEC v12).
 * Atmosphere zone decorative accent, strictly kept at 3-4% opacity.
 */
export const JaaliLattice: React.FC<JaaliLatticeProps> = ({
  className = "",
  opacity = 0.035,
}) => {
  return (
    <div
      className={`pointer-events-none select-none overflow-hidden ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="jaali-pattern"
            x="0"
            y="0"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            {/* Hexagonal eight-fold star jaali geometric repeat */}
            <path
              d="M16 0 L24 8 L32 16 L24 24 L16 32 L8 24 L0 16 L8 8 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.75"
            />
            <circle cx="16" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="0" cy="0" r="3" fill="none" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="32" cy="0" r="3" fill="none" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="0" cy="32" r="3" fill="none" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="32" cy="32" r="3" fill="none" stroke="currentColor" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#jaali-pattern)" />
      </svg>
    </div>
  );
};

