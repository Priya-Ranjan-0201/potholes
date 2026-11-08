import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "../components/Icons";

export interface Toast {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string, onUndo?: () => void) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string, onUndo?: () => void) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Individual Toast Item with 5s progress bar and pause-on-hover
const ToastItem: React.FC<{ toast: Toast; onDismiss: () => void }> = ({ toast, onDismiss }) => {
  const duration = toast.duration ?? 5000;
  const [progress, setProgress] = useState<number>(100);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    if (isPaused || duration <= 0) return;

    const interval = 50; // Update progress every 50ms
    const timer = setInterval(() => {
      remainingTimeRef.current -= interval;
      const pct = Math.max(0, (remainingTimeRef.current / duration) * 100);
      setProgress(pct);

      if (remainingTimeRef.current <= 0) {
        clearInterval(timer);
        onDismiss();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isPaused, duration, onDismiss]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden flex flex-col p-3.5 rounded-lg border shadow-lg text-xs ${
        toast.type === "success"
          ? "bg-slate-900 border-emerald-500/40 text-slate-100 shadow-emerald-950/20"
          : toast.type === "error"
          ? "bg-slate-900 border-rose-500/40 text-slate-100 shadow-rose-950/20"
          : "bg-slate-900 border-slate-700 text-slate-100 shadow-slate-950/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : toast.type === "error" ? (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          ) : (
            <Info className="w-4 h-4 text-blue-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-100 tracking-tight">{toast.title}</div>
          {toast.message && (
            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
              {toast.message}
            </div>
          )}
        </div>

        {/* Optional Undo Action */}
        {toast.onUndo && (
          <button
            type="button"
            onClick={() => {
              toast.onUndo?.();
              onDismiss();
            }}
            className="shrink-0 px-2 py-0.5 rounded text-[11px] font-mono font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 border border-blue-500/30 transition-colors"
          >
            {toast.undoLabel || "Undo"}
          </button>
        )}

        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 shrink-0 p-0.5"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Auto-dismiss thin progress bar */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800">
          <div
            className={`h-full ${
              toast.type === "success"
                ? "bg-emerald-500"
                : toast.type === "error"
                ? "bg-rose-500"
                : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 5000, onUndo, undoLabel }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration, onUndo, undoLabel };
      setToasts((prev) => [...prev, newToast]);
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string, onUndo?: () => void) =>
      showToast({ type: "success", title, message, onUndo }),
    [showToast]
  );
  const error = useCallback(
    (title: string, message?: string) => showToast({ type: "error", title, message }),
    [showToast]
  );
  const info = useCallback(
    (title: string, message?: string, onUndo?: () => void) =>
      showToast({ type: "info", title, message, onUndo }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, info }}>
      {children}
      {/* Toast viewport container with Framer Motion layout */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
