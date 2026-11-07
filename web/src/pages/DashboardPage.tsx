import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Layers,
  TrendingUp,
  Building2,
  ArrowRight,
  Activity,
  Radio,
  FileText,
} from "../components/Icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { useLanguage } from "../context/LanguageContext";
import { RoadHeroScene } from "../components/RoadHeroScene";
import { SeverityBadge, Sign, MilestoneHeader, CatsEye } from "../ui";

// Canonical Severity Colors adhering to config/severity_thresholds.json & Design System
const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#D7263D", // 76-100 (Red Octagon)
  Severe: "#F26A1B",   // 51-75 (Orange Diamond)
  Moderate: "#F2B705", // 26-50 (Yellow Triangle)
  Minor: "#1E78D0",    // 0-25 (Blue Circle)
};

export const DashboardPage: React.FC = () => {
  const { t } = useLanguage();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["statsOverview"],
    queryFn: api.getOverview,
    refetchInterval: 10000,
  });

  const { data: trendsData, isLoading: loadingTrends } = useQuery({
    queryKey: ["statsTrends"],
    queryFn: () => api.getTrends(14),
    refetchInterval: 10000,
  });

  const { data: wards, isLoading: loadingWards } = useQuery({
    queryKey: ["statsWards"],
    queryFn: api.getWards,
    refetchInterval: 15000,
  });

  if (loadingStats && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-stone-600 dark:text-stone-400 font-medium font-mono text-sm">
            Connecting to municipal road telemetry pipeline...
          </p>
        </div>
      </div>
    );
  }

  // Format data for severity pie chart
  const severityPieData = stats?.defects_by_severity
    ? Object.entries(stats.defects_by_severity).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  // Format data for defect class distribution
  const classBarData = stats?.defects_by_class
    ? Object.entries(stats.defects_by_class).map(([name, count]) => ({
        name: name.toUpperCase(),
        count,
      }))
    : [];

  // Ranked wards derived directly from live database records
  const sortedWards = [...(wards || [])].sort(
    (a, b) => b.critical_defects - a.critical_defects || b.total_defects - a.total_defects
  );

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Animated Road Perspective Scene Hero & Scientific Evidence Strip */}
      <RoadHeroScene />

      {/* Page Title & Milestone Header */}
      <div className="dhaba-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <MilestoneHeader km="00" title="Overview" highway="NH-44" variant="yellow" />
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 font-mono hidden md:inline">
              {t("standardsNotice")}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight font-signboard">
            Road Infrastructure Distress &amp; Maintenance Command Center
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            {t("dashboardSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/defects"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 hover:opacity-90 transition shadow-xs"
          >
            <span>{t("navDefects")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs font-mono">
            <CatsEye color="peacock" size="sm" pulse />
            <span>{t("telemetryOnline")}</span>
          </span>
        </div>
      </div>

      {/* 4 Balanced KPI Cards (Uniform Height & Road Sign Accents) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Road Defects */}
        <div className="dhaba-card p-5 flex flex-col justify-between min-h-[145px] hover:border-amber-500/60 transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
              {t("totalDefects")}
            </span>
            <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
              <Layers className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
                {stats?.total_defects ?? 0}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                {stats?.open_defects ?? 0} {t("activeDefects")}
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block font-medium truncate">
              {stats?.repaired_defects ?? 0} {t("repairedDefects")}
            </span>
          </div>
        </div>

        {/* Critical Potholes (24-hr Priority) */}
        <div className="dhaba-card p-5 flex flex-col justify-between min-h-[145px] border-red-500/30 hover:border-red-500 transition-all bg-red-500/[0.03]">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 font-mono flex items-center gap-1.5">
              <CatsEye color="red" size="sm" pulse />
              <span>{t("criticalPotholes")}</span>
            </span>
            <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 border border-red-500/30">
              <Sign level="Critical" size="sm" showIconOnly />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-600 dark:text-red-400 font-mono">
                {stats?.critical_defects ?? 0}
              </span>
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/20 text-red-700 dark:text-red-300 font-mono border border-red-500/40">
                24-Hr SLA
              </span>
            </div>
            <span className="text-xs text-red-700 dark:text-red-300 font-bold mt-1 block truncate">
              {t("immediateRemediation")}
            </span>
          </div>
        </div>

        {/* Citizen Grievances */}
        <div className="dhaba-card p-5 flex flex-col justify-between min-h-[145px] hover:border-amber-500/60 transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
              {t("citizenGrievances")}
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/30">
              <FileText className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
                {stats?.total_complaints ?? 0}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                {stats?.complaints_by_status?.["SUBMITTED"] ?? 0} Pending
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-1 block font-medium truncate">
              Public photo grievance audit
            </span>
          </div>
        </div>

        {/* PWD Work Orders */}
        <div className="dhaba-card p-5 flex flex-col justify-between min-h-[145px] hover:border-amber-500/60 transition-all">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
              {t("workOrdersDispatched")}
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/30">
              <Radio className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
                {stats?.total_work_orders ?? 0}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {stats?.work_orders_by_status?.["VERIFIED"] ?? 0} Verified
              </span>
            </div>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-1 block truncate">
              Human engineer verified closure
            </span>
          </div>
        </div>
      </div>

      {/* Ward Hotspot Grid (Non-geographic heat-grid) */}
      <div className="dhaba-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-[#EBD9B8] dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-stone-900 dark:text-stone-100 tracking-tight font-signboard">
                Ward Hotspot Grid
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-mono">
                Administrative Divisions
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Real-time damage concentration across municipal divisions, paired with canonical road-sign severity shapes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <SeverityBadge level="Minor" size="sm" showScore={false} />
            <SeverityBadge level="Moderate" size="sm" showScore={false} />
            <SeverityBadge level="Severe" size="sm" showScore={false} />
            <SeverityBadge level="Critical" size="sm" showScore={false} />
          </div>
        </div>

        {loadingWards ? (
          <div className="py-12 text-center text-xs text-stone-400 font-mono">
            Loading ward hotspot grid...
          </div>
        ) : wards && wards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
            {wards.map((ward) => {
              const isCrit = ward.critical_defects > 3;
              const isSev = ward.critical_defects > 0 && ward.critical_defects <= 3;
              const isMod = !isCrit && !isSev && ward.total_defects > 5;
              const riskLevel = isCrit ? "Critical" : isSev ? "Severe" : isMod ? "Moderate" : "Minor";
              const repairPct = ward.total_defects > 0
                ? Math.min(100, Math.round((ward.repaired_defects / ward.total_defects) * 100))
                : 100;

              return (
                <div
                  key={ward.ward_id}
                  className="p-4 rounded-xl border-2 border-[#EBD9B8] dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 hover:shadow-md transition-all flex flex-col justify-between min-h-[175px]"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-amber-500/10 text-stone-800 dark:text-stone-200 border border-amber-500/30">
                      {ward.ward_code || "W-XX"}
                    </span>
                    <SeverityBadge level={riskLevel} size="sm" showScore={false} />
                  </div>

                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                    {ward.ward_name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 my-2.5 text-xs">
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block font-mono">Defects</span>
                      <span className="text-base font-black text-stone-900 dark:text-white font-mono">
                        {ward.total_defects}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                      <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 block font-mono">Critical</span>
                      <span className="text-base font-black text-red-600 dark:text-red-400 font-mono">
                        {ward.critical_defects}
                      </span>
                    </div>
                  </div>

                  {/* Repair Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-stone-400 font-semibold font-mono">
                      <span>Repaired ({ward.repaired_defects})</span>
                      <span>{repairPct}%</span>
                    </div>
                    <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${repairPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-stone-400 font-mono">
            No municipal division records found.
          </div>
        )}
      </div>

      {/* Visual Analytics Grid: 14-Day Activity Trends & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 14-Day Activity Trends Line Chart */}
        <div className="dhaba-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 font-signboard">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span>14-Day Pothole Discovery &amp; Repair Trends</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Corridor distress observation volume over 14-day rolling window
              </p>
            </div>
          </div>
          <div className="h-64">
            {loadingTrends ? (
              <div className="h-full flex items-center justify-center text-xs text-stone-400 font-mono">
                Loading activity trends...
              </div>
            ) : trendsData?.trends && trendsData.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,179,0,0.15)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#888888" }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#888888" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0C12",
                      color: "#F3EEE2",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,179,0,0.3)",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="observations_count"
                    name={t("navDefects")}
                    stroke="#FFB300"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#FFB300" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="complaints_count"
                    name={t("citizenGrievances")}
                    stroke="#00D1D1"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#00D1D1" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="repairs_count"
                    name="Repairs"
                    stroke="#35D49A"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#35D49A" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-stone-400 font-mono">
                No telemetry recorded in past 14 days
              </div>
            )}
          </div>
        </div>

        {/* Severity Breakdown & Defect Class Distributions */}
        <div className="dhaba-card p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 mb-1 font-signboard">
              <Activity className="w-5 h-5 text-amber-500" />
              <span>Severity Breakdown &amp; Class Distribution</span>
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
              Real-time classification based on IRC:82-2023 distress guidelines
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-64">
            {/* Pie Chart */}
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {severityPieData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={SEVERITY_COLORS[entry.name] || "#FFB300"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0C12",
                      color: "#F3EEE2",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,179,0,0.3)",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart by Defect Class */}
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,179,0,0.15)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#888888" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#888888" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0C12",
                      color: "#F3EEE2",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,179,0,0.3)",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                  />
                  <Bar dataKey="count" fill="#FFB300" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Ward Defect Registry Table (100% Real Database Records) */}
      <div className="dhaba-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-[#EBD9B8] dark:border-stone-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              <h2 className="text-base font-black text-stone-900 dark:text-stone-100 tracking-tight font-signboard">
                Corridor Damage Leaderboard
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono">
                Live DB Records
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
              Corridors ordered by critical defect volume and 24-hr remediation urgency.
            </p>
          </div>
          <Link
            to="/defects"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-mono"
          >
            <span>Open Defect Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {sortedWards.length > 0 ? (
            <table className="w-full text-left text-sm text-stone-700 dark:text-stone-300">
              <thead className="bg-[#FFF0D6]/60 dark:bg-stone-800/80 text-xs font-bold uppercase text-stone-500 dark:text-stone-400 border-b border-[#EBD9B8] dark:border-stone-700 font-mono">
                <tr>
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4">Division Name &amp; Code</th>
                  <th className="py-3 px-4 text-center">Total Defects</th>
                  <th className="py-3 px-4 text-center">Critical Hazards</th>
                  <th className="py-3 px-4 text-center">Repaired</th>
                  <th className="py-3 px-4 text-center">Repair Progress</th>
                  <th className="py-3 px-4 text-center">Budget Allocated</th>
                  <th className="py-3 px-4 text-right">Priority SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBD9B8] dark:divide-stone-800">
                {sortedWards.map((ward, idx) => {
                  const isCritAction = ward.critical_defects > 0;
                  const isHighPri = ward.total_defects > ward.repaired_defects;
                  const repairPct = ward.total_defects > 0 ? Math.round((ward.repaired_defects / ward.total_defects) * 100) : 0;

                  return (
                    <tr key={ward.ward_id} className="hover:bg-amber-500/[0.04] transition">
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        #{idx + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-1.5">
                          <span>{ward.ward_name}</span>
                          {ward.ward_code && (
                            <span className="font-mono text-[10px] text-stone-400">({ward.ward_code})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-stone-800 dark:text-stone-200">
                        {ward.total_defects}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-black bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/40 font-mono">
                          {ward.critical_defects}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ward.repaired_defects}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${repairPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-stone-600 dark:text-stone-400">{repairPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        ₹{(ward.allocated_budget / 100000).toFixed(1)}L
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider font-mono ${
                            isCritAction
                              ? "bg-red-600 text-white"
                              : isHighPri
                              ? "bg-amber-500 text-stone-950"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {isCritAction ? "24-Hr Patch" : isHighPri ? "Repair Queue" : "Routine"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-xs text-stone-400 font-mono">
              No corridor records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
