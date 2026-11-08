import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMotionPreset } from "./motion";
import { X } from "../components/Icons";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const dialogVariants = useMotionPreset("dialog");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const shortcuts = [
    { key: "g o", label: "Go to Overview" },
    { key: "g s", label: "Go to Scanner" },
    { key: "g m", label: "Go to Maintenance" },
    { key: "g b", label: "Go to Model Benchmarks" },
    { key: "Ctrl + K", label: "Open Command Palette / Search" },
    { key: "/", label: "Quick search" },
    { key: "n", label: "Log new hazard / citizen report" },
    { key: "j / k", label: "Move up / down in tables" },
    { key: "[ / ]", label: "Previous / next defect in inspection" },
    { key: "Esc", label: "Close active drawer or dialog" },
    { key: "?", label: "Open this keyboard shortcuts cheat-sheet" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            variants={dialogVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-5 z-10"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>Keyboard Shortcuts</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                  Global
                </span>
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close shortcuts"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-3 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {shortcuts.map((sc) => (
                <div key={sc.key} className="py-2 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{sc.label}</span>
                  <kbd className="px-2 py-0.5 font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded shadow-xs font-semibold">
                    {sc.key}
                  </kbd>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 text-center">
              Press <kbd className="font-mono font-semibold px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Esc</kbd> or click outside to dismiss.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
