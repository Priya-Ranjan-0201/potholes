import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useReducedMotion } from "../motion/motion";
import {
  Activity,
  Layers,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Camera,
  CheckCircle,
} from "../components/Icons";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { StatCard, SeverityBadge, EmptyState } from "../ui";
import { useToast } from "../context/ToastContext";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { info } = useToast();
  const isReduced = useReducedMotion();
  const [isClearing, setIsClearing] = useState(false);

  const {
    data: stats,
    isLoading: loadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["statsOverview"],
    queryFn: api.getOverview,
    refetchInterval: 12000,
  });

  const { data: recentDefectsData, refetch: refetchDefects } = useQuery({
    queryKey: ["recentDefectsOverview"],
    queryFn: () => api.listDefects({ limit: 8 }),
    refetchInterval: 12000,
  });

  const handleRefresh = () => {
    refetchStats();
    refetchDefects();
    info("Updated", "Loaded latest saved detections.");
  };

  const handleClearAllData = async () => {
    if (!window.confirm("Clear all saved detections and reset counters to zero?")) {
      return;
    }
    setIsClearing(true);
    try {
      await api.clearAllDefects();
      await Promise.all([refetchStats(), refetchDefects()]);
      info("Cleared", "All saved detections have been cleared.");
    } catch (err) {
      console.error("Failed to clear data:", err);
    } finally {
      setIsClearing(false);
    }
  };

  const totalDefects = stats?.total_defects ?? 0;
  const repairedDefects = stats?.repaired_defects ?? 0;
  const criticalDefects = stats?.defects_by_severity?.["Critical"] ?? 0;
  const severeDefects = stats?.defects_by_severity?.["Severe"] ?? 0;
  const classStats = stats?.defects_by_class || {};
  const potholeCount = classStats["POTHOLE"] ?? 0;
  const crackLongCount = classStats["CRACK_LONG"] ?? 0;
  const crackTransCount = classStats["CRACK_TRANS"] ?? 0;
  const crackAlliCount = classStats["CRACK_ALLIGATOR"] ?? 0;
  const totalCracks = crackLongCount + crackTransCount + crackAlliCount;

  const classChartData = useMemo(
    () => [
      { name: "Potholes", count: potholeCount },
      { name: "Alligator Crack", count: crackAlliCount },
      { name: "Longitudinal", count: crackLongCount },
      { name: "Transverse", count: crackTransCount },
    ],
    [potholeCount, crackAlliCount, crackLongCount, crackTransCount]
  );

  if (loadingStats && !stats) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="text-center">
          <Activity className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500 font-mono text-xs">Loading detected defects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Detected Defects Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Summary of potholes and cracks saved from the road scanner
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            to="/scanner"
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Open Scanner</span>
          </Link>

          {totalDefects > 0 && (
            <button
              onClick={handleClearAllData}
              disabled={isClearing}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearing ? "Clearing..." : "Clear Data"}</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Detected"
          value={totalDefects}
          subtext={`${repairedDefects} marked repaired`}
          icon={<Layers className="w-4 h-4 text-blue-500" />}
        />
        <StatCard
          label="Potholes"
          value={potholeCount}
          subtext={potholeCount > 0 ? "Primary road cavities" : "None logged yet"}
          icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        />
        <StatCard
          label="Road Cracks"
          value={totalCracks}
          subtext="Alligator, longitudinal, transverse"
          icon={<Activity className="w-4 h-4 text-orange-500" />}
        />
        <StatCard
          label="High Severity"
          value={criticalDefects + severeDefects}
          subtext={`${criticalDefects} critical · ${severeDefects} severe`}
          icon={<CheckCircle className="w-4 h-4 text-rose-500" />}
        />
      </div>

      {totalDefects === 0 ? (
        <div className="card p-8">
          <EmptyState
            title="No detections saved yet"
            description="Scan a road photo or upload an image to detect potholes and surface cracks, then save the results."
            actionLabel="Go to Scanner"
            actionLink="/scanner"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Detected Defect Types
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Counts across classes identified by the vision model
                </p>
              </div>
              <Link
                to="/maintenance?tab=defects"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View all &rarr;
              </Link>
            </div>

            <div className="h-56 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classChartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94A3B8" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#64748B" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      color: "#F8FAFC",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Detections"
                    fill="#2563EB"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={42}
                    isAnimationActive={!isReduced}
                    animationDuration={500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Recent Detections
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Latest saved potholes and cracks
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {recentDefectsData?.items?.length ?? 0} shown
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto [scrollbar-width:thin]">
              {recentDefectsData?.items && recentDefectsData.items.length > 0 ? (
                recentDefectsData.items.map((def) => {
                  const seenDate = new Date(def.last_seen);
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => navigate(`/maintenance?defectId=${def.id}&tab=defects`)}
                      className="w-full text-left flex items-center justify-between gap-2 text-xs p-2 rounded-md border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {def.class_code.replace(/_/g, " ")}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          #{def.id.slice(0, 8)} ·{" "}
                          {seenDate.toLocaleDateString([], { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <SeverityBadge level={def.severity_level || "Minor"} size="sm" showScore={false} />
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No recent detections.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
