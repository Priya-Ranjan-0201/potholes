import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  Camera,
  ClipboardList,
  MessageSquareWarning,
  Layers,
  Menu,
  X,
  Sun,
  Moon,
  Globe,
} from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { Logo } from "./Logo";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, currentOption } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
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

  // Core essential navigation links (clean, uncluttered semester scope)
  const navLinks = [
    { to: "/", label: t("navOverview"), icon: Compass },
    { to: "/scanner", label: t("navScanner"), icon: Camera },
    { to: "/defects", label: t("navDefects"), icon: Layers },
    { to: "/maintenance", label: t("navWorkOrders"), icon: ClipboardList },
    { to: "/complaints", label: t("navComplaints"), icon: MessageSquareWarning },
  ];

  const secondaryLinks = [
    { to: "/evaluation", label: "Model Evaluation" },
    { to: "/models", label: "Edge Telemetry" },
    { to: "/capture", label: "Drive PWA" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full transition-colors duration-200">
        {/* Subtle Single-Line Disclaimer Banner */}
        <div className="w-full bg-stone-950 text-stone-300 py-1.5 px-4 sm:px-6 lg:px-8 border-b border-stone-800 text-[11px] font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-amber-400 font-bold shrink-0">ScamRoad</span>
            <span className="text-stone-600 hidden sm:inline">•</span>
            <span className="text-stone-400 truncate">
              Student Research Project (B.Tech CSE) · Edge AI Road Defect Detection
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-[10px] text-stone-400 font-mono ml-3">
            <span className="hidden md:inline">IRC:82-2023 Guidelines</span>
            <Link to="/evaluation" className="text-amber-400 hover:underline">
              Model Proofs (85.8% mAP) &rarr;
            </Link>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="w-full bg-[#FFF8EC]/95 dark:bg-[#0A0C12]/95 backdrop-blur-md border-b border-[#EBD9B8] dark:border-stone-800 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="flex items-center justify-between h-15 gap-4">
            {/* Left: Clean Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <Logo showWordmark={false} size="sm" />
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg tracking-tight text-stone-900 dark:text-stone-100 font-signboard">
                    Scam<span className="text-amber-500">Road</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-mono">
                    v1.2
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium hidden sm:inline -mt-0.5">
                  Road Defect &amp; Pothole AI
                </span>
              </div>
            </Link>

            {/* Center: Clean 5 Core Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-[#FFF0D6]/60 dark:bg-stone-900/60 p-1 rounded-xl border border-[#EBD9B8] dark:border-stone-800">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-white dark:bg-stone-950 text-amber-600 dark:text-amber-400 shadow-xs border border-amber-500/30 font-black"
                        : "text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-800/50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-500" : "text-stone-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Language Switcher */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold border border-stone-200 dark:border-stone-700 transition"
                  aria-label="Select Language"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-mono text-xs">{currentOption.nativeName}</span>
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-stone-900 border border-[#EBD9B8] dark:border-stone-700 rounded-xl shadow-xl py-1 z-50">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between transition ${
                          language === lang.code
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold"
                            : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        <span className="text-[10px] font-mono opacity-60 uppercase">{lang.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Switcher */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition"
                aria-label="Toggle Theme"
                title={theme === "dark" ? "Light theme" : "Dark theme"}
              >
                {theme === "dark" ? (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                )}
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b border-[#EBD9B8] dark:border-stone-800 px-4 py-3 shadow-lg">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 p-2.5 rounded-lg text-xs font-bold ${
                      isActive
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40"
                        : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-amber-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="pt-2 mt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-around text-xs">
              {secondaryLinks.map((s) => (
                <Link key={s.to} to={s.to} className="text-stone-500 hover:text-amber-500 font-medium py-1">
                  {s.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A0C12]/95 backdrop-blur-md border-t border-[#EBD9B8] dark:border-stone-800 px-2 py-1.5 shadow-lg safe-area-pb">
        <div className="flex items-center justify-around">
          <Link
            to="/"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-bold ${
              location.pathname === "/"
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Overview</span>
          </Link>
          <Link
            to="/scanner"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-bold ${
              location.pathname === "/scanner"
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan</span>
          </Link>
          <Link
            to="/defects"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-bold ${
              location.pathname === "/defects"
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Defects</span>
          </Link>
          <Link
            to="/maintenance"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-bold ${
              location.pathname === "/maintenance"
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Orders</span>
          </Link>
        </div>
      </div>
    </>
  );
};
