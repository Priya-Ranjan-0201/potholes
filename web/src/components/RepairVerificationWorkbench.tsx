import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  VerificationAssessment,
  BenchmarkPairItem,
} from "../api/client";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck2,
  History,
  Activity,
  Search,
  Zap,
} from "./Icons";
import { CompareSlider } from "../motion/CompareSlider";
import { useToast } from "../context/ToastContext";

interface RepairVerificationWorkbenchProps {
  initialWorkOrderId?: string | null;
  initialDefectId?: string | null;
}

type ViewMode = "slider" | "side-by-side" | "matches" | "diff";

export const RepairVerificationWorkbench: React.FC<RepairVerificationWorkbenchProps> = ({
  initialWorkOrderId,
  initialDefectId,
}) => {
  const queryClient = useQueryClient();
  const { success, info, error: toastError } = useToast();

  // Benchmarks & Records Queries
  const { data: benchmarks = [] } = useQuery({
    queryKey: ["verificationBenchmarks"],
    queryFn: api.getVerificationBenchmarks,
    staleTime: 60000,
  });

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [recordSearch, setRecordSearch] = useState<string>("");

  const { data: records = [] } = useQuery({
    queryKey: ["verificationRecords", statusFilter],
    queryFn: () => api.listVerificationRecords({ status: statusFilter }),
    refetchInterval: 10000,
  });

  // Active Comparison State
  const [beforeSrc, setBeforeSrc] = useState<string>(
    "/samples/benchmark_pairs/pothole_before.jpg"
  );
  const [afterSrc, setAfterSrc] = useState<string>(
    "/samples/benchmark_pairs/pothole_repaired.jpg"
  );
  const [corridorName, setCorridorName] = useState<string>(
    "NH-44 GT Road Corridor"
  );
  const latitude = 30.901;
  const longitude = 75.8573;
  const [viewMode, setViewMode] = useState<ViewMode>("slider");
  const [activeAssessment, setActiveAssessment] =
    useState<VerificationAssessment | null>(null);

  // Load first benchmark on startup if available
  useEffect(() => {
    if (benchmarks.length > 0 && !activeAssessment) {
      const b0 = benchmarks[0];
      setBeforeSrc(b0.before_src);
      setAfterSrc(b0.after_src);
      setCorridorName(b0.corridor);
    }
  }, [benchmarks]);

  // Run Verification Mutation
  const verifyMutation = useMutation({
    mutationFn: api.verifyRepairAssessment,
    onSuccess: (data) => {
      setActiveAssessment(data);
      queryClient.invalidateQueries({ queryKey: ["verificationRecords"] });

      if (data.status === "successfully_repaired") {
        success(
          "Repair Verified",
          `Effectiveness score ${data.effectiveness_pct}%. Clean asphalt compaction confirmed.`
        );
      } else if (data.status === "partially_repaired") {
        info(
          "Partial Repair",
          `Effectiveness score ${data.effectiveness_pct}%. Unsealed defect area remains.`
        );
      } else if (data.status === "damage_recurring") {
        info(
          "Recurring Damage Alert",
          `Distress recurring at historical repair site (Recurrence #${data.recurrence_count}).`
        );
      } else if (data.status === "verification_inconclusive") {
        info(
          "Verification Inconclusive",
          "Low feature correspondence. Viewpoint difference prevents automatic verification."
        );
      } else {
        info("Verification Result", data.explanation);
      }
    },
    onError: (err: any) => {
      toastError("Verification Failed", err?.message || "Execution error.");
    },
  });

  const handleRunVerification = () => {
    verifyMutation.mutate({
      work_order_id: initialWorkOrderId || null,
      defect_id: initialDefectId || null,
      corridor_name: corridorName,
      latitude,
      longitude,
      before_image_src: beforeSrc,
      after_image_src: afterSrc,
    });
  };

  const handleSelectBenchmark = (b: BenchmarkPairItem) => {
    setBeforeSrc(b.before_src);
    setAfterSrc(b.after_src);
    setCorridorName(b.corridor);
    setActiveAssessment(null);
  };

  const handleCustomUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "before" | "after"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        if (target === "before") setBeforeSrc(reader.result);
        else setAfterSrc(reader.result);
        setActiveAssessment(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "successfully_repaired":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Successfully Repaired</span>
          </span>
        );
      case "partially_repaired":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Partially Repaired</span>
          </span>
        );
      case "damage_recurring":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <History className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Damage Recurring</span>
          </span>
        );
      case "new_damage_detected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <span>New Damage Detected</span>
          </span>
        );
      case "incomplete_repair":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Incomplete Repair</span>
          </span>
        );
      case "verification_inconclusive":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600/30">
            <Activity className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Verification Inconclusive</span>
          </span>
        );
    }
  };

  const filteredRecords = records.filter((r) => {
    if (!recordSearch) return true;
    const q = recordSearch.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.corridor_name.toLowerCase().includes(q) ||
      r.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3.5 flex items-center justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Audits Conducted
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {records.length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Official verification runs
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 dark:text-blue-400">
            <FileCheck2 className="w-4 h-4" />
          </div>
        </div>

        <div className="card p-3.5 flex items-center justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Successful Repairs
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {records.filter((r) => r.status === "successfully_repaired").length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Zero residual distress
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="card p-3.5 flex items-center justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Recurring Damage Alerts
            </div>
            <div className="text-xl font-bold text-rose-600 dark:text-red-400 mt-0.5">
              {records.filter((r) => r.recurrence_detected).length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Within 25m of prior patch
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-red-400">
            <History className="w-4 h-4" />
          </div>
        </div>

        <div className="card p-3.5 flex items-center justify-between border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
              Inconclusive Audits
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {records.filter((r) => r.status === "verification_inconclusive").length}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Human engineer audit required
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Comparison Viewer */}
      <div className="card p-5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                Before-and-After Repair Verification
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                ORB RANSAC + ONNX
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Perspective alignment and remaining surface defect check between pre- and post-repair photos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleRunVerification}
              disabled={verifyMutation.isPending}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>
                {verifyMutation.isPending ? "Verifying..." : "Verify Repair"}
              </span>
            </button>
            <a
              href={api.getVerificationsCsvUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Preset Benchmark Pair Bar */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Benchmark Test Cases & Evaluation Presets
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {benchmarks.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelectBenchmark(b)}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  beforeSrc === b.before_src && afterSrc === b.after_src
                    ? "border-amber-500/60 bg-amber-500/10 text-slate-900 dark:text-slate-100"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="text-xs font-semibold truncate">{b.title}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {b.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Image Selectors / Dropzone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                1. Original Defect Image (Before)
              </span>
              <label className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer">
                Upload Custom
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCustomUpload(e, "before")}
                  className="hidden"
                />
              </label>
            </div>
            <div className="aspect-video w-full rounded-md overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
              <img
                src={beforeSrc}
                alt="Before repair road damage"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] text-slate-200 font-mono">
                BEFORE
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                2. Post-Repair Inspection Image (After)
              </span>
              <label className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline cursor-pointer">
                Upload Custom
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleCustomUpload(e, "after")}
                  className="hidden"
                />
              </label>
            </div>
            <div className="aspect-video w-full rounded-md overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center relative">
              <img
                src={afterSrc}
                alt="Post-repair road pavement"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] text-slate-200 font-mono">
                AFTER
              </span>
            </div>
          </div>
        </div>

        {/* Comparison Viewer & View Modes */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800/80 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Inspection View Mode:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950/80 p-0.5">
                <button
                  onClick={() => setViewMode("slider")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "slider"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Split Slider
                </button>
                <button
                  onClick={() => setViewMode("side-by-side")}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "side-by-side"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setViewMode("matches")}
                  disabled={!activeAssessment?.feature_matches_data_uri}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${
                    viewMode === "matches"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Keypoint Inliers
                </button>
                <button
                  onClick={() => setViewMode("diff")}
                  disabled={!activeAssessment?.difference_heatmap_data_uri}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 ${
                    viewMode === "diff"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  Pixel Diff Overlay
                </button>
              </div>
            </div>

            {activeAssessment && (
              <div className="flex items-center gap-2">
                <a
                  href={api.getVerificationPdfUrl(activeAssessment.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-xs inline-flex items-center gap-1.5 transition-colors border border-slate-300 dark:border-slate-700"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Download Official Certificate (PDF)</span>
                </a>
              </div>
            )}
          </div>

          {/* Visual Display */}
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/70 p-2">
            {viewMode === "slider" && (
              <div className="w-full max-w-4xl mx-auto aspect-video rounded-lg overflow-hidden">
                <CompareSlider
                  beforeImage={beforeSrc}
                  afterImage={activeAssessment?.aligned_after_data_uri || afterSrc}
                  beforeLabel="Pre-Repair Damage"
                  afterLabel="Verified Surface"
                  className="h-full w-full"
                />
              </div>
            )}

            {viewMode === "side-by-side" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                  <img
                    src={beforeSrc}
                    alt="Before repair"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-slate-200">
                    Original Distress
                  </div>
                  {activeAssessment?.before_defects.map((def, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        left: `${def.box[0]}%`,
                        top: `${def.box[1]}%`,
                        width: `${def.box[2]}%`,
                        height: `${def.box[3]}%`,
                      }}
                      className="border-2 border-red-500 bg-red-500/20 rounded-sm pointer-events-none"
                    >
                      <span className="absolute -top-5 left-0 px-1 py-0.5 rounded bg-red-600 text-[9px] font-mono text-white font-bold whitespace-nowrap">
                        {def.label} {(def.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
                  <img
                    src={activeAssessment?.aligned_after_data_uri || afterSrc}
                    alt="After repair"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-slate-200">
                    Post-Repair Inspection
                  </div>
                  {activeAssessment?.remaining_defects.map((def, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: "absolute",
                        left: `${def.box[0]}%`,
                        top: `${def.box[1]}%`,
                        width: `${def.box[2]}%`,
                        height: `${def.box[3]}%`,
                      }}
                      className="border-2 border-amber-500 bg-amber-500/20 rounded-sm pointer-events-none"
                    >
                      <span className="absolute -top-5 left-0 px-1 py-0.5 rounded bg-amber-600 text-[9px] font-mono text-slate-950 font-bold whitespace-nowrap">
                        REMAINING {def.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === "matches" && activeAssessment?.feature_matches_data_uri && (
              <div className="space-y-1">
                <img
                  src={activeAssessment.feature_matches_data_uri}
                  alt="Feature matches and inliers"
                  className="w-full rounded-lg object-contain max-h-[500px]"
                />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-mono py-1">
                  Green lines: Homography inliers ({activeAssessment.inliers_count} inliers, {(activeAssessment.inlier_ratio * 100).toFixed(1)}% correspondence)
                </div>
              </div>
            )}

            {viewMode === "diff" && activeAssessment?.difference_heatmap_data_uri && (
              <div className="space-y-1">
                <img
                  src={activeAssessment.difference_heatmap_data_uri}
                  alt="Surface pixel difference overlay"
                  className="w-full rounded-lg object-contain max-h-[500px]"
                />
                <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-mono py-1">
                  Highlighted regions indicate pixel-level surface texture differences after alignment
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Result Summary */}
        {activeAssessment && (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  VERIFICATION RESULT:
                </span>
                {getStatusBadge(activeAssessment.status)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Audit ID: #{activeAssessment.id}
              </div>
            </div>

            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Explanation:{" "}
              </span>
              {activeAssessment.explanation}
            </div>

            {/* Recurrence Warning Banner */}
            {activeAssessment.recurrence_detected && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <History className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700 dark:text-red-300">
                  <span className="font-semibold text-red-800 dark:text-red-200">
                    Recurring Damage Alert:{" "}
                  </span>
                  Pavement failure detected within 25 meters of prior repair.
                  Recurrence count: {activeAssessment.recurrence_count}
                  {activeAssessment.days_to_recurrence !== null &&
                    ` (${activeAssessment.days_to_recurrence} days since previous repair)`}
                  . Sub-base compaction check recommended.
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Effectiveness
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {activeAssessment.effectiveness_pct}%
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Surface recovery
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Area Delta
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {activeAssessment.area_reduction_pct}% reduction
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeAssessment.remaining_area_px.toLocaleString()} px² remaining
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Alignment Inliers
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {activeAssessment.inliers_count} points
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {(activeAssessment.inlier_ratio * 100).toFixed(1)}% RANSAC ratio
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                  Measurement Basis
                </div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                  Relative Pixel Area
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Uncalibrated 2D plane
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Historical Repair Verification Records Table */}
      <div className="card p-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Historical Repair Verification Audit Records
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Structured database of municipal inspection comparisons, recurrence tracking, and certification
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit records..."
                value={recordSearch}
                onChange={(e) => setRecordSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs w-44 sm:w-56 outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 text-xs font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="successfully_repaired">Successfully Repaired</option>
              <option value="partially_repaired">Partially Repaired</option>
              <option value="incomplete_repair">Incomplete Repair</option>
              <option value="damage_recurring">Damage Recurring</option>
              <option value="verification_inconclusive">Inconclusive</option>
            </select>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Audit ID</th>
                <th className="py-2.5 px-3">Corridor</th>
                <th className="py-2.5 px-3">GPS Location</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Effectiveness</th>
                <th className="py-2.5 px-3">Area Reduction</th>
                <th className="py-2.5 px-3">Recurrence</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    No verification records found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                      #{r.id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800 dark:text-slate-300 font-medium truncate max-w-[180px]">
                      {r.corridor_name}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3">{getStatusBadge(r.status)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                      {r.effectiveness_pct}%
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono">
                      {r.area_reduction_pct}%
                    </td>
                    <td className="py-2.5 px-3">
                      {r.recurrence_detected ? (
                        <span className="text-[11px] font-semibold text-rose-600 dark:text-red-400">
                          ALERT (#{r.recurrence_count})
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">None</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right space-x-2">
                      <a
                        href={api.getVerificationPdfUrl(r.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-300 dark:border-slate-700 transition-colors"
                      >
                        PDF
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
