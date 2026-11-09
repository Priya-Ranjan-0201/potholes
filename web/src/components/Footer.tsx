import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { JaaliLattice } from "../ui/atmosphere/JaaliLattice";

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
    <footer className="relative mt-auto border-t border-border bg-surface-solid text-muted text-xs overflow-hidden">
      <JaaliLattice className="absolute inset-0 pointer-events-none" opacity={0.025} />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left: Version + API status */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
              title={isOnline ? "API connected" : "API offline"}
            />
            <span className="font-medium text-text">
              ScamRoad
            </span>
            <span className="text-[10px] font-mono text-faint">v1.2</span>
          </div>

          {/* Center: Student Disclaimer (Mandatory Rule V8) */}
          <div className="text-center">
            <p className="text-[11px] text-muted">
              Student research project. Not an official government system. Not safety-certified.
            </p>
          </div>

          {/* Right: Technical Links */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text transition-colors"
            >
              GitHub
            </a>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="hover:text-text transition-colors"
            >
              API Docs
            </a>
            <Link
              to="/benchmarks"
              className="hover:text-text transition-colors"
            >
              Benchmarks
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
