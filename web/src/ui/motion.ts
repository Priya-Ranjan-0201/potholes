/**
 * ScamRoad Motion System Tokens (v9 Vibrant Upgrade)
 * Section 5: All animations via motion.ts tokens.
 * Durations: 120, 200, 320, 520, 900 ms.
 * Easing: cubic-bezier(.2, .8, .2, 1).
 * Spring: { stiffness: 260, damping: 26 }.
 */

export const MOTION = {
  // Durations (ms)
  duration: {
    instant: 0,
    quick: 120,
    base: 200,
    moderate: 320,
    deliberate: 520,
    ambient: 900,
    countUp: 700,
  },

  // Easing Curves
  easing: {
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    exit: "cubic-bezier(0.3, 0, 0, 1)",
    springLike: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    smoothOut: "cubic-bezier(0.16, 1, 0.3, 1)",
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
 * Checks whether user has enabled prefers-reduced-motion via OS or in-app toggle
 */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const appOverride = localStorage.getItem("scamroad_reduced_motion");
  if (appOverride !== null) {
    return appOverride === "true";
  }
  if (window.matchMedia) {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
}
