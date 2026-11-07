import React from "react";
import { useQuery } from "@tanstack/react-query";
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

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#dc2626",
  Severe: "#ea580c",
  Moderate: "#eab308",
  Minor: "#22c55e",
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

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md transition-colors">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>🇮🇳 {t("appName")}</span>
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

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 14-Day Activity Trends Line Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                14-Day Observation & Repair Activity
              </h2>
              <p className="text-xs text-slate-500">
                Daily frequency of edge camera detections vs contractor repairs
              </p>
            </div>
          </div>
          <div className="h-64">
            {loadingTrends ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading trends...
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
                    name="Detections"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="complaints_count"
                    name="Complaints"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="repairs_count"
                    name="Repairs"
                    stroke="#eab308"
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
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-emerald-600" />
              Damage Severity & Defect Classes
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Breakdown by multi-factor hazard level (Rule R5) and defect taxonomy
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
                        fill={SEVERITY_COLORS[entry.name] || "#94a3b8"}
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

      {/* Ward Health & Budget Allocations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Municipal Ward Breakdown & Budgets</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Aggregated across all roads</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Ward Code</th>
                <th className="py-3 px-4">Ward Name</th>
                <th className="py-3 px-4 text-center">Total Defects</th>
                <th className="py-3 px-4 text-center">Critical Defects</th>
                <th className="py-3 px-4 text-center">Repaired</th>
                <th className="py-3 px-4 text-right">Allocated Budget</th>
                <th className="py-3 px-4 text-right">Spent Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingWards ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                    Loading ward data...
                  </td>
                </tr>
              ) : wards && wards.length > 0 ? (
                wards.map((w) => (
                  <tr key={w.ward_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{w.ward_code || "W-00"}</td>
                    <td className="py-3 px-4">{w.ward_name}</td>
                    <td className="py-3 px-4 text-center font-semibold">{w.total_defects}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                          w.critical_defects > 0
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : "text-slate-500"
                        }`}
                      >
                        {w.critical_defects}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-600 font-semibold">
                      {w.repaired_defects}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">
                      ₹{w.allocated_budget.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-600">
                      ₹{w.spent_budget.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-slate-400">
                    No municipal wards configured in system
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contractor Workload & SLA Compliance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-600" />
            <h2 className="text-base font-bold text-slate-900">Contractor Performance & SLA Delivery</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Compliance rate based on verified repairs</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400 border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Contractor</th>
                <th className="py-3 px-4 text-center">Assigned Work Orders</th>
                <th className="py-3 px-4 text-center">Completed</th>
                <th className="py-3 px-4 text-center">Human Verified (Rule R8)</th>
                <th className="py-3 px-4 text-right">SLA Compliance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingContractors ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-slate-400">
                    Loading contractor statistics...
                  </td>
                </tr>
              ) : contractors && contractors.length > 0 ? (
                contractors.map((c) => (
                  <tr key={c.contractor_id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.contractor_name}</td>
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
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : c.sla_compliance_rate_pct >= 75
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
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
