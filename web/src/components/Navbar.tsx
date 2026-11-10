import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
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
import { ThemeToggleWipe } from "../ui/atmosphere/ThemeToggleWipe";
import { Logo } from "./Logo";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { reducedMotion, setReducedMotion } = useTheme();
  const { language, setLanguage, currentOption } = useLanguage();

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

  // 4 Primary Navigation Items
  const navLinks = [
    { to: "/", label: "Overview", icon: Compass },
    { to: "/scanner", label: "Scanner", icon: Camera },
    { to: "/maintenance", label: "Maintenance", icon: ClipboardList },
    { to: "/benchmarks", label: "Model Benchmarks", icon: BarChart3 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-4">
            {/* Brand Logo & Name */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 select-none">
              <Logo showWordmark={false} size="sm" />
              <div className="flex flex-col">
                <span className="font-heading font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
                  ScamRoad
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight mt-0.5">
                  Road defect management
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
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
                    className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? "text-slate-900 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right actions: Telemetry, Search, Language, Theme, Reduced Motion */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Telemetry Status Pill */}
              <div
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-medium border border-slate-200 dark:border-slate-700"
                title="YOLO11n INT8 Inference Engine Online"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Online</span>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">74ms</span>
              </div>

              {/* Command Palette Trigger */}
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("scamroad:open-palette"));
                }}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer outline-none"
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
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-600 transition-colors cursor-pointer outline-none"
                  title="Switch language"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="font-medium hidden sm:inline">{currentOption.nativeName}</span>
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg py-1 z-50 text-xs">
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
                            ? "text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-500/10"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span>{opt.nativeName}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">{opt.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reduced motion toggle */}
              <button
                type="button"
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`p-1.5 rounded-md border transition-colors cursor-pointer text-xs ${
                  reducedMotion
                    ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
                    : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={reducedMotion ? "Reduced motion active" : "Enable reduced motion"}
              >
                {reducedMotion ? <ZapOff className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              </button>

              {/* Theme toggle: Light / Dark */}
              <ThemeToggleWipe />

              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1">
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
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
    </>
  );
};
