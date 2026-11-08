import React, { useEffect, useState, useRef } from "react";
import { useReducedMotion } from "./motion";

interface NumberTransitionProps {
  value: number;
  durationMs?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * Truthful Number Transition.
 * Smoothly rolls between previous and current real values.
 * Instantly renders final value if reduced motion is active or on initial mount.
 */
export const NumberTransition: React.FC<NumberTransitionProps> = ({
  value,
  durationMs = 300,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const isReduced = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(value);
  const isFirstMountRef = useRef<boolean>(true);

  useEffect(() => {
    // Initial mount renders final value with zero count-up
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      prevValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    if (isReduced || prevValueRef.current === value) {
      prevValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = value;
    const startTime = performance.now();
    let animId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Standard cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
      }
    };

    animId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animId);
  }, [value, durationMs, isReduced]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toString();

  return (
    <span className={className} aria-live="polite">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
