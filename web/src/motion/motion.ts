/**
 * ScamRoad Functional Motion Tokens & Presets (SPEC v11).
 * Adheres strictly to Specification (Functional motion only), Specification (Reduced motion),
 * and Specification (Consistency: One central token registry).
 */

import { useMemo, useState, useEffect } from "react";
import { Variants } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

// 1. Motion Tokens
export const motionTokens = {
  duration: {
    instant: 0,
    fast: 0.12, // 120 ms
    base: 0.20, // 200 ms
    slow: 0.32, // 320 ms
    chart: 0.60, // 600 ms (once)
    ambient: 60, // 60 s ambient drift
  },
  easing: {
    standard: [0.2, 0, 0, 1] as const, // cubic-bezier(.2,0,0,1)
    enter: [0, 0, 0.2, 1] as const, // cubic-bezier(0,0,.2,1)
    exit: [0.4, 0, 1, 1] as const, // cubic-bezier(.4,0,1,1)
  },
  spring: {
    panel: { type: "spring", stiffness: 380, damping: 32 } as const,
    drag: { type: "spring", stiffness: 380, damping: 32 } as const,
    softer: { type: "spring", stiffness: 260, damping: 28 } as const,
  },
  stagger: {
    default: 0.03, // 30 ms
    maxItems: 10,
  },
} as const;

// 2. Hook: useReducedMotion
export function useReducedMotion(): boolean {
  const { reducedMotion: settingReduced } = useTheme();
  const [osReduced, setOsReduced] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setOsReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return Boolean(settingReduced || osReduced);
}

// 3. Motion Preset Name
export type MotionPresetName =
  | "page"
  | "fade"
  | "panel"
  | "toast"
  | "card"
  | "expand"
  | "dialog"
  | "shake";

// 4. Hook: useMotionPreset
export function useMotionPreset(preset: MotionPresetName): Variants {
  const isReduced = useReducedMotion();

  return useMemo<Variants>(() => {
    if (isReduced) {
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.1 } },
        exit: { opacity: 0, transition: { duration: 0.05 } },
      };
    }

    switch (preset) {
      case "page":
        return {
          initial: { opacity: 0, y: 6 },
          animate: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.16,
              ease: motionTokens.easing.enter,
            },
          },
          exit: {
            opacity: 0,
            y: -4,
            transition: {
              duration: 0.12,
              ease: motionTokens.easing.exit,
            },
          },
        };

      case "panel":
        return {
          initial: { x: "100%", opacity: 0.4 },
          animate: {
            x: 0,
            opacity: 1,
            transition: motionTokens.spring.panel,
          },
          exit: {
            x: "100%",
            opacity: 0,
            transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.exit },
          },
        };

      case "toast":
        return {
          initial: { opacity: 0, y: 12, scale: 0.97 },
          animate: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: motionTokens.duration.base, ease: motionTokens.easing.enter },
          },
          exit: {
            opacity: 0,
            y: 8,
            scale: 0.97,
            transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.exit },
          },
        };

      case "expand":
        return {
          initial: { height: 0, opacity: 0 },
          animate: {
            height: "auto",
            opacity: 1,
            transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.standard },
          },
          exit: {
            height: 0,
            opacity: 0,
            transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.exit },
          },
        };

      case "shake":
        return {
          initial: { x: 0 },
          animate: {
            x: [-2, 2, -1, 1, 0],
            transition: { duration: 0.25 },
          },
          exit: { x: 0 },
        };

      case "card":
        return {
          initial: { opacity: 0, y: 4 },
          animate: {
            opacity: 1,
            y: 0,
            transition: { duration: motionTokens.duration.base, ease: motionTokens.easing.enter },
          },
          exit: {
            opacity: 0,
            transition: { duration: motionTokens.duration.fast },
          },
        };

      case "dialog":
        return {
          initial: { opacity: 0, scale: 0.98 },
          animate: {
            opacity: 1,
            scale: 1,
            transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.enter },
          },
          exit: {
            opacity: 0,
            scale: 0.98,
            transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.exit },
          },
        };

      case "fade":
      default:
        return {
          initial: { opacity: 0 },
          animate: {
            opacity: 1,
            transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.standard },
          },
          exit: {
            opacity: 0,
            transition: { duration: motionTokens.duration.fast, ease: motionTokens.easing.exit },
          },
        };
    }
  }, [preset, isReduced]);
}
