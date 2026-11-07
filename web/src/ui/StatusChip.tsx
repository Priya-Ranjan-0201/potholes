import React from "react";

export type ItemStatus =
  | "CREATED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "VERIFIED"
  | "REJECTED"
  | "RESOLVED"
  | "PENDING"
  | "detected"
  | "open"
  | "repaired"
  | string;

interface StatusChipProps {
  status: ItemStatus;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  CREATED: { label: "Created", dot: "bg-slate-400" },
  ASSIGNED: { label: "Assigned", dot: "bg-blue-500" },
  IN_PROGRESS: { label: "In Repair", dot: "bg-amber-500" },
  COMPLETED: { label: "Pending Audit", dot: "bg-purple-500" },
  VERIFIED: { label: "Verified", dot: "bg-emerald-500" },
  RESOLVED: { label: "Resolved", dot: "bg-emerald-500" },
  REJECTED: { label: "Rejected", dot: "bg-rose-500" },
  PENDING: { label: "Pending", dot: "bg-amber-500" },
  detected: { label: "Detected", dot: "bg-rose-500" },
  open: { label: "Open", dot: "bg-amber-500" },
  repaired: { label: "Repaired", dot: "bg-emerald-500" },
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, className = "" }) => {
  const normalized = status.toUpperCase();
  const cfg = STATUS_CONFIG[normalized] || STATUS_CONFIG[status] || {
    label: status,
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      <span>{cfg.label}</span>
    </span>
  );
};
