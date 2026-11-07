import React, { useState, useRef, useEffect } from "react";

interface DemoBadgeProps {
  className?: string;
}

export const DemoBadge: React.FC<DemoBadgeProps> = ({ className = "" }) => {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [open]);

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        title="Click for dataset details"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        <span>DEMO DATA</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg z-50 text-xs text-slate-600 dark:text-slate-300">
          <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Demonstration Dataset
          </div>
          <p className="leading-relaxed text-[11px] text-slate-500 dark:text-slate-400 mb-2">
            This view includes synthetic demonstration records generated for viva evaluation. Real surveys are logged with <code className="font-mono text-[10px]">is_demo=false</code>.
          </p>
          <div className="text-[10px] text-slate-400 font-mono">
            Reset anytime: <span className="text-slate-600 dark:text-slate-300">npm run seed:demo</span>
          </div>
        </div>
      )}
    </div>
  );
};
