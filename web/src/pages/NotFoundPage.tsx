import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "../components/Icons";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-4 text-sm font-mono font-semibold">
        404
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-2">
        Page not found
      </h1>

      <p className="max-w-sm text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6">
        The requested URL was not found on this server. It may have moved or been renamed.
      </p>

      <Link
        to="/"
        className="btn-primary inline-flex items-center gap-2 text-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Overview</span>
      </Link>
    </div>
  );
};
