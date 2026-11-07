import React from "react";

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
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: "p-0.5 text-xs",
    md: "p-1 text-xs",
  }[size];

  const itemPadding = {
    sm: "px-2 py-1",
    md: "px-2.5 py-1.5",
  }[size];

  return (
    <div
      role="tablist"
      className={`inline-flex items-center bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 ${sizeClasses} ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.id === value;
        return (
          <button
            key={option.id}
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.id)}
            className={`inline-flex items-center gap-1.5 font-medium rounded transition-colors ${itemPadding} ${
              isSelected
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-semibold"
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {option.icon && (
              <span className={isSelected ? "text-slate-900 dark:text-slate-100" : "text-slate-400"}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    : "bg-slate-200/60 dark:bg-slate-700/60 text-slate-500"
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

