import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Compass,
  Camera,
  ClipboardList,
  BarChart3,
  Menu,
  X,
  Globe,
  Search,
  Zap,
  ZapOff,
} from "./Icons";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useReducedMotion } from "../motion/motion";
import { ThemeToggleWipe } from "../ui/atmosphere/ThemeToggleWipe";
import { JaaliLattice } from "../ui/atmosphere/JaaliLattice";
import { Logo } from "./Logo";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { reducedMotion, setReducedMotion } = useTheme();
  const { language, setLanguage, currentOption } = useLanguage();
  const isReduced = useReducedMotion();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Exactly 4 Primary Navigation Items (SPEC v12 Rule V3)
  const navLinks = [
    { to: "/", label: "Overview", icon: Compass },
    { to: "/scanner", label: "Scanner", icon: Camera },
    { to: "/maintenance", label: "Maintenance", icon: ClipboardList },
    { to: "/benchmarks", label: "Model Benchmarks", icon: BarChart3 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070b14]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <JaaliLattice className="absolute inset-0 pointer-events-none" opacity={0.03} />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 select-none">
              <Logo showWordmark={false} size="sm" />
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                  ScamRoad
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium tracking-tight mt-0.5">
                  Road defect management
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (with Sliding Active Indicator) */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.to === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(link.to);

                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`relative px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-2 ${
                      isActive
                        ? "text-amber-600 dark:text-amber-400 font-bold"
                        : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 font-medium"
                    }`}
                  >
                    {isActive && !isReduced && (
                      <motion.div
                        layoutId="nav-indicator-pill"
                        className="absolute inset-0 bg-amber-500/15 rounded-md border border-amber-500/35 -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    {isActive && isReduced && (
                      <div className="absolute inset-0 bg-amber-500/15 rounded-md border border-amber-500/35 -z-10" />
                    )}
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right actions: Telemetry, Search, Language, Theme, Reduced Motion */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Live Telemetry Status Pill */}
              <div
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/35 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-medium"
                title="PostgreSQL & YOLO11n INT8 Inference Engine Online"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                <span>LIVE</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">74ms</span>
              </div>

              {/* Command Palette Trigger */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("scamroad:open-palette"));
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer outline-none"
                title="Search & Command Palette (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">Ctrl+K</span>
              </button>

              {/* Language Selector Dropdown */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-500 transition-colors cursor-pointer outline-none"
                  title="Switch language"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span className="font-medium hidden sm:inline">{currentOption.nativeName}</span>
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl py-1 z-50 text-xs">
                    {LANGUAGES.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => {
                          setLanguage(opt.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                          language === opt.code
                            ? "text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10"
                            : "text-slate-800 dark:text-slate-200"
                        }`}
                      >
                        <span>{opt.nativeName}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase">{opt.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reduced motion toggle */}
              <button
                type="button"
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`p-1.5 rounded-md border text-xs transition-colors cursor-pointer outline-none ${
                  reducedMotion
                    ? "bg-amber-500/20 border-amber-500/50 text-amber-600 dark:text-amber-300"
                    : "bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                }`}
                title={reducedMotion ? "Reduce motion active" : "Full motion active"}
                aria-label="Toggle reduced motion"
              >
                {reducedMotion ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              </button>

              {/* Sunrise/Sunset Wipe Theme Toggle (A10) */}
              <ThemeToggleWipe />

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer outline-none"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface-solid px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium ${
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted hover:text-text hover:bg-bg-raised"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Mobile Bottom Tab Bar (SPEC v12 Section 5) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-md border-t border-border flex items-center justify-around h-14">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            link.to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(link.to);

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors ${
                isActive ? "text-primary font-semibold" : "text-muted"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
