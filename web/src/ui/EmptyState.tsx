import React from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  icon,
  className = "",
}) => {
  return (
    <div
      className={`card p-8 flex flex-col items-center justify-center text-center w-full max-w-md mx-auto my-6 border-dashed ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mb-3">
        {icon || (
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>

      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
        {description}
      </p>

      {actionLabel && actionLink && (
        <Link to={actionLink} className="btn-secondary text-xs">
          {actionLabel}
        </Link>
      )}

      {actionLabel && onAction && !actionLink && (
        <button onClick={onAction} className="btn-secondary text-xs">
          {actionLabel}
        </button>
      )}
    </div>
  );
};
