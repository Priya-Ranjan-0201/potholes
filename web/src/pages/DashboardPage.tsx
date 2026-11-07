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
  ClipboardList,
  MessageSquareWarning,
} from "../components/Icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { RoadHeroScene } from "../components/RoadHeroScene";
import { SeverityBadge, Sign } from "../ui";

// Canonical Severity Colors adhering to config/severity_thresholds.json & Design System
const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#D7263D", // Red Octagon
  Severe: "#F26A1B",   // Orange Diamond
  Moderate: "#F2B705", // Yellow Triangle
  Minor: "#1E78D0",    // Blue Circle
};

export const DashboardPage: React.FC = () => {
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
      <div className="flex h-80 items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
          <p className="text-stone-500 dark:text-stone-400 font-mono text-xs">
            Connecting to road telemetry engine...
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

  // Ranked wards derived directly from live database records
  const sortedWards = [...(wards || [])].sort(
    (a, b) => b.critical_defects - a.critical_defects || b.total_defects - a.total_defects
  );

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Sleek Hero Banner */}
      <RoadHeroScene />

      {/* 4 Clean & Simple KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Road Defects */}
        <div className="dhaba-card p-5 flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
              Total Road Defects
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
                {stats?.total_defects ?? 0}
              </span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                {stats?.open_defects ?? 0} Active
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 block truncate">
              {stats?.repaired_defects ?? 0} repaired
            </span>
          </div>
        </div>

        {/* Critical Potholes (24-Hr SLA) */}
        <div className="dhaba-card p-5 flex flex-col justify-between min-h-[135px] border-red-500/30 bg-red-500/[0.03]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 font-mono">
              Critical Potholes
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600">
              <Sign level="Critical" size="sm" showIconOnly />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-600 dark:text-red-400 font-mono">
                {stats?.critical_defects ?? 0}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-700 dark:text-red-300 font-mono">
                24-Hr Priority
              </span>
            </div>
            <span className="text-xs text-red-700 dark:text-red-400 font-medium mt-0.5 block truncate">
              Immediate compaction required
            </span>
          </div>
        </div>

        {/* PWD Work Orders */}
        <div className="dhaba-card p-5 flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
              Maintenance Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
                {stats?.total_work_orders ?? 0}
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {stats?.work_orders_by_status?.["VERIFIED"] ?? 0} Verified
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 block truncate">
              Human engineer verified closure
            </span>
          </div>
        </div>

        {/* Citizen Grievances */}
        <div className="dhaba-card p-5 flex flex-col justify-between min-h-[135px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 font-mono">
              Citizen Reports
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <MessageSquareWarning className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-stone-900 dark:text-stone-100 font-mono">
                {stats?.total_complaints ?? 0}
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                {stats?.complaints_by_status?.["SUBMITTED"] ?? 0} Pending
              </span>
            </div>
            <span className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 block truncate">
              Public road defect reporting
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics: 14-Day Activity Trends & Severity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trends */}
        <div className="dhaba-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 font-signboard">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <span>14-Day Defect &amp; Repair Trends</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Pothole observations and repair completions over 14 days
              </p>
            </div>
          </div>
          <div className="h-60">
            {loadingTrends ? (
              <div className="h-full flex items-center justify-center text-xs text-stone-400 font-mono">
                Loading activity trends...
              </div>
            ) : trendsData?.trends && trendsData.trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,179,0,0.12)" />
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
                    name="Defects Found"
                    stroke="#FFB300"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#FFB300" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="repairs_count"
                    name="Repairs Completed"
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

        {/* Severity Breakdown */}
        <div className="dhaba-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-stone-900 dark:text-stone-100 flex items-center gap-2 font-signboard">
                <Activity className="w-4 h-4 text-amber-500" />
                <span>Distress Severity Breakdown</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Classification adhering to IRC:82-2023 road guidance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center h-60">
            {/* Pie Chart */}
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
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
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Legend with Road Sign Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <SeverityBadge level="Critical" size="sm" showScore={false} />
                <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                  {stats?.defects_by_severity?.["Critical"] ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <SeverityBadge level="Severe" size="sm" showScore={false} />
                <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                  {stats?.defects_by_severity?.["Severe"] ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <SeverityBadge level="Moderate" size="sm" showScore={false} />
                <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                  {stats?.defects_by_severity?.["Moderate"] ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <SeverityBadge level="Minor" size="sm" showScore={false} />
                <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                  {stats?.defects_by_severity?.["Minor"] ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Single Clean Table: Municipal Corridors & Divisions */}
      <div className="dhaba-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-[#EBD9B8] dark:border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-black text-stone-900 dark:text-stone-100 tracking-tight font-signboard">
                Corridor Damage &amp; Repair Status
              </h2>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Municipal road sectors ranked by critical repair priority
            </p>
          </div>
          <Link
            to="/defects"
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-mono"
          >
            <span>View All Defects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          {loadingWards ? (
            <div className="py-8 text-center text-xs text-stone-400 font-mono">
              Loading corridor records...
            </div>
          ) : sortedWards.length > 0 ? (
            <table className="w-full text-left text-sm text-stone-700 dark:text-stone-300">
              <thead className="bg-[#FFF0D6]/60 dark:bg-stone-800/80 text-xs font-bold uppercase text-stone-500 dark:text-stone-400 border-b border-[#EBD9B8] dark:border-stone-700 font-mono">
                <tr>
                  <th className="py-2.5 px-3">Corridor / Division</th>
                  <th className="py-2.5 px-3 text-center">Total Defects</th>
                  <th className="py-2.5 px-3 text-center">Critical Hazards</th>
                  <th className="py-2.5 px-3 text-center">Repaired</th>
                  <th className="py-2.5 px-3 text-center">Repair Progress</th>
                  <th className="py-2.5 px-3 text-right">Action Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBD9B8] dark:divide-stone-800 text-xs">
                {sortedWards.map((ward) => {
                  const isCritAction = ward.critical_defects > 0;
                  const isHighPri = ward.total_defects > ward.repaired_defects;
                  const repairPct = ward.total_defects > 0 ? Math.round((ward.repaired_defects / ward.total_defects) * 100) : 0;

                  return (
                    <tr key={ward.ward_id} className="hover:bg-amber-500/[0.04] transition">
                      <td className="py-3 px-3 font-bold text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-2">
                          <span>{ward.ward_name}</span>
                          {ward.ward_code && (
                            <span className="font-mono text-[10px] text-stone-400">({ward.ward_code})</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-stone-800 dark:text-stone-200">
                        {ward.total_defects}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ward.critical_defects > 0 ? (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-black bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/40 font-mono">
                            {ward.critical_defects} Critical
                          </span>
                        ) : (
                          <span className="text-stone-400 font-mono">0</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {ward.repaired_defects}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-20 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${repairPct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-stone-500">{repairPct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
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
