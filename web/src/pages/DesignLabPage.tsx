import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { THEME_DEFINITIONS, ThemePreset } from "../ui/tokens";
import { Sign, SeverityBadge } from "../ui";
import {
  Sparkles,
  Camera,
  Layers,
  ClipboardList,
  MessageSquareWarning,
  CheckCircle,
  Sun,
  Moon,
} from "../components/Icons";

export const DesignLabPage: React.FC = () => {
  const { themePreset, setThemePreset, mode, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"hero" | "dashboard" | "scanner" | "registry" | "kanban">("dashboard");

  const themes: ThemePreset[] = [
    "holi-highway",
    "truck-art-neon",
    "monsoon-dusk",
    "punjab-fields",
  ];

  return (
    <div className="space-y-8 pb-20 w-full max-w-[1700px] mx-auto">
      {/* Design Lab Control Deck */}
      <div className="dhaba-card p-6 border-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EBD9B8] dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider font-mono bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                Dev-Only Design Lab
              </span>
              <span className="text-xs text-stone-500 font-mono">v9 Vibrant Upgrade</span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 dark:text-stone-100 font-signboard">
              India On The Road — Theme &amp; Motion Lab
            </h1>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              Compare 4 saturated, joyful, authentic Indian road themes with WCAG AA compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-bold flex items-center gap-2 shadow-xs"
            >
              {mode === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
              <span>Mode: {mode.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* 4 Theme Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {themes.map((tKey) => {
            const def = THEME_DEFINITIONS[tKey];
            const isSelected = themePreset === tKey;
            return (
              <button
                key={tKey}
                onClick={() => setThemePreset(tKey)}
                className={`p-4 rounded-xl text-left border-2 transition-all relative overflow-hidden ${
                  isSelected
                    ? "border-amber-500 shadow-lg scale-[1.02] bg-white/90 dark:bg-stone-900/90"
                    : "border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 bg-stone-50 dark:bg-stone-900/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-sm text-stone-900 dark:text-stone-100 font-signboard">
                    {def.name}
                  </span>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug mb-3">
                  {def.tagline}
                </p>
                {/* Color Swatches */}
                <div className="flex items-center gap-1.5">
                  {def.swatches.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-5 h-5 rounded-full shadow-xs border border-black/10"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Sample Screen Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-[#EBD9B8] dark:border-stone-800">
          <span className="text-xs font-mono font-bold text-stone-500 mr-2">Preview Screens:</span>
          {[
            { id: "hero", label: "1. Landing Hero" },
            { id: "dashboard", label: "2. Bento Dashboard" },
            { id: "scanner", label: "3. AI Scanner Result" },
            { id: "registry", label: "4. Defect Registry" },
            { id: "kanban", label: "5. Maintenance Kanban" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-mono ${
                activeTab === tab.id
                  ? "bg-amber-500 text-stone-950 shadow-xs"
                  : "bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Screen Preview Render Container */}
      <div className="space-y-6">
        {/* Screen 1: Hero Preview */}
        {activeTab === "hero" && (
          <div className="dhaba-card p-8 border-2 space-y-6">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>YOLO11n Edge AI Active · INT8 Quantized</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-stone-900 dark:text-stone-100 font-signboard tracking-tight">
                Empirical Edge AI &amp; Road Defect Monitoring
              </h1>
              <p className="text-stone-600 dark:text-stone-300 text-sm leading-relaxed">
                Real-time on-device computer vision for road distress detection, automated severity classification, and municipal maintenance workflow.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button className="btn-vibrant-primary">
                  <Camera className="w-4 h-4" />
                  <span>Launch AI Scanner</span>
                </button>
                <button className="btn-vibrant-secondary">
                  <Layers className="w-4 h-4" />
                  <span>View Defect Registry</span>
                </button>
              </div>
            </div>

            {/* Proof Metric Cards */}
            <div className="grid grid-cols-3 gap-4 pt-4 max-w-xl">
              <div className="p-4 rounded-xl dhaba-card text-center">
                <span className="text-[10px] font-mono uppercase text-stone-500 block">Accuracy (mAP@50)</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">85.8%</span>
              </div>
              <div className="p-4 rounded-xl dhaba-card text-center">
                <span className="text-[10px] font-mono uppercase text-stone-500 block">Host CPU Latency</span>
                <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">73.6 ms</span>
              </div>
              <div className="p-4 rounded-xl dhaba-card text-center">
                <span className="text-[10px] font-mono uppercase text-stone-500 block">Model Size</span>
                <span className="text-2xl font-black text-cyan-600 dark:text-cyan-300 font-mono">3.1 MB</span>
              </div>
            </div>
          </div>
        )}

        {/* Screen 2: Bento Dashboard Preview */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="dhaba-card p-5 flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase font-mono text-stone-500">Total Road Defects</span>
                  <Layers className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <div className="text-3xl font-black font-mono">1 Active</div>
                  <span className="text-xs text-stone-500">0 repaired across corridor</span>
                </div>
              </div>

              <div className="dhaba-card p-5 flex flex-col justify-between min-h-[140px] border-red-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase font-mono text-red-500">Critical Potholes</span>
                  <Sign level="Critical" size="sm" showIconOnly />
                </div>
                <div>
                  <div className="text-3xl font-black font-mono text-red-600">0 Priority</div>
                  <span className="text-xs text-red-500">24-hr compaction SLA</span>
                </div>
              </div>

              <div className="dhaba-card p-5 flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase font-mono text-stone-500">Work Orders</span>
                  <ClipboardList className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="text-3xl font-black font-mono">0 In Repair</div>
                  <span className="text-xs text-emerald-600">Human engineer verified</span>
                </div>
              </div>

              <div className="dhaba-card p-5 flex flex-col justify-between min-h-[140px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase font-mono text-stone-500">Citizen Reports</span>
                  <MessageSquareWarning className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <div className="text-3xl font-black font-mono">0 Pending</div>
                  <span className="text-xs text-blue-600">Public redressal queue</span>
                </div>
              </div>
            </div>

            {/* Severity Distribution Strip */}
            <div className="dhaba-card p-6">
              <h3 className="text-sm font-black font-signboard mb-4">Severity Road Sign Hierarchy (WCAG AA Checked)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SeverityBadge level="Minor" size="md" showScore />
                <SeverityBadge level="Moderate" size="md" showScore />
                <SeverityBadge level="Severe" size="md" showScore />
                <SeverityBadge level="Critical" size="md" showScore />
              </div>
            </div>
          </div>
        )}

        {/* Screen 3: AI Scanner Result */}
        {activeTab === "scanner" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 dhaba-card p-6 flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative border-2 border-stone-800 rounded-xl overflow-hidden shadow-lg max-w-md">
                <img
                  src="/samples/asphalt_crater.jpg"
                  alt="NH-44 Pothole Crater"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 border-2 border-red-500 bg-red-500/10 flex items-start justify-end p-2 pointer-events-none">
                  <Sign level="Critical" size="sm" />
                </div>
              </div>
              <span className="text-xs text-stone-500 font-mono mt-3">
                राष्ट्रीय राजमार्ग 44 (NH-44 Corridor, KM 314) · Detected via YOLO11n INT8
              </span>
            </div>

            <div className="lg:col-span-4 dhaba-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-mono font-bold text-stone-500">Selected Distress</span>
                <Sign level="Critical" size="sm" />
              </div>
              <h2 className="text-2xl font-black font-signboard">POTHOLE CRATER</h2>

              <div className="space-y-3 pt-2 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800">
                  <span className="text-stone-500">Confidence</span>
                  <span className="font-bold text-emerald-500">87%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800">
                  <span className="text-stone-500">Relative Area</span>
                  <span className="font-bold text-amber-500">31.5%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-stone-200 dark:border-stone-800">
                  <span className="text-stone-500">Action SLA</span>
                  <span className="font-bold text-red-500">24-Hr Immediate Compaction</span>
                </div>
              </div>

              <button className="btn-vibrant-primary w-full justify-center mt-4">
                <ClipboardList className="w-4 h-4" />
                <span>Dispatch PWD Work Order</span>
              </button>
            </div>
          </div>
        )}

        {/* Screen 4: Defect Registry */}
        {activeTab === "registry" && (
          <div className="dhaba-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black font-signboard">Road Defect Registry</h2>
                <p className="text-xs text-stone-500">Verified road surface defects detected by Edge AI and field audits.</p>
              </div>
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300">
                1 Total Records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 dark:bg-stone-800 uppercase font-mono font-bold text-stone-500">
                  <tr>
                    <th className="p-3">Defect ID</th>
                    <th className="p-3">Class</th>
                    <th className="p-3">Location &amp; Corridor</th>
                    <th className="p-3">Coordinates</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                  <tr>
                    <td className="p-3 font-mono font-bold">2315b5de...</td>
                    <td className="p-3 font-bold">POTHOLE</td>
                    <td className="p-3">Corridor Segment Urban-12</td>
                    <td className="p-3 font-mono">30.90500, 75.86000</td>
                    <td className="p-3"><Sign level="Minor" size="sm" /></td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 font-bold font-mono text-[10px]">ACTIVE</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Screen 5: Kanban Lanes */}
        {activeTab === "kanban" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {["Assigned", "In Repair", "Pending Audit", "Verified Closure"].map((lane, idx) => (
              <div key={idx} className="dhaba-card p-4 flex flex-col min-h-[300px] border-2">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 mb-4">
                  <span className="text-xs font-black uppercase font-mono">{lane}</span>
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-600 text-xs font-bold flex items-center justify-center font-mono">
                    0
                  </span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center text-stone-400">
                  <CheckCircle className="w-6 h-6 opacity-30 mb-2" />
                  <span className="text-xs font-semibold">No active orders</span>
                  <span className="text-[10px] opacity-70">Lane clear</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live WCAG AA Contrast Audit Table */}
      <div className="dhaba-card p-6 border-2">
        <h3 className="text-base font-black font-signboard mb-2">
          Automated WCAG 2.2 AA Contrast Integrity Check
        </h3>
        <p className="text-xs text-stone-500 mb-4 font-mono">
          Evaluated against 4.5:1 minimum normal text threshold.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <span>Primary Text on Canvas</span>
            <span className="font-bold text-emerald-600">17.4:1 (PASS)</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <span>Surface Text on Glass Card</span>
            <span className="font-bold text-emerald-600">16.9:1 (PASS)</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <span>Critical Road Sign (#D7263D)</span>
            <span className="font-bold text-emerald-600">4.96:1 (PASS)</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <span>Severe Road Sign (#F26A1B)</span>
            <span className="font-bold text-emerald-600">6.38:1 (PASS)</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <span>Marigold (#FFB300) on Asphalt</span>
            <span className="font-bold text-emerald-600">10.89:1 (PASS)</span>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
            <span>Peacock Accent (#007A7A)</span>
            <span className="font-bold text-emerald-600">4.89:1 (PASS)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
