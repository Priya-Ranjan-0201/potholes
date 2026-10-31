import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Compass,
  MapPin,
  AlertTriangle,
  ClipboardList,
  MessageSquareWarning,
  Radio,
  UserCheck,
  Sliders,
  Cpu,
  TrendingUp,
} from "./Icons";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { activeRole, switchDemoRole } = useAuth();

  const navLinks = [
    { to: "/", label: "Overview", icon: Compass },
    { to: "/map", label: "GIS Map", icon: MapPin },
    { to: "/inspection", label: "Inspection", icon: Sliders },
    { to: "/defects", label: "Defects", icon: AlertTriangle },
    { to: "/maintenance", label: "Work Orders", icon: ClipboardList },
    { to: "/complaints", label: "Citizen Reports", icon: MessageSquareWarning },
    { to: "/forecasts", label: "Forecasts", icon: TrendingUp },
    { to: "/fleet", label: "Edge Fleet", icon: Radio },
    { to: "/models", label: "AI Models", icon: Cpu },
  ];

  const roleColors: Record<string, string> = {
    admin: "bg-purple-100 text-purple-800 border-purple-300",
    engineer: "bg-blue-100 text-blue-800 border-blue-300",
    contractor: "bg-amber-100 text-amber-800 border-amber-300",
    citizen: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Branding Banner with SPEC Tagline */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>
          <strong className="text-white uppercase tracking-wider mr-1">ScamRoad:</strong>
          &ldquo;Deploying advanced space technology to map road craters so deep you don&apos;t need a rocket to visit the Moon.&rdquo;
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-md">
                SR
              </div>
              <div>
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">ScamRoad</span>
                <span className="text-xs block text-slate-400 font-medium -mt-1">Edge AI Pothole Tracking</span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Role Indicator & Demo Role Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <div className="text-right">
                <span className="text-xs text-slate-500 block leading-tight">Active Role</span>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-bold uppercase rounded border ${
                    roleColors[activeRole] || "bg-slate-100 text-slate-700 border-slate-300"
                  }`}
                >
                  {activeRole}
                </span>
              </div>
            </div>

            {/* Quick Demo Role Selector */}
            <select
              aria-label="Demo role selector"
              value={activeRole}
              onChange={(e) => switchDemoRole(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            >
              <option value="admin">Switch: Admin</option>
              <option value="engineer">Switch: Engineer</option>
              <option value="contractor">Switch: Contractor</option>
              <option value="citizen">Switch: Citizen</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
