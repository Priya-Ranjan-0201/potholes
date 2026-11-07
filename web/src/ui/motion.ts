/**
 * ScamRoad Motion System Tokens (Rule 5 & F8)
 * Single source of truth for motion constants, transitions, and accessibility.
 */

export const MOTION = {
  // Durations (ms)
  duration: {
    instant: 0,
    quick: 120,
    base: 200,
    moderate: 320,
    deliberate: 520,
    countUp: 700,
  },

  // Easing Curves
  easing: {
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    exit: "cubic-bezier(0.3, 0, 0, 1)",
    springLike: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },

  // Spring Presets
  spring: {
    stiffness: 260,
    damping: 26,
  },

  // Stagger delays (ms)
  stagger: 40,
} as const;

/**
 * Checks whether user has enabled prefers-reduced-motion
 */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
