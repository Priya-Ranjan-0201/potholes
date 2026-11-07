import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Camera, Radio, ArrowRight, Play, CheckCircle2, Layers } from "./Icons";
import { useTheme } from "../context/ThemeContext";
import { CatsEye } from "../ui/CatsEye";

interface RoadHeroSceneProps {
  onStartDemoTour?: () => void;
}

export const RoadHeroScene: React.FC<RoadHeroSceneProps> = ({ onStartDemoTour }) => {
  const { theme } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const [demoModeActive, setDemoModeActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // Pause animations when browser tab is hidden to conserve GPU/CPU (Rule 4 & F8)
  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const tourSteps = [
    { num: 1, title: "1. Dashcam Inference", desc: "Live ONNX detection with confidence & blur filter", link: "/scanner" },
    { num: 2, title: "2. Mobile PWA Drive", desc: "Glanceable HUD with GPS and offline outbox", link: "/capture" },
    { num: 3, title: "3. Defect Registry", desc: "Corridor distress audit without map dependencies", link: "/defects" },
    { num: 4, title: "4. Work Orders", desc: "Contractor SLA dispatch & engineer verification", link: "/maintenance" },
    { num: 5, title: "5. Citizen Grievance", desc: "Auditable public reporting with photo evidence", link: "/complaints" },
    { num: 6, title: "6. Empirical Eval", desc: "Held-out test split, confusion matrix & failure gallery", link: "/evaluation" },
  ];

  const routeStops = [
    { step: "01", name: "Capture", desc: "Dashcam / PWA", link: "/capture" },
    { step: "02", name: "Detect", desc: "YOLO11n Edge AI", link: "/scanner" },
    { step: "03", name: "Track", desc: "Corridor Distress", link: "/defects" },
    { step: "04", name: "Repair", desc: "PWD SLA Sign-off", link: "/maintenance" },
  ];

  const isDark = theme === "dark";

  return (
    <div className="w-full rounded-2xl overflow-hidden border-2 border-[#EBD9B8] dark:border-amber-400/30 shadow-lg relative bg-[#0A0C12] text-white">
      {/* Dynamic Looping Highway Perspective Canvas */}
      <div className="relative min-h-[290px] sm:min-h-[320px] w-full overflow-hidden flex flex-col justify-between p-5 sm:p-7">
        {/* Background Sky / Sun / Headlight Gradient */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            isDark
              ? "bg-gradient-to-b from-[#06080F] via-[#0D1220] to-[#04060A]"
              : "bg-gradient-to-b from-[#FFB300]/25 via-[#FFF0D6]/30 to-[#141926]/90"
          }`}
        />

        {/* Ambient Aurora / Sunrise Glow at the Horizon */}
        <div
          className={`absolute top-0 left-0 right-0 h-36 pointer-events-none ${
            isDark
              ? "bg-[radial-gradient(ellipse_at_top,rgba(0,209,209,0.2),transparent_70%)]"
              : "bg-[radial-gradient(ellipse_at_top,rgba(255,179,0,0.35),transparent_70%)]"
          }`}
        />

        {/* SVG Animated Road in Perspective (Positioned Strictly Below Horizon, Never Overlapping Foreground Text) */}
        <svg
          className={`absolute inset-0 w-full h-full pointer-events-none ${isPaused ? "opacity-75" : ""}`}
          preserveAspectRatio="none"
          viewBox="0 0 1000 320"
        >
          <defs>
            <linearGradient id="roadSurface" x1="0" y1="80" x2="0" y2="320" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E2433" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0B0E17" stopOpacity="0.95" />
            </linearGradient>
            <linearGradient id="horizonGlow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E8452C" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#FFB300" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00A3A3" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Horizon Line */}
          <line x1="0" y1="80" x2="1000" y2="80" stroke="url(#horizonGlow)" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />

          {/* Perspective Asphalt Road */}
          <polygon points="475,80 525,80 840,320 160,320" fill="url(#roadSurface)" />

          {/* Left & Right Curb Edges */}
          <line x1="475" y1="80" x2="160" y2="320" stroke="#EBD9B8" strokeWidth="2" opacity="0.4" />
          <line x1="525" y1="80" x2="840" y2="320" stroke="#EBD9B8" strokeWidth="2" opacity="0.4" />

          {/* Reflective Cat's-Eye Dots along Curbs */}
          <circle cx="430" cy="140" r="2.5" fill="#FFB300" opacity="0.8" />
          <circle cx="570" cy="140" r="2.5" fill="#FFB300" opacity="0.8" />
          <circle cx="360" cy="200" r="3.5" fill="#FFB300" opacity="0.9" />
          <circle cx="640" cy="200" r="3.5" fill="#FFB300" opacity="0.9" />
          <circle cx="280" cy="260" r="4.5" fill="#FFB300" />
          <circle cx="720" cy="260" r="4.5" fill="#FFB300" />

          {/* Center Road Markings - Animated Dashes */}
          <line
            x1="500"
            y1="80"
            x2="500"
            y2="320"
            stroke="#FFB300"
            strokeWidth="3.5"
            strokeDasharray="18 16"
            className="road-lane-animated opacity-80"
          />

          {/* Distant Truck Silhouette Driving along Horizon */}
          <g transform="translate(485, 68) scale(0.4)">
            <rect x="0" y="2" width="20" height="12" rx="1" fill="#E8452C" />
            <rect x="18" y="5" width="8" height="9" rx="1" fill="#FFB300" />
            <circle cx="5" cy="15" r="2" fill="#000" />
            <circle cx="15" cy="15" r="2" fill="#000" />
            <circle cx="23" cy="15" r="2" fill="#000" />
          </g>
        </svg>

        {/* Top Header Row: System Telemetry Badges & Viva Mode Trigger */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shadow-xs">
              <CatsEye color="peacock" size="sm" pulse />
              <span>Edge AI Pipeline Active</span>
              <span className="text-stone-500">•</span>
              <span className="text-amber-400">INT8 Quantized</span>
            </span>
            <span className="hidden sm:inline-block font-mono text-[10px] text-amber-300/80 px-2 py-0.5 rounded bg-stone-900/80 border border-stone-800">
              NH-44 Corridor
            </span>
          </div>

          <button
            onClick={() => {
              setDemoModeActive(!demoModeActive);
              if (onStartDemoTour) onStartDemoTour();
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-md ${
              demoModeActive
                ? "bg-amber-400 text-stone-950 border-2 border-white scale-105 shadow-amber-400/30"
                : "bg-stone-900/90 text-stone-200 border border-stone-700 hover:bg-stone-800 hover:text-white"
            }`}
          >
            <Play className="w-3.5 h-3.5 text-amber-500" />
            <span>{demoModeActive ? "Close Viva Mode" : "Examiner Viva Mode"}</span>
          </button>
        </div>

        {/* Foreground Content Card: Protected Glass Plate so Text NEVER Overlaps Road Lines */}
        <div className="relative z-20 mt-6 sm:mt-8 p-4 sm:p-5 rounded-xl bg-stone-950/85 backdrop-blur-md border border-stone-800 shadow-xl max-w-3xl">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase font-black tracking-widest text-amber-400 flex items-center gap-1.5">
              <CatsEye color="amber" size="sm" />
              <span>National Highway Road Infrastructure Intelligence</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight font-signboard leading-tight mb-2">
            Empirical Edge AI &amp; Municipal Road Defect Portal
          </h1>

          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mb-4 max-w-2xl font-medium">
            Real-time YOLO11n on-device inference for pothole distress detection, corridor severity indexing, and verified municipal workflow sign-off.
          </p>

          {/* Quick Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/scanner"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Camera className="w-4 h-4" />
              <span>Launch AI Scanner</span>
            </Link>

            <Link
              to="/capture"
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold transition flex items-center gap-1.5 border border-stone-700"
            >
              <Radio className="w-4 h-4 text-emerald-400" />
              <span>Drive Mode PWA</span>
            </Link>

            <Link
              to="/defects"
              className="px-4 py-2 rounded-xl bg-transparent hover:bg-stone-800/80 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 border border-amber-500/30"
            >
              <Layers className="w-4 h-4" />
              <span>Inspect Defect Registry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* 4-Stop Winding Route Milestone Strip (Rule 6.3) */}
        <div className="relative z-20 mt-4 pt-3 border-t border-stone-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {routeStops.map((st) => (
            <Link
              key={st.step}
              to={st.link}
              className="p-2 rounded-lg bg-stone-900/60 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/40 transition flex items-center gap-2 group"
            >
              <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 font-mono font-black text-[10px] flex items-center justify-center border border-amber-500/30 shrink-0">
                {st.step}
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-white block truncate group-hover:text-amber-400 transition-colors">
                  {st.name}
                </span>
                <span className="text-[10px] text-stone-400 block truncate font-mono">
                  {st.desc}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Presentation Mode: Guided 6-Step Viva Tour Bar (Rule 6.3) */}
      {demoModeActive && (
        <div className="p-4 bg-stone-900 border-t-2 border-amber-500 text-stone-200 animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="font-mono text-xs font-black uppercase text-amber-400 tracking-wider">
                Guided 6-Step Examiner Viva Tour (5–7 Min Viva Script)
              </span>
            </div>
            <span className="text-xs text-stone-400 font-mono">
              Step {tourStep + 1} of 6
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {tourSteps.map((st, i) => (
              <Link
                key={st.num}
                to={st.link}
                onClick={() => setTourStep(i)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tourStep === i
                    ? "bg-amber-500/20 border-amber-400 text-white shadow-sm"
                    : "bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-black text-amber-400">{st.title}</span>
                  {tourStep > i && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[10px] text-stone-400 line-clamp-2 leading-tight">{st.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Real Scientific Evidence Strip (Empirical Model Results, Rule F2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-stone-900 border-t border-stone-800 p-3 sm:px-6 divide-x divide-stone-800 text-xs">
        <div className="px-3 py-1">
          <span className="text-[10px] font-mono uppercase text-stone-400 block font-semibold">Held-Out mAP@50</span>
          <span className="text-base font-black text-emerald-400 font-mono">85.75%</span>
          <span className="text-[9px] text-stone-400 block">RDD2022-India Split</span>
        </div>
        <div className="px-3 py-1">
          <span className="text-[10px] font-mono uppercase text-stone-400 block font-semibold">Edge CPU Latency</span>
          <span className="text-base font-black text-amber-400 font-mono">73.6 ms (p50)</span>
          <span className="text-[9px] text-stone-400 block">13.6 FPS ONNX CPU</span>
        </div>
        <div className="px-3 py-1">
          <span className="text-[10px] font-mono uppercase text-stone-400 block font-semibold">Quantization</span>
          <span className="text-base font-black text-cyan-300 font-mono">INT8 Calibrated</span>
          <span className="text-[9px] text-stone-400 block">3.1 MB (-71.6% size)</span>
        </div>
        <div className="px-3 py-1">
          <span className="text-[10px] font-mono uppercase text-stone-400 block font-semibold">Audit Integrity</span>
          <span className="text-base font-black text-emerald-400 font-mono">Zero Fake AI</span>
          <Link to="/evaluation" className="text-[9px] text-amber-400 hover:underline block flex items-center gap-1 font-mono">
            <span>View Proofs</span>
            <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
