import React, { useState } from "react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { TrendingUp, Download, FileText, AlertTriangle, ShieldCheck } from "../components/Icons";

export const ForecastsPage: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>("seg-gt-bypass");

  // Sample data conforming to Rule R6: Observations strictly separate from forecasts
  const observedHistory = [
    { date: "Day -60", observedHealth: 92.0, forecastHealth: null, ciLow: null, ciHigh: null },
    { date: "Day -45", observedHealth: 88.5, forecastHealth: null, ciLow: null, ciHigh: null },
    { date: "Day -30", observedHealth: 85.0, forecastHealth: null, ciLow: null, ciHigh: null },
    { date: "Day -15", observedHealth: 82.0, forecastHealth: null, ciLow: null, ciHigh: null },
    { date: "Today", observedHealth: 79.5, forecastHealth: 79.5, ciLow: 79.5, ciHigh: 79.5 },
    { date: "+30 Days", observedHealth: null, forecastHealth: 74.2, ciLow: 70.8, ciHigh: 77.6 },
    { date: "+60 Days", observedHealth: null, forecastHealth: 69.1, ciLow: 62.5, ciHigh: 75.7 },
    { date: "+90 Days", observedHealth: null, forecastHealth: 63.8, ciLow: 54.2, ciHigh: 73.4 },
  ];

  const segments = [
    { id: "seg-gt-bypass", name: "Grand Trunk Road (Km 12-16)", health: 79.5, status: "OK", decayRate: "-0.18/day" },
    { id: "seg-mall-rd", name: "Mall Road Sector 4", health: 88.0, status: "OK", decayRate: "-0.11/day" },
    { id: "seg-ind-area", name: "Focal Point Heavy Corridor", health: 58.2, status: "CRITICAL_DECAY", decayRate: "-0.32/day" },
    { id: "seg-ring-rd", name: "Southern Ring Road", health: null, status: "INSUFFICIENT_DATA", decayRate: "N/A" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            Road Health Index & Degradation Forecasting
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Predictive deterioration modeling (Rule R6: forecasts visually and architecturally separated from verified observations).
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <a
            href="http://localhost:8000/api/v1/reports/defects.csv"
            download
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export Defects CSV
          </a>
          <a
            href="http://localhost:8000/api/v1/reports/executive-summary"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Executive Brief JSON
          </a>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Citywide Average RHI</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 font-mono">78.4</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Good</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">SPEC B8 Length-Weighted Rollup</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Deterioration Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-600 font-mono">-0.16</span>
            <span className="text-xs text-slate-500">pts / day</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Baseline Linear Model v1.0</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Recent Rainfall (Open-Meteo)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-blue-600 font-mono">12.4</span>
            <span className="text-xs text-slate-500">mm / 24h</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Moderate moisture distress factor</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rule R6 Compliance</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-lg font-black text-emerald-800 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Strict Separation
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Separate tables & confidence intervals</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Forecasting Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Road Degradation Projection (90-Day Horizon)
              </h2>
              <p className="text-xs text-slate-500">
                Solid emerald line shows verified historical observations; dashed blue line shows projected decay with 90% confidence envelope.
              </p>
            </div>
            <span className="text-xs font-bold font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200">
              baseline_linear_v1
            </span>
          </div>

          <div className="h-80 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={observedHistory} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis domain={[40, 100]} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />

                {/* 90% Confidence Interval Band */}
                <Area
                  type="monotone"
                  dataKey="ciHigh"
                  stroke="none"
                  fill="#38bdf8"
                  fillOpacity={0.15}
                  name="90% Confidence Interval"
                />

                {/* Verified Past Observations (Solid Emerald) */}
                <Line
                  type="monotone"
                  dataKey="observedHealth"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#059669" }}
                  name="Verified Observed Health (Historical)"
                />

                {/* Projected Future Degradation (Dashed Blue) */}
                <Line
                  type="monotone"
                  dataKey="forecastHealth"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: "#2563eb" }}
                  name="Projected Health Forecast (Rule R6)"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Road Segment Selection & Status List */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 mb-3">Road Segments</h3>
            <div className="space-y-2.5">
              {segments.map((seg) => (
                <button
                  key={seg.id}
                  onClick={() => setSelectedSegment(seg.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${
                    selectedSegment === seg.id
                      ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{seg.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        seg.status === "OK"
                          ? "bg-emerald-100 text-emerald-800"
                          : seg.status === "CRITICAL_DECAY"
                          ? "bg-red-100 text-red-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {seg.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-2 flex justify-between font-mono">
                    <span>RHI: {seg.health !== null ? `${seg.health} / 100` : "NULL"}</span>
                    <span>Decay: {seg.decayRate}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rule R6 & R7 Explanatory Alert Card */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              Non-Negotiable Guardrails
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              <strong>Rule R6:</strong> Observations $\ne$ forecasts. Historical points are immutable facts; forecasts are model estimates stored in distinct tables with target horizons.
            </p>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              <strong>Rule R7:</strong> Segments without inspection history return <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">INSUFFICIENT_DATA</code> with score <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">NULL</code>, never synthesized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
