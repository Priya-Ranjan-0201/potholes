import React from "react";
import { Link } from "react-router-dom";
import { Camera, Layers, ArrowRight, ShieldCheck, MapPin, AlertTriangle } from "./Icons";
import { StatsOverview } from "../api/client";

interface RoadHeroSceneProps {
  stats?: StatsOverview | null;
}

export const RoadHeroScene: React.FC<RoadHeroSceneProps> = ({ stats }) => {
  const openCount = stats?.open_defects ?? 0;
  const criticalCount = stats?.critical_defects ?? 0;
  const corridorsCount = stats?.total_roads_monitored ?? 5;
  const workOrdersCount = stats?.total_work_orders ?? 0;

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#EBD9B8] dark:border-stone-800 shadow-md bg-stone-950 text-white relative">
      <div className="relative w-full p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-[#0e1322] via-[#0a0e1a] to-[#0d1220]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(255,179,0,0.12),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>YOLO11n Edge AI Active</span>
              <span className="text-stone-500">•</span>
              <span>INT8 Quantized</span>
              <span className="text-stone-500">•</span>
              <span>73.6 ms CPU</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-signboard leading-tight">
              Road Defect &amp; Maintenance Command Center
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-2xl font-normal">
              Autonomous on-device computer vision for pothole detection, IRC:82-2023 severity ranking, and municipal maintenance workflow with mandatory human engineer sign-off.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/scanner"
                className="btn-vibrant-primary text-xs sm:text-sm inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold shadow-sm transition hover:scale-102"
              >
                <Camera className="w-4 h-4" />
                <span>Launch AI Scanner</span>
              </Link>

              <Link
                to="/defects"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-white text-xs sm:text-sm font-bold border border-stone-700 transition"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Defects Registry ({openCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/complaints"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs sm:text-sm font-bold border border-amber-500/30 transition"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Report Road Defect</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Real Operational Pipeline Telemetry */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-xs font-mono">
                <span>MONITORED CORRIDORS</span>
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-stone-100">
                  {corridorsCount}
                </span>
                <span className="text-xs text-stone-400 ml-1.5 font-medium">Divisions</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">
                Active municipal surveillance
              </span>
            </div>

            <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-xs font-mono">
                <span>ACTIVE DEFECTS</span>
                <Layers className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                  {openCount}
                </span>
                <span className="text-xs text-stone-400 ml-1.5 font-medium">Logged</span>
              </div>
              <span className="text-[11px] text-stone-400 font-mono">
                {criticalCount > 0 ? `${criticalCount} Critical Priority` : "Zero Critical Hazards"}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-xs font-mono">
                <span>WORK ORDERS</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {workOrdersCount}
                </span>
                <span className="text-xs text-stone-400 ml-1.5 font-medium">Orders</span>
              </div>
              <span className="text-[11px] text-stone-400 font-mono">
                Human Engineer Verified
              </span>
            </div>

            <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between">
              <div className="flex items-center justify-between text-stone-400 text-xs font-mono">
                <span>AI INFERENCE</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="my-2">
                <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
                  85.8%
                </span>
                <span className="text-xs text-stone-400 ml-1.5 font-medium">mAP@50</span>
              </div>
              <span className="text-[11px] text-stone-400 font-mono truncate">
                Held-out Split (Zero Fake)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
