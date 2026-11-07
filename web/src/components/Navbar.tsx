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
  BarChart3,
  Radio,
  Sun,
  Moon,
  Globe,
  Plus,
} from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { useLanguage, LANGUAGES } from "../context/LanguageContext";
import { Logo } from "./Logo";
import { CatsEye } from "../ui/CatsEye";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t, currentOption } = useLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [hornHonked, setHornHonked] = useState(false);
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

  // "Horn OK Please" Playful Easter Egg (Rule 2.8) - Visual Ripple Only, No Auto-play Audio
  const triggerHorn = (e: React.MouseEvent) => {
    e.preventDefault();
    setHornHonked(true);
    setTimeout(() => setHornHonked(false), 900);
  };

  const navLinks = [
    { to: "/", label: t("navOverview"), icon: Compass, km: "00" },
    { to: "/scanner", label: t("navScanner"), icon: Camera, km: "01" },
    { to: "/maintenance", label: t("navWorkOrders"), icon: ClipboardList, km: "02" },
    { to: "/complaints", label: t("navComplaints"), icon: MessageSquareWarning, km: "03" },
    { to: "/defects", label: t("navDefects"), icon: Layers, km: "04" },
    { to: "/models", label: t("navModels"), icon: Cpu, km: "05" },
    { to: "/evaluation", label: t("navEvaluation"), icon: BarChart3, km: "06" },
    { to: "/capture", label: t("navCapture"), icon: Radio, km: "07" },
  ];

  const currentRoute = navLinks.find((l) => l.to === location.pathname) || {
    label: "Roadway",
    km: "00",
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full transition-colors duration-200">
        {/* Ticker Banner: Pure Single-Line Student Research Disclaimer & Standards (Rule F3) */}
        <div className="w-full bg-[#0A0C12] text-[#F3EEE2] py-1.5 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20 text-[11px] font-medium">
          <div className="w-full flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden truncate">
              <CatsEye color="amber" size="sm" pulse />
              <span className="text-amber-400 font-extrabold tracking-wider shrink-0 uppercase">
                {t("appName")}
              </span>
              <span className="text-stone-600 hidden sm:inline">|</span>
              <span className="text-stone-300 truncate hidden sm:inline">
                {t("govtBanner")}
              </span>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-400 font-semibold font-mono text-[10px]">
                ● {t("standardsNotice")}
              </span>
              <span className="text-amber-300/80 font-mono text-[10px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                {t("helplineText")}
              </span>
            </div>
          </div>
        </div>

        {/* Main Highway Navigation Bar */}
        <div className="w-full bg-[#FFF8EC]/95 dark:bg-[#0A0C12]/95 backdrop-blur-md border-b-2 border-[#EBD9B8] dark:border-amber-400/20 px-4 sm:px-6 lg:px-8 shadow-xs">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand Identity + Horn OK Please Easter Egg */}
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/" className="flex items-center gap-2.5 group">
                <Logo showWordmark={false} size="md" />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-xl tracking-tight text-stone-900 dark:text-stone-100 font-signboard">
                      Scam<span className="text-amber-500">Road</span>
                    </span>
                    <button
                      onClick={triggerHorn}
                      title="Horn OK Please! Click for safe road greeting"
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded border transition-all duration-300 select-none ${
                        hornHonked
                          ? "bg-amber-400 text-stone-950 border-amber-300 scale-110 shadow-[0_0_12px_rgba(255,179,0,0.8)]"
                          : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                      }`}
                    >
                      {hornHonked ? "🎺 PEEP PEEP!" : "HORN OK"}
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono font-semibold">
                    NH-44 · KM {currentRoute.km}
                  </span>
                </div>
              </Link>
            </div>

            {/* Center Desktop Highway Exits Navigation */}
            <nav className="hidden xl:flex items-center gap-1 bg-[#FFF0D6]/70 dark:bg-stone-900/80 p-1 rounded-xl border border-[#EBD9B8] dark:border-stone-800 shrink-0">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? "bg-white dark:bg-stone-950 text-amber-600 dark:text-amber-400 shadow-xs border border-amber-500/40 font-black"
                        : "text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-stone-800/60"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-500" : "text-stone-400"}`} />
                    <span>{item.label}</span>
                    {isActive && <CatsEye color="amber" size="sm" />}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action Controls: Lang Switcher, Theme Switcher, Quick CTAs */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Language Switcher Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-xs font-bold border border-stone-200 dark:border-stone-700 transition"
                  aria-label="Select Language"
                >
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden sm:inline font-mono">{currentOption.nativeName}</span>
                  <span className="sm:hidden font-mono text-[11px] uppercase">{currentOption.code}</span>
                </button>

                {langDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-stone-900 border-2 border-[#EBD9B8] dark:border-stone-700 rounded-xl shadow-xl py-1 z-50 animate-fadeIn">
                    <div className="px-3 py-1 text-[10px] font-black uppercase text-stone-400 font-mono border-b border-stone-100 dark:border-stone-800">
                      Languages (भाषाएं)
                    </div>
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition ${
                          language === lang.code
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-black"
                            : "text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{lang.flag}</span>
                          <span>{lang.nativeName}</span>
                        </span>
                        <span className="text-[10px] font-mono opacity-60 uppercase">{lang.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle (Dhaba Dawn <-> Highway Night) */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 transition"
                title={theme === "dark" ? "Switch to Dhaba Dawn (Light)" : "Switch to Highway Night (Dark)"}
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </button>

              {/* Quick Report CTA */}
              <Link
                to="/complaints"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8452C] hover:bg-red-600 text-white text-xs font-black transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t("reportPotholeBtn")}</span>
              </Link>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-b-2 border-[#EBD9B8] dark:border-amber-400/20 px-4 py-3 shadow-lg">
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
          </div>
        )}
      </header>

      {/* Mobile Bottom Milestone Navigation Bar (Rule 6.1) */}
      <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A0C12]/95 backdrop-blur-md border-t-2 border-[#EBD9B8] dark:border-amber-400/20 px-2 py-1.5 shadow-lg safe-area-pb">
        <div className="flex items-center justify-around">
          <Link
            to="/scanner"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-bold ${
              location.pathname === "/scanner"
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            <Camera className="w-5 h-5" />
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
            <Layers className="w-5 h-5" />
            <span>Defects</span>
          </Link>
          <Link
            to="/"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-bold ${
              location.pathname === "/"
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            <Compass className="w-5 h-5" />
            <span>Overview</span>
          </Link>
          <Link
            to="/maintenance"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-bold ${
              location.pathname === "/maintenance"
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Orders</span>
          </Link>
          <Link
            to="/evaluation"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg text-[10px] font-bold ${
              location.pathname === "/evaluation"
                ? "text-amber-600 dark:text-amber-400 font-black"
                : "text-stone-500 dark:text-stone-400"
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Report</span>
          </Link>
        </div>
      </div>
    </>
  );
};
