import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  MapPin,
  Camera,
  ClipboardList,
  UploadCloud,
} from "./Icons";

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Overview", icon: Compass },
    { to: "/map", label: "Road Map", icon: MapPin },
    { to: "/scanner", label: "AI Scanner", icon: Camera },
    { to: "/maintenance", label: "Work Orders", icon: ClipboardList },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-lg shadow-xs group-hover:scale-105 transition-transform">
                SR
              </div>
              <div>
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">ScamRoad</span>
                <span className="text-[10px] block text-emerald-600 font-semibold tracking-wider uppercase -mt-1">
                  Edge AI Pothole Vision
                </span>
              </div>
            </Link>
          </div>

          {/* Clean Segmented Tab Navigation */}
          <nav className="hidden sm:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>YOLO11n INT8 (21 FPS)</span>
            </div>

            <Link
              to="/scanner"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Scan Photo</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="sm:hidden flex items-center justify-around py-2 border-t border-slate-100 bg-white">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium ${
                isActive ? "text-emerald-600 font-bold" : "text-slate-500"
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
