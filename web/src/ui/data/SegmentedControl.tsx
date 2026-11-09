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
  name,
}: SegmentedControlProps<T>) {
  const isReduced = useReducedMotion();
  const defaultId = React.useId();
  const controlName = name || defaultId;

  const sizeClasses = {
    sm: "p-0.5 text-xs",
    md: "p-1 text-xs",
  }[size];

  const itemPadding = {
    sm: "px-2.5 py-1",
    md: "px-3.5 py-1.5",
  }[size];

  return (
    <div
      role="tablist"
      className={`relative inline-flex items-center bg-slate-900/90 dark:bg-slate-950 rounded-lg border border-slate-700/80 p-1 shadow-sm ${sizeClasses} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.id)}
            className={`relative z-10 inline-flex items-center gap-1.5 rounded-md transition-all duration-150 cursor-pointer ${itemPadding} ${
              isSelected
                ? "text-amber-400 font-bold"
                : "text-slate-300 hover:text-white hover:bg-slate-800/50 font-medium"
            }`}
          >
            {isSelected && !isReduced && (
              <motion.div
                layoutId={`segment-pill-${controlName}`}
                className="absolute inset-0 bg-slate-800/95 rounded-md shadow-sm border border-amber-500/40 -z-10"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            {isSelected && isReduced && (
              <div className="absolute inset-0 bg-slate-800 rounded-md border border-amber-500/40 -z-10" />
            )}
            {option.icon && (
              <span className={isSelected ? "text-amber-400" : "text-slate-400"}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold transition-colors ${
                  isSelected
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
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

