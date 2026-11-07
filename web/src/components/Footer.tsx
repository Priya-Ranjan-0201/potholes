import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export const Footer: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    api.health()
      .then(() => {
        if (mounted) setIsOnline(true);
      })
      .catch(() => {
        if (mounted) setIsOnline(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Version + API status */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-500" : "bg-rose-500"
              }`}
              title={isOnline ? "API connected" : "API offline"}
            />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              ScamRoad v1.1
            </span>
          </div>

          {/* Center: Student Disclaimer */}
          <div className="text-center">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Student research project. Not an official government system. Not safety-certified.
            </p>
          </div>

          {/* Right: Technical Links */}
          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              GitHub
            </a>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              API Docs
            </a>
            <Link
              to="/benchmarks"
              className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Benchmarks
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
