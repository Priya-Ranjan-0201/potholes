import React from "react";
import { motion } from "framer-motion";
import { useReducedMotion } from "../../motion/motion";

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
  name?: string;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
  name = "segmented-control",
}: SegmentedControlProps<T>) {
  const isReduced = useReducedMotion();

  const sizeClasses = {
    sm: "p-0.5 text-xs",
    md: "p-1 text-xs",
  }[size];

  const itemPadding = {
    sm: "px-2.5 py-1",
    md: "px-3 py-1.5",
  }[size];

  return (
    <div
      role="tablist"
      className={`relative inline-flex items-center bg-bg-raised rounded-md border border-border p-1 ${sizeClasses} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.id)}
            className={`relative z-10 inline-flex items-center gap-1.5 font-medium rounded transition-colors duration-150 cursor-pointer ${itemPadding} ${
              isSelected
                ? "text-text font-semibold"
                : "text-muted hover:text-text"
            }`}
          >
            {isSelected && !isReduced && (
              <motion.div
                layoutId={`segment-pill-${name}`}
                className="absolute inset-0 bg-surface-solid rounded shadow-xs border border-border-strong -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {isSelected && isReduced && (
              <div className="absolute inset-0 bg-surface-solid rounded border border-border-strong -z-10" />
            )}
            {option.icon && (
              <span className={isSelected ? "text-primary" : "text-muted"}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? "bg-bg-raised text-text"
                    : "bg-surface-solid text-muted"
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
