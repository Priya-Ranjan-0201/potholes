import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  AlertOctagon,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  TrendingUp,
  Building2,
  HardHat,
  ArrowRight,
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

// Canonical Severity Colors adhering to config/severity_thresholds.json
const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#E5233A", // 76-100
  Severe: "#FB6A2F",   // 51-75
  Moderate: "#FFB703", // 26-50
  Minor: "#2EC4B6",    // 0-25
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

  const { data: contractors, isLoading: loadingContractors } = useQuery({
    queryKey: ["statsContractors"],
    queryFn: api.getContractorsStats,
    refetchInterval: 15000,
  });

  if (loadingStats && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading municipal road health telemetry...</p>
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
    <div className="space-y-6 pb-16">
      {/* Animated Road Perspective Scene Hero & Scientific Evidence Strip */}
      <RoadHeroScene />

      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md transition-colors">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{t("appName")}</span>
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">
              {t("standardsNotice")}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t("dashboardTitle")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {t("dashboardSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/defects"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition shadow-xs"
          >
            <span>{t("navDefects")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{t("telemetryOnline")}</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {t("totalDefects")}
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats?.total_defects ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block font-medium">
              <strong className="text-amber-600 dark:text-amber-400">{stats?.open_defects ?? 0} {t("activeDefects")}</strong> | {stats?.repaired_defects ?? 0} {t("repairedDefects")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-5 rounded-2xl border border-red-200/90 dark:border-red-900/60 shadow-md hover:border-red-300 dark:hover:border-red-800 transition-all flex items-center justify-between bg-gradient-to-br from-white via-white to-red-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-red-950/20">
          <div>
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">
              {t("criticalPotholes")}
            </span>
            <span className="text-3xl font-black text-red-600 dark:text-red-400 mt-1 block">
              {stats?.critical_defects ?? 0}
            </span>
            <span className="text-xs text-red-700 dark:text-red-300 font-bold mt-1 block">
              {t("immediateRemediation")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/80 flex items-center justify-center text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {t("citizenGrievances")}
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats?.total_complaints ?? 0}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block font-medium">
              <strong className="text-blue-600 dark:text-blue-400">{stats?.complaints_by_status?.["SUBMITTED"] ?? 0} {t("pendingReview")}</strong>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              {t("workOrdersDispatched")}
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 block">
              {stats?.total_work_orders ?? 0}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1 block">
              {stats?.work_orders_by_status?.["VERIFIED"] ?? 0} {t("verifiedCompleted")}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Ward Hotspot Grid (Non-geographic heat-grid) */}
      <div className="civic-card rounded-2xl p-6 shadow-md border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Ward Hotspot Grid
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Non-Geographic Health Heat-Grid
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time damage concentration across administrative wards, color-coded by defect density and critical hazards.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-[#2EC4B6]"></span> Minor
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-[#FFB703]"></span> Moderate
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-[#FB6A2F]"></span> Severe
            </span>
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-3 h-3 rounded-md bg-[#E5233A]"></span> Critical
            </span>
          </div>
        </div>

        {loadingWards ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading ward hotspot grid...</div>
        ) : wards && wards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {wards.map((ward) => {
              // Determine risk category based on critical defects & total volume
              const isCrit = ward.critical_defects > 3;
              const isSev = ward.critical_defects > 0 && ward.critical_defects <= 3;
              const isMod = !isCrit && !isSev && ward.total_defects > 5;
              const riskColor = isCrit
                ? "#E5233A"
                : isSev
                ? "#FB6A2F"
                : isMod
                ? "#FFB703"
                : "#2EC4B6";
              const riskLabel = isCrit ? "Critical" : isSev ? "Severe" : isMod ? "Moderate" : "Minor";

              const repairPct = ward.total_defects > 0
                ? Math.min(100, Math.round((ward.repaired_defects / ward.total_defects) * 100))
                : 100;

              return (
                <div
                  key={ward.ward_id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:shadow-md transition-all relative overflow-hidden"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: riskColor }}
                  />
                  <div className="flex items-center justify-between mb-2 pt-1">
                    <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                      {ward.ward_code || "W-XX"}
                    </span>
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: `${riskColor}15`,
                        color: riskColor,
                        border: `1px solid ${riskColor}40`,
                      }}
                    >
                      {riskLabel} Risk
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {ward.ward_name}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Defects</span>
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {ward.total_defects}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-red-50/60 dark:bg-red-950/40 border border-red-100 dark:border-red-900/40">
                      <span className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 block">Critical</span>
                      <span className="text-base font-black text-red-600 dark:text-red-400">
                        {ward.critical_defects}
                      </span>
                    </div>
                  </div>

                  {/* Repair Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      <span>Repaired ({ward.repaired_defects})</span>
                      <span>{repairPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${repairPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Allocated: ₹{(ward.allocated_budget / 100000).toFixed(1)}L</span>
                    <span>Spent: ₹{(ward.spent_budget / 100000).toFixed(1)}L</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">No municipal ward records found.</div>
        )}
      </div>

      {/* Municipal Ward Defect Registry Table (100% Real Database Records) */}
      <div className="civic-card rounded-2xl p-6 shadow-md border border-slate-200/80 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Municipal Ward Damage Leaderboard
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Live DB Records
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Real-time municipal jurisdictions ordered by critical defect severity and repair completion status.
            </p>
          </div>
          <Link
            to="/defects"
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Open Defect Registry</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {sortedWards.length > 0 ? (
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4 text-center">Rank</th>
                  <th className="py-3 px-4">Ward Name &amp; Code</th>
                  <th className="py-3 px-4 text-center">Total Defects</th>
                  <th className="py-3 px-4 text-center">Critical Potholes</th>
                  <th className="py-3 px-4 text-center">Repaired</th>
                  <th className="py-3 px-4 text-center">Repair Progress</th>
                  <th className="py-3 px-4 text-center">Allocated Budget</th>
                  <th className="py-3 px-4 text-right">Priority Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedWards.map((ward, idx) => {
                  const isCritAction = ward.critical_defects > 0;
                  const isHighPri = ward.total_defects > ward.repaired_defects;
                  const repairPct = ward.total_defects > 0 ? Math.round((ward.repaired_defects / ward.total_defects) * 100) : 0;

                  return (
                    <tr key={ward.ward_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                            idx < 3
                              ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{ward.ward_name}</span>
                          {ward.ward_code && (
                            <span className="font-mono text-[10px] text-slate-400">({ward.ward_code})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {ward.total_defects}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded text-xs font-black bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                          {ward.critical_defects}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                        {ward.repaired_defects}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${repairPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{repairPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        ₹{(ward.allocated_budget / 100000).toFixed(1)}L
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isCritAction
                              ? "bg-red-600 text-white"
                              : isHighPri
                              ? "bg-amber-500 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {isCritAction ? "Immediate Patch" : isHighPri ? "Repair Queue" : "Routine Scan"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">No municipal ward records found.</div>
          )}
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 14-Day Activity Trends Line Chart */}
        <div className="civic-card p-6 rounded-xl shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {t("severityDistributionTitle")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("dashboardSubtitle")}
              </p>
            </div>
          </div>
          <div className="h-64">
            {loadingTrends ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading...
              </div>
            ) : trendsData?.trends && trendsData.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickFormatter={(val) => val.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="observations_count"
                    name={t("navDefects")}
                    stroke="#2EC4B6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="complaints_count"
                    name={t("citizenGrievances")}
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="repairs_count"
                    name="Repairs"
                    stroke="#FFB703"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No observation data recorded in past 14 days
              </div>
            )}
          </div>
        </div>

        {/* Severity Breakdown & Defect Class Distributions */}
        <div className="civic-card p-6 rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {t("severityDistributionTitle")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {t("dashboardSubtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-64">
            {/* Pie Chart */}
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={35}
                    paddingAngle={3}
                  >
                    {severityPieData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={SEVERITY_COLORS[entry.name] || "#2EC4B6"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Contractor Workload & SLA Compliance Table */}
      <div className="civic-card rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{t("contractorLeaderboardTitle")}</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Municipal Engineering Division</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">{t("colContractor")}</th>
                <th className="py-3 px-4 text-center">{t("workOrdersDispatched")}</th>
                <th className="py-3 px-4 text-center">{t("repairedDefects")}</th>
                <th className="py-3 px-4 text-center">{t("verifiedCompleted")}</th>
                <th className="py-3 px-4 text-right">{t("colSLA")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loadingContractors ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                    Loading contractor statistics...
                  </td>
                </tr>
              ) : contractors && contractors.length > 0 ? (
                contractors.map((c) => (
                  <tr key={c.contractor_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{c.contractor_name}</td>
                    <td className="py-3 px-4 text-center">{c.total_assigned}</td>
                    <td className="py-3 px-4 text-center">{c.total_completed}</td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                      {c.total_verified}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {c.sla_compliance_rate_pct !== null ? (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-black ${
                            c.sla_compliance_rate_pct >= 90
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : c.sla_compliance_rate_pct >= 75
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                          }`}
                        >
                          {c.sla_compliance_rate_pct}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                    No contractors registered
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
