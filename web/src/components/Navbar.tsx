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
  Search,
  Sparkles,
} from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { Logo } from "./Logo";
import { PatternBand } from "../ui/PatternBand";
import { THEME_DEFINITIONS, ThemePreset } from "../ui/tokens";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme, themePreset, setThemePreset } = useTheme();
  const { language, setLanguage, t, currentOption } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Core essential navigation links
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
    { to: "/design-lab", label: "Theme Design Lab" },
  ];

  const themeKeys: ThemePreset[] = [
    "holi-highway",
    "truck-art-neon",
    "monsoon-dusk",
    "punjab-fields",
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#FFFDF7] dark:bg-[#0D1017] shadow-sm">
        {/* Subtle Single-Line Disclaimer Banner */}
        <div className="w-full bg-stone-950 text-stone-300 py-1.5 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 border-b border-stone-800 text-[11px] font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-amber-400 font-bold shrink-0">ScamRoad</span>
            <span className="text-stone-600 hidden sm:inline">•</span>
            <span className="text-stone-400 truncate">
              Student Research Project (B.Tech CSE) · Edge AI Road Defect Detection
            </span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-[10px] text-stone-400 font-mono ml-3">
            <Link to="/design-lab" className="text-purple-400 hover:underline hidden md:inline">
              Design Lab &rarr;
            </Link>
            <span className="hidden md:inline">IRC:82-2023 Guidelines</span>
            <Link to="/evaluation" className="text-amber-400 hover:underline">
              Model Proofs (85.8% mAP) &rarr;
            </Link>
          </div>
        </div>

        {/* Regional Folk Art Pattern Band with solid background to prevent scroll bleed */}
        <div className="bg-[#FFFDF7] dark:bg-[#0D1017] w-full">
          <PatternBand regional height={6} opacity={0.5} />
        </div>

        {/* Main Navbar */}
        <div className="w-full bg-[#FFFDF7] dark:bg-[#0D1017] border-b border-[#EBD9B8] dark:border-stone-800 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
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
              {/* Command Palette Trigger */}
              <button
                onClick={() => {
                  window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true }));
                }}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-xs font-mono transition"
                title="Open Command Palette (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-bold">⌘K</span>
              </button>

              {/* Theme Palette Chooser */}
              <div className="relative" ref={themeDropdownRef}>
                <button
                  onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold border border-stone-200 dark:border-stone-700 transition"
                  aria-label="Select Theme"
                  title="Switch vibrant theme"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden xl:inline text-xs">{THEME_DEFINITIONS[themePreset].name}</span>
                </button>

                {themeDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-stone-900 border border-[#EBD9B8] dark:border-stone-700 rounded-xl shadow-xl p-2 z-50 space-y-1">
                    <span className="text-[10px] uppercase font-mono font-black text-stone-400 px-2 block mb-1">
                      Vibrant Themes
                    </span>
                    {themeKeys.map((key) => {
                      const def = THEME_DEFINITIONS[key];
                      const isSelected = themePreset === key;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setThemePreset(key);
                            setThemeDropdownOpen(false);
                          }}
                          className={`w-full px-2.5 py-2 text-left rounded-lg text-xs flex items-center justify-between transition ${
                            isSelected
                              ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold"
                              : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{def.name}</span>
                            <div className="flex items-center gap-1 mt-1">
                              {def.swatches.map((swatch, idx) => (
                                <div
                                  key={idx}
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: swatch }}
                                />
                              ))}
                            </div>
                          </div>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Language Switcher */}
              <div className="relative" ref={langDropdownRef}>
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

              {/* Light / Dark Mode Toggle */}
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
            <div className="flex flex-col gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition ${
                      isActive
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-amber-500" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-stone-200 dark:border-stone-800">
              <span className="text-[10px] font-black uppercase text-stone-400 font-mono block mb-1">
                More Portals
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {secondaryLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 hover:text-amber-500 transition font-medium"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
