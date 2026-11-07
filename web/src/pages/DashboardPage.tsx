import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Activity,
  Layers,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Clock,
  RefreshCw,
} from "../components/Icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { StatCard, SeverityBadge, StatusChip, DemoBadge, EmptyState } from "../ui";

export const DashboardPage: React.FC = () => {
  const [selectedCorridor, setSelectedCorridor] = useState<string>("all");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["statsOverview"],
    queryFn: api.getOverview,
    refetchInterval: 15000,
  });

  const {
    data: trendsData,
    isLoading: loadingTrends,
    refetch: refetchTrends,
  } = useQuery({
    queryKey: ["statsTrends"],
    queryFn: () => api.getTrends(14),
    refetchInterval: 15000,
  });

  const {
    data: wards,
    isLoading: loadingWards,
    refetch: refetchWards,
  } = useQuery({
    queryKey: ["statsWards"],
    queryFn: api.getWards,
    refetchInterval: 15000,
  });

  const {
    data: workOrdersData,
    isLoading: loadingWorkOrders,
    refetch: refetchWorkOrders,
  } = useQuery({
    queryKey: ["workOrdersOverview"],
    queryFn: () => api.listWorkOrders({ limit: 20 }),
    refetchInterval: 15000,
  });

  const {
    data: recentDefectsData,
    refetch: refetchDefects,
  } = useQuery({
    queryKey: ["recentDefectsOverview"],
    queryFn: () => api.listDefects({ limit: 10 }),
    refetchInterval: 15000,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchTrends();
    refetchWards();
    refetchWorkOrders();
    refetchDefects();
    setLastRefreshed(new Date());
  };

  if (loadingStats && !stats) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-center">
          <Activity className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500 font-mono text-xs">
            Loading road network metrics...
          </p>
        </div>
      </div>
    );
  }

  // Calculate KPIs
  const totalDefects = stats?.total_defects ?? 0;
  const criticalDefects = stats?.defects_by_severity?.["Critical"] ?? 0;
  const severeDefects = stats?.defects_by_severity?.["Severe"] ?? 0;
  const highPriorityTotal = Math.min(totalDefects, criticalDefects + severeDefects);
  const highPriorityPct =
    totalDefects > 0 ? Math.min(100, Math.round((highPriorityTotal / totalDefects) * 100)) : 0;

  const openWorkOrders =
    (stats?.work_orders_by_status?.["CREATED"] ?? 0) +
    (stats?.work_orders_by_status?.["ASSIGNED"] ?? 0) +
    (stats?.work_orders_by_status?.["IN_PROGRESS"] ?? 0);

  // SLA calculation
  const workOrders = workOrdersData?.items || [];
  const now = new Date();
  const slaBreachedOrders = workOrders.filter((wo) => {
    if (wo.status === "VERIFIED" || wo.status === "COMPLETED") return false;
    if (!wo.deadline) return false;
    return new Date(wo.deadline) < now;
  });

  const upcomingSlaOrders = workOrders
    .filter((wo) => wo.status !== "VERIFIED" && wo.status !== "COMPLETED" && wo.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 6);

  // Filter trends: only distinct dates with detections or activity
  const rawTrends = trendsData?.trends || [];
  const activeTrends = rawTrends.filter(
    (t) => t.observations_count > 0 || t.complaints_count > 0 || t.repairs_count > 0
  );
  const hasEnoughHistory = activeTrends.length >= 3;

  // Filter corridors
  const sortedWards = [...(wards || [])].sort(
    (a, b) => b.critical_defects - a.critical_defects || b.total_defects - a.total_defects
  );
  const displayedWards =
    selectedCorridor === "all"
      ? sortedWards
      : sortedWards.filter((w) => w.ward_id === selectedCorridor);

  return (
    <div className="space-y-6">
      {/* 1. Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Road Network Overview
          </h1>
          <DemoBadge />
        </div>

        <div className="flex items-center gap-2.5 text-xs">
          {/* Corridor Scope Selector */}
          <select
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(e.target.value)}
            className="input-select py-1 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">All Corridors &amp; Sectors</option>
            {sortedWards.map((w) => (
              <option key={w.ward_id} value={w.ward_id}>
                {w.ward_name} ({w.ward_code || "Zone"})
              </option>
            ))}
          </select>

          {/* Last updated & refresh button */}
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] pl-2 border-l border-slate-200 dark:border-slate-700">
            <span>
              Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button
              onClick={handleRefresh}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Refresh network data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 4 Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Defects Logged"
          value={totalDefects}
          subtext={`${stats?.repaired_defects ?? 0} repaired across network`}
          icon={<Layers className="w-4 h-4 text-slate-400" />}
        />

        <StatCard
          label="Severe &amp; Critical Defects"
          value={highPriorityTotal}
          subtext={`${highPriorityPct}% of total network distress`}
          badge={
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              High Priority
            </span>
          }
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        />

        <StatCard
          label="Open Work Orders"
          value={openWorkOrders}
          subtext={`${stats?.work_orders_by_status?.["ASSIGNED"] ?? 0} currently dispatched to contractors`}
          icon={<ClipboardList className="w-4 h-4 text-slate-400" />}
        />

        <StatCard
          label="Overdue SLA Breaches"
          value={slaBreachedOrders.length}
          subtext={
            slaBreachedOrders.length > 0
              ? `${slaBreachedOrders.length} orders exceed deadline`
              : "All active orders within SLA threshold"
          }
          className={
            slaBreachedOrders.length > 0
              ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10"
              : ""
          }
          icon={
            <Clock
              className={`w-4 h-4 ${
                slaBreachedOrders.length > 0 ? "text-rose-500" : "text-emerald-500"
              }`}
            />
          }
        />
      </div>

      {/* 3. Main 2-Column Layout (2/3 + 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Defect Trends */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Defect Observations &amp; Repair Trends
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Chronological detections and completed repairs over 14 days
                </p>
              </div>
            </div>

            {loadingTrends ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400 font-mono">
                Loading trend history...
              </div>
            ) : hasEnoughHistory ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rawTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" strokeOpacity={0.6} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#64748B" }}
                      tickFormatter={(val) => val.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        borderColor: "#334155",
                        color: "#F8FAFC",
                        borderRadius: "6px",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="observations_count"
                      name="Defects Observed"
                      stroke="#2563EB"
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: "#2563EB" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="repairs_count"
                      name="Repairs Verified"
                      stroke="#0EA5A4"
                      strokeWidth={2}
                      dot={{ r: 2.5, fill: "#0EA5A4" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : activeTrends.length > 0 ? (
              <div>
                <p className="text-xs text-slate-500 mb-3">
                  Chronological activity log across surveyed road corridors:
                </p>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th className="text-right">Observations</th>
                        <th className="text-right">Complaints</th>
                        <th className="text-right">Repairs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTrends.map((row) => (
                        <tr key={row.date}>
                          <td className="font-mono text-xs">{row.date}</td>
                          <td className="text-right font-mono font-medium">{row.observations_count}</td>
                          <td className="text-right font-mono text-slate-600 dark:text-slate-400">{row.complaints_count}</td>
                          <td className="text-right font-mono text-emerald-600 dark:text-emerald-400">{row.repairs_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <EmptyState
                title="Awaiting Observation History"
                description="Chronological trendlines will render automatically as camera patrols and citizen reports log defects."
                className="py-8"
              />
            )}
          </div>

          {/* Section: Corridor Health Table */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Corridor Health &amp; Maintenance Status
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sector-wise defect density and repair allocation
                </p>
              </div>
              <Link
                to="/maintenance?tab=defects"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>View all defects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {loadingWards ? (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  Loading corridor metrics...
                </div>
              ) : displayedWards.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Corridor / Sector</th>
                      <th className="text-right">Total Defects</th>
                      <th className="text-right">Critical Hazards</th>
                      <th className="text-right">Repaired</th>
                      <th className="text-right">Progress</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedWards.map((w) => {
                      const repairPct =
                        w.total_defects > 0
                          ? Math.round((w.repaired_defects / w.total_defects) * 100)
                          : 100;
                      const hasCritical = w.critical_defects > 0;

                      return (
                        <tr key={w.ward_id}>
                          <td className="font-medium text-slate-900 dark:text-slate-100">
                            <span>{w.ward_name}</span>
                            {w.ward_code && (
                              <span className="font-mono text-[10px] text-slate-400 ml-1.5">
                                ({w.ward_code})
                              </span>
                            )}
                          </td>
                          <td className="text-right font-mono">{w.total_defects}</td>
                          <td className="text-right font-mono">
                            {hasCritical ? (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                {w.critical_defects}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                            {w.repaired_defects}
                          </td>
                          <td className="text-right">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${repairPct}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-slate-500">
                                {repairPct}%
                              </span>
                            </div>
                          </td>
                          <td className="text-right">
                            {hasCritical ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                Immediate Patch
                              </span>
                            ) : w.total_defects > w.repaired_defects ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                In Queue
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Clear
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No corridor data found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-6">
          {/* Section: SLA Breaches & Upcoming */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                SLA Deadlines &amp; Priority
              </h2>
              <Link
                to="/maintenance"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View all
              </Link>
            </div>

            {loadingWorkOrders ? (
              <div className="py-6 text-center text-xs text-slate-400 font-mono">
                Checking SLA schedules...
              </div>
            ) : upcomingSlaOrders.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingSlaOrders.map((wo) => {
                  const deadlineDate = new Date(wo.deadline!);
                  const diffHours = Math.round(
                    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60)
                  );
                  const isOverdue = diffHours < 0;

                  return (
                    <div
                      key={wo.id}
                      className="p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            #{wo.id.slice(0, 8)}
                          </span>
                          <StatusChip status={wo.status} />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Priority: {wo.priority}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block font-mono text-[11px] font-semibold ${
                            isOverdue
                              ? "text-rose-600 dark:text-rose-400"
                              : diffHours <= 12
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {isOverdue ? `${Math.abs(diffHours)}h overdue` : `${diffHours}h left`}
                        </span>
                        <Link
                          to={`/maintenance?id=${wo.id}`}
                          className="block text-[10px] text-blue-600 hover:underline"
                        >
                          Inspect &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No active work orders pending SLA.
              </div>
            )}
          </div>

          {/* Section: Recent Activity Feed */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Recent Network Activity
              </h2>
            </div>

            <div className="space-y-3">
              {recentDefectsData?.items && recentDefectsData.items.length > 0 ? (
                recentDefectsData.items.slice(0, 5).map((def) => {
                  const seenDate = new Date(def.last_seen);
                  return (
                    <div key={def.id} className="flex items-start gap-2.5 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-slate-800 dark:text-slate-200 font-medium truncate">
                            {def.class_code} detected
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {seenDate.toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <SeverityBadge level={def.severity_level || "Minor"} size="sm" showScore={false} />
                          <span className="text-[10px] font-mono text-slate-400">
                            times seen: {def.times_seen}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-slate-400">
                  No recent activity logged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
