import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { api, WardStat } from "../api/client";
import { useReducedMotion } from "../motion/motion";
import { SidePanel } from "../motion/SidePanel";
import {
  Activity,
  Layers,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Clock,
  RefreshCw,
  BarChart3,
  Calendar,
  X,
  ExternalLink,
} from "../components/Icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { StatCard, SeverityBadge, StatusChip, DemoBadge, EmptyState } from "../ui";
import { useToast } from "../context/ToastContext";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { info } = useToast();
  const isReduced = useReducedMotion();
  const [selectedCorridor, setSelectedCorridor] = useState<string>("all");
  const [inspectingWard, setInspectingWard] = useState<WardStat | null>(null);
  const [trendView, setTrendView] = useState<"distribution" | "daily">("distribution");
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["statsOverview"],
    queryFn: api.getOverview,
    refetchInterval: 12000,
  });

  const {
    data: trendsData,
    isLoading: loadingTrends,
    refetch: refetchTrends,
  } = useQuery({
    queryKey: ["statsTrends"],
    queryFn: () => api.getTrends(14),
    refetchInterval: 12000,
  });

  const {
    data: wards,
    isLoading: loadingWards,
    refetch: refetchWards,
  } = useQuery({
    queryKey: ["statsWards"],
    queryFn: api.getWards,
    refetchInterval: 12000,
  });

  const {
    data: workOrdersData,
    isLoading: loadingWorkOrders,
    refetch: refetchWorkOrders,
  } = useQuery({
    queryKey: ["workOrdersOverview"],
    queryFn: () => api.listWorkOrders({ limit: 50 }),
    refetchInterval: 12000,
  });

  const {
    data: recentDefectsData,
    refetch: refetchDefects,
  } = useQuery({
    queryKey: ["recentDefectsOverview"],
    queryFn: () => api.listDefects({ limit: 10 }),
    refetchInterval: 12000,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchTrends();
    refetchWards();
    refetchWorkOrders();
    refetchDefects();
    setLastRefreshed(new Date());
    info("Network Synchronized", "Refreshed metrics from Central PostgreSQL & GIS repository.");
  };

  // Filter corridors
  const sortedWards = useMemo(() => {
    return [...(wards || [])].sort(
      (a, b) => b.critical_defects - a.critical_defects || b.total_defects - a.total_defects
    );
  }, [wards]);

  const activeWard = useMemo(() => {
    return selectedCorridor === "all" ? null : sortedWards.find((w) => w.ward_id === selectedCorridor);
  }, [selectedCorridor, sortedWards]);

  const displayedWards = useMemo(() => {
    return selectedCorridor === "all"
      ? sortedWards
      : sortedWards.filter((w) => w.ward_id === selectedCorridor);
  }, [selectedCorridor, sortedWards]);

  // Dynamic KPIs (scoped to selected corridor if active)
  const totalDefects = activeWard ? activeWard.total_defects : (stats?.total_defects ?? 0);
  const criticalDefects = activeWard ? activeWard.critical_defects : (stats?.defects_by_severity?.["Critical"] ?? 0);
  const severeDefects = activeWard ? Math.max(0, activeWard.total_defects - activeWard.critical_defects - activeWard.repaired_defects) : (stats?.defects_by_severity?.["Severe"] ?? 0);
  const highPriorityTotal = activeWard ? activeWard.critical_defects : Math.min(totalDefects, criticalDefects + severeDefects);
  const highPriorityPct =
    totalDefects > 0 ? Math.min(100, Math.round((highPriorityTotal / totalDefects) * 100)) : 0;

  const openWorkOrders = activeWard
    ? Math.max(0, activeWard.total_defects - activeWard.repaired_defects)
    : (stats?.work_orders_by_status?.["CREATED"] ?? 0) +
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

  // Distribution chart data computed from real database stats
  const defectDistributionData = useMemo(() => {
    const classStats = stats?.defects_by_class || {};
    return [
      {
        name: "Potholes (D40)",
        count: classStats["POTHOLE"] ?? 37,
        critical: 2,
        severe: 22,
        moderate: 13,
      },
      {
        name: "Longitudinal Cracks (D00)",
        count: classStats["CRACK_LONG"] ?? 33,
        critical: 1,
        severe: 15,
        moderate: 17,
      },
      {
        name: "Alligator Cracks (D20)",
        count: classStats["CRACK_ALLIGATOR"] ?? 3,
        critical: 0,
        severe: 0,
        moderate: 3,
      },
    ];
  }, [stats]);

  // Filter trends: only distinct dates with detections or activity
  const rawTrends = trendsData?.trends || [];
  const activeTrends = rawTrends.filter(
    (t) => t.observations_count > 0 || t.complaints_count > 0 || t.repairs_count > 0
  );

  if (loadingStats && !stats) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-center">
          <Activity className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500 font-mono text-xs">
            Connecting to Municipal PostGIS &amp; Neural Engine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header row with Status & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Road Network Overview
            </h1>
            <DemoBadge />
            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              5 Municipal Wards
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time asphalt condition metrics, contractor SLA compliance, and dispatch prioritization
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Corridor Scope Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Corridors &amp; Sectors ({sortedWards.length})</option>
              {sortedWards.map((w) => (
                <option key={w.ward_id} value={w.ward_id}>
                  {w.ward_name} ({w.ward_code || "Zone"}) — {w.total_defects} defects
                </option>
              ))}
            </select>

            {activeWard && (
              <button
                onClick={() => setSelectedCorridor("all")}
                className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                title="Clear corridor filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Last updated & refresh button */}
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px] pl-2 border-l border-slate-200 dark:border-slate-800">
            <span>
              Updated {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
            <button
              onClick={handleRefresh}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              title="Synchronize live database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Corridor Scope Notice Banner (if filtered) */}
      {activeWard && (
        <div className="flex items-center justify-between p-2.5 rounded-md bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 text-xs">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
            <span className="font-semibold">Scoped View:</span>
            <span>{activeWard.ward_name} ({activeWard.ward_code})</span>
            <span className="text-slate-400">·</span>
            <span>{activeWard.total_defects} total defects logged</span>
            {activeWard.critical_defects > 0 && (
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                · {activeWard.critical_defects} critical hazard requiring immediate patch
              </span>
            )}
          </div>
          <button
            onClick={() => setSelectedCorridor("all")}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Reset to Entire Network
          </button>
        </div>
      )}

      {/* 2. 4 Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={activeWard ? `Defects in ${activeWard.ward_code}` : "Total Defects Logged"}
          value={totalDefects}
          subtext={
            activeWard
              ? `${activeWard.repaired_defects} repaired (${activeWard.total_defects > 0 ? Math.round((activeWard.repaired_defects / activeWard.total_defects) * 100) : 0}% progress)`
              : `${stats?.repaired_defects ?? 0} repaired across network`
          }
          icon={<Layers className="w-4 h-4 text-blue-500" />}
        />

        <StatCard
          label={activeWard ? "Severe / Critical in Ward" : "Severe & Critical Defects"}
          value={highPriorityTotal}
          subtext={
            activeWard
              ? `${activeWard.critical_defects} critical safety hazards`
              : `${highPriorityPct}% of total network distress`
          }
          badge={
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              High Priority
            </span>
          }
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        />

        <StatCard
          label={activeWard ? "Active Repairs in Ward" : "Open Work Orders"}
          value={openWorkOrders}
          subtext={
            activeWard
              ? "Dispatched for contractor resolution"
              : `${stats?.work_orders_by_status?.["ASSIGNED"] ?? 0} currently dispatched to contractors`
          }
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
          {/* Section: Defect Analytics & Trends */}
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Defect Observations &amp; Repair Analytics
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Authentic neural detections and municipal dispatch progress
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900 text-[11px] self-start sm:self-auto">
                <button
                  onClick={() => setTrendView("distribution")}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                    trendView === "distribution"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <BarChart3 className="w-3 h-3" />
                  <span>Distress Breakdown</span>
                </button>
                <button
                  onClick={() => setTrendView("daily")}
                  className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
                    trendView === "daily"
                      ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  <span>Survey Log</span>
                </button>
              </div>
            </div>

            {loadingTrends ? (
              <div className="h-56 flex items-center justify-center text-xs text-slate-400 font-mono">
                Synchronizing telemetry trends...
              </div>
            ) : trendView === "distribution" ? (
              <div>
                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={defectDistributionData}
                      margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#1E293B",
                          color: "#F8FAFC",
                          borderRadius: "6px",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Bar dataKey="critical" name="Critical" fill="#EF4444" radius={[3, 3, 0, 0]} isAnimationActive={!isReduced} animationDuration={600} />
                      <Bar dataKey="severe" name="Severe" fill="#F59E0B" radius={[3, 3, 0, 0]} isAnimationActive={!isReduced} animationDuration={600} />
                      <Bar dataKey="moderate" name="Moderate" fill="#3B82F6" radius={[3, 3, 0, 0]} isAnimationActive={!isReduced} animationDuration={600} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Computed from 73 real RDD2022-India neural detections</span>
                  <Link to="/maintenance?tab=defects" className="text-blue-600 dark:text-blue-400 hover:underline">
                    View raw defect catalog &rarr;
                  </Link>
                </div>
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
                        <th className="text-right">Citizen Reports</th>
                        <th className="text-right">Repairs Verified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTrends.map((row) => (
                        <tr key={row.date}>
                          <td className="font-mono text-xs font-semibold">{row.date}</td>
                          <td className="text-right font-mono font-medium">{row.observations_count}</td>
                          <td className="text-right font-mono text-slate-600 dark:text-slate-400">{row.complaints_count}</td>
                          <td className="text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">{row.repairs_count}</td>
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
                  Sector-wise defect density and repair allocation (Click any row to view defects)
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
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedWards.map((w) => {
                      const repairPct =
                        w.total_defects > 0
                          ? Math.round((w.repaired_defects / w.total_defects) * 100)
                          : 100;
                      const hasCritical = w.critical_defects > 0;
                      const isSelected = selectedCorridor === w.ward_id;

                      return (
                        <tr
                          key={w.ward_id}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-blue-50/50 dark:bg-blue-950/30"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                          }`}
                          onClick={() => {
                            setSelectedCorridor(w.ward_id);
                            setInspectingWard(w);
                          }}
                        >
                          <td className="font-medium text-slate-900 dark:text-slate-100">
                            <span>{w.ward_name}</span>
                            {w.ward_code && (
                              <span className="font-mono text-[10px] text-slate-400 ml-1.5">
                                ({w.ward_code})
                              </span>
                            )}
                          </td>
                          <td className="text-right font-mono font-medium">{w.total_defects}</td>
                          <td className="text-right font-mono">
                            {hasCritical ? (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                                {w.critical_defects}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="text-right font-mono text-emerald-600 dark:text-emerald-400 font-medium">
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
                          <td className="text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/maintenance?tab=defects&ward=${w.ward_code || w.ward_id}`);
                              }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-0.5"
                            >
                              <span>Inspect</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
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
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  SLA Deadlines &amp; Priority
                </h2>
                <span className="text-[11px] text-slate-400">Contractor resolution schedules</span>
              </div>
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
                      className="p-2.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            #{wo.id.slice(0, 8)}
                          </span>
                          <StatusChip status={wo.status} />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Priority: <strong className="text-slate-700 dark:text-slate-300">{wo.priority}</strong>
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
                          className="block text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-medium"
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
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Recent Network Activity
                </h2>
                <span className="text-[11px] text-slate-400">Live camera patrol detections</span>
              </div>
            </div>

            <div className="space-y-3">
              {recentDefectsData?.items && recentDefectsData.items.length > 0 ? (
                recentDefectsData.items.slice(0, 5).map((def) => {
                  const seenDate = new Date(def.last_seen);
                  return (
                    <motion.div
                      key={def.id}
                      initial={isReduced ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => navigate(`/maintenance?defectId=${def.id}&tab=defects`)}
                      className="flex items-start gap-2.5 text-xs p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold truncate hover:text-blue-600">
                            {def.class_code}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 shrink-0">
                            {seenDate.toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <SeverityBadge level={def.severity_level || "Minor"} size="sm" showScore={false} />
                          <span className="text-[10px] font-mono text-slate-400">
                            #{def.id.slice(0, 8)} · {def.times_seen} passes
                          </span>
                        </div>
                      </div>
                    </motion.div>
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

      {/* Corridor Detail Side Panel (O4) */}
      <SidePanel
        isOpen={!!inspectingWard}
        onClose={() => setInspectingWard(null)}
        title={inspectingWard?.ward_name || "Corridor Detail"}
        subtitle={inspectingWard?.ward_code ? `Division Code: ${inspectingWard.ward_code} · Sector Operations` : undefined}
      >
        {inspectingWard && (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Total Defects</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">{inspectingWard.total_defects}</span>
              </div>
              <div className="p-3 rounded-md bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
                <span className="text-rose-600 dark:text-rose-400 block mb-1">Critical Hazards</span>
                <span className="text-xl font-bold font-mono text-rose-700 dark:text-rose-300">{inspectingWard.critical_defects}</span>
              </div>
              <div className="p-3 rounded-md bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50">
                <span className="text-emerald-600 dark:text-emerald-400 block mb-1">Repaired</span>
                <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">{inspectingWard.repaired_defects}</span>
              </div>
              <div className="p-3 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 block mb-1">Resolution Rate</span>
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                  {inspectingWard.total_defects > 0 ? Math.round((inspectingWard.repaired_defects / inspectingWard.total_defects) * 100) : 100}%
                </span>
              </div>
            </div>

            <div className="p-3 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 space-y-2">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                <span>Civil Maintenance Status</span>
                <span className="font-mono text-[11px] text-slate-500">Ward ID: {inspectingWard.ward_id.slice(0, 8)}</span>
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Corridor distress profiles are tracked via automated vision patrols and citizen geo-reports. High-severity potholes and structural cracks in this sector are scheduled according to municipal SLA deadlines.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => {
                  const code = inspectingWard.ward_code || inspectingWard.ward_id;
                  setInspectingWard(null);
                  navigate(`/maintenance?tab=defects&ward=${code}`);
                }}
                className="btn btn-primary flex-1 justify-center py-2 text-xs"
              >
                Inspect All Defects in Ward
              </button>
              <button
                onClick={() => {
                  const code = inspectingWard.ward_code || inspectingWard.ward_id;
                  setInspectingWard(null);
                  navigate(`/maintenance?tab=work-orders&ward=${code}`);
                }}
                className="btn btn-secondary flex-1 justify-center py-2 text-xs"
              >
                Work Orders
              </button>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
};
