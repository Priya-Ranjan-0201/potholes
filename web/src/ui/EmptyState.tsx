import React from "react";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`dhaba-card p-8 flex flex-col items-center justify-center text-center max-w-md mx-auto my-6 border-dashed border-2 border-stone-300 dark:border-amber-400/30 ${className}`}
    >
      {/* Friendly Folk Mascot "Gaddha" (Original Hand-drawn Geometric SVG) */}
      <div className="w-24 h-24 mb-4 relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Crater Asphalt Ring */}
          <ellipse cx="50" cy="55" rx="42" ry="26" fill="#1B1308" stroke="#FFB300" strokeWidth="2.5" />
          <ellipse cx="50" cy="53" rx="34" ry="19" fill="#2B2F8F" opacity="0.4" />
          {/* Friendly Crater Eyes */}
          <circle cx="42" cy="50" r="4.5" fill="#FFFFFF" />
          <circle cx="43" cy="50" r="2.5" fill="#1B1308" />
          <circle cx="58" cy="50" r="4.5" fill="#FFFFFF" />
          <circle cx="59" cy="50" r="2.5" fill="#1B1308" />
          {/* Friendly Smile */}
          <path d="M46,58 Q50,63 54,58" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Safety Pylon / Flag on edge */}
          <polygon points="68,24 74,44 62,44" fill="#E8452C" stroke="#FFFFFF" strokeWidth="1" />
          <rect x="67" y="44" width="2" height="12" fill="#FFB300" />
        </svg>
      </div>

      <h3 className="font-black text-lg text-stone-900 dark:text-stone-100 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-5 leading-relaxed">
        {description}
      </p>

      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition shadow-md hover:shadow-lg flex items-center gap-1.5"
        >
          <span>{actionLabel}</span>
        </Link>
      )}

      {actionLabel && onAction && !actionLink && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition shadow-md hover:shadow-lg flex items-center gap-1.5"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
