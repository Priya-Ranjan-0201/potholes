import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  Camera,
  ClipboardList,
  MessageSquareWarning,
  Layers,
  Cpu,
  Menu,
  X,
  AlertTriangle,
  BarChart3,
  Radio,
  Sun,
  Moon,
  Globe,
} from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage, LANGUAGES, LanguageCode } from "../context/LanguageContext";
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

  const navLinks = [
    { to: "/", label: t("navOverview"), icon: Compass },
    { to: "/scanner", label: t("navScanner"), icon: Camera },
    { to: "/maintenance", label: t("navWorkOrders"), icon: ClipboardList },
    { to: "/complaints", label: t("navComplaints"), icon: MessageSquareWarning },
    { to: "/defects", label: t("navDefects"), icon: Layers },
    { to: "/models", label: t("navModels"), icon: Cpu },
    { to: "/evaluation", label: t("navEvaluation"), icon: BarChart3 },
    { to: "/capture", label: t("navCapture"), icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs border-b border-slate-200/90 dark:border-slate-800 transition-colors duration-300">
      {/* Student Research Disclaimer & Standards Notice Ticker */}
      <div className="bg-slate-950 text-slate-300 py-1.5 px-4 sm:px-6 lg:px-8 xl:px-10 text-[11px] font-medium border-b border-slate-800/80">
        <div className="w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="text-amber-400 font-extrabold tracking-wider">{t("appName")}</span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 truncate hidden sm:inline">{t("govtBanner")}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
              ● {t("standardsNotice")}
            </span>
            <span className="text-slate-400 font-mono text-[10px]">{t("helplineText")}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex items-center justify-between min-h-[64px] py-2 gap-4">
          {/* Official Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <Logo showWordmark={false} size="md" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-black text-xl text-slate-900 dark:text-white tracking-tight">
                  Scam<span className="text-amber-500">Road</span>
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase">
                  {t("appHindiName")}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  v1.2.0
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider hidden md:block whitespace-nowrap">
                Edge AI Road Defect &amp; Municipal Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shrink-0">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-300/80 dark:border-slate-700 font-black"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-500" : "text-slate-400 dark:text-slate-500"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls: Lang Switcher, Theme Switcher, Quick CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
                title="Select Language / भाषा चुनें"
                aria-label="Select Language"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>{currentOption.flag}</span>
                <span className="hidden sm:inline font-semibold">{currentOption.nativeName}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                    {t("selectLanguage")}
                  </div>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as LanguageCode);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                        language === lang.code
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 font-bold"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </span>
                      <span className="text-[10px] opacity-70">({lang.label})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark/Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs"
              title={theme === "dark" ? t("themeLight") : t("themeDark")}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-once" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Quick 1-Click Action */}
            <Link
              to="/complaints"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black transition-all shadow-xs active:scale-98 whitespace-nowrap"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t("reportPotholeBtn")}</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (screens < lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold ${
                  isActive
                    ? "bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <Link
              to="/complaints"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
            >
              {t("reportPotholeBtn")}
            </Link>
            <Link
              to="/scanner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-amber-600 text-white"
            >
              {t("scanPhotoBtn")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
