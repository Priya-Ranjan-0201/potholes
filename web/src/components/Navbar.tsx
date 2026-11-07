import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  Camera,
  ClipboardList,
  MessageSquareWarning,
  Layers,
  Cpu,
  UploadCloud,
  Menu,
  X,
  AlertTriangle,
} from "./Icons";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Map is completely removed per user request
  const navLinks = [
    { to: "/", label: "डैशबोर्ड", subLabel: "Overview", icon: Compass },
    { to: "/scanner", label: "एआई स्कैनर", subLabel: "AI Vision", icon: Camera },
    { to: "/maintenance", label: "कार्य आदेश", subLabel: "Work Orders", icon: ClipboardList },
    { to: "/complaints", label: "नागरिक शिकायत", subLabel: "Grievances", icon: MessageSquareWarning },
    { to: "/defects", label: "दोष सूची", subLabel: "Defects", icon: Layers },
    { to: "/models", label: "एआई टेलीमेट्री", subLabel: "Models", icon: Cpu },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-200">
      {/* 🇮🇳 Tricolor National GovTech Micro Banner */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" />
      <div className="bg-slate-900 text-slate-300 py-1 px-4 sm:px-6 lg:px-8 text-[11px] font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold">🇮🇳 भारत सरकार</span>
            <span className="hidden sm:inline text-slate-500">|</span>
            <span className="hidden sm:inline text-slate-300">
              Ministry of Road Transport & Highways (MoRTH) & PWD Surveillance Mission
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-emerald-400 font-semibold">
              ● IRC:SP:84-2019 मानकीकृत
            </span>
            <span className="text-slate-400">24x7 हेल्पलाइन: 1800-ROAD-FIX</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Official Emblem & Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-amber-700 flex items-center justify-center text-white font-black text-base shadow-sm border border-amber-500/40 group-hover:scale-105 transition-transform">
                <span className="text-amber-400">स</span><span className="text-white text-xs">R</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-lg text-slate-900 tracking-tight">सड़क सुरक्षा</span>
                  <span className="text-xs font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    ScamRoad
                  </span>
                </div>
                <span className="text-[10px] block text-slate-500 font-semibold tracking-wider uppercase -mt-0.5">
                  National AI Pothole & Defect Redressal Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-sm border border-slate-300/80"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                  <span className="text-slate-900">{item.label}</span>
                  <span className="text-[10px] text-slate-400 font-medium">({item.subLabel})</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>YOLO11n INT8 (21 FPS)</span>
            </div>

            <Link
              to="/complaints"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300 transition-all shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>🚨 शिकायत दर्ज करें</span>
            </Link>

            <Link
              to="/scanner"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all shadow-sm border border-slate-700"
            >
              <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ स्कैन करें</span>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold ${
                  isActive
                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{item.subLabel}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <Link
              to="/complaints"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-amber-50 text-amber-900 border border-amber-200"
            >
              🚨 शिकायत दर्ज करें
            </Link>
            <Link
              to="/scanner"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-slate-900 text-white"
            >
              ⚡ स्कैन करें
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Quick Bottom Bar */}
      <div className="sm:hidden flex items-center justify-around py-1.5 border-t border-slate-200 bg-white">
        {navLinks.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 text-[10px] font-bold ${
                isActive ? "text-amber-600 font-extrabold" : "text-slate-500"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};
