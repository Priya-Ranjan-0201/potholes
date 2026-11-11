import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  api,
  ModelDriftAlertItem,
} from "../api/client";
import {
  Cpu,
  CheckCircle,
  AlertTriangle,
  FileCheck2,
  Download,
  RefreshCw,
  Sliders,
  Shield,
  Layers,
  X,
} from "./Icons";
import { useToast } from "../context/ToastContext";

export const ModelDriftMonitoringWorkbench: React.FC = () => {
  const { success, info } = useToast();

  const [activeSimulation, setActiveSimulation] = useState<string | null>(null);
  const [includeGroundTruth, setIncludeGroundTruth] = useState<boolean>(true);
  const [acknowledgeModalAlert, setAcknowledgeModalAlert] = useState<ModelDriftAlertItem | null>(null);
  const [engineerName, setEngineerName] = useState<string>("Lead Municipal ML Engineer");
  const [investigationNotes, setInvestigationNotes] = useState<string>(
    "Inspected edge camera lens calibration and daylight illumination shift. Sensor gain within tolerance."
  );

  // Queries
  const { data: registryList } = useQuery({
    queryKey: ["modelRegistry"],
    queryFn: api.listModelRegistry,
  });

  const { data: comparisonData } = useQuery({
    queryKey: ["modelComparison"],
    queryFn: () =>
      api.compareModels({
        candidate_version: "v1.3.0-rc1",
        baseline_version: "v1.2.0-int8",
      }),
  });

  const { data: alertsList, refetch: refetchAlerts } = useQuery({
    queryKey: ["driftAlerts"],
    queryFn: () => api.listDriftAlerts(),
  });

  const { data: retrainingList, refetch: refetchRetraining } = useQuery({
    queryKey: ["retrainingRecommendations"],
    queryFn: api.listRetrainingRecommendations,
  });

  const {
    data: driftData,
    refetch: refetchDrift,
  } = useQuery({
    queryKey: ["driftAnalysis", activeSimulation, includeGroundTruth],
    queryFn: () =>
      api.analyzeDrift({
        model_version: "v1.2.0-int8",
        dataset_name: "NH-44 Patrol Stream",
        include_ground_truth: includeGroundTruth,
        simulate_domain_shift: activeSimulation,
        sample_count: 50,
      }),
  });

  // Acknowledge Alert Mutation
  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { engineer_name: string; investigation_notes: string } }) =>
      api.acknowledgeDriftAlert(id, payload),
    onSuccess: () => {
      refetchAlerts();
      setAcknowledgeModalAlert(null);
      success("Alert Acknowledged", "Audit trail record saved with human engineer sign-off.");
    },
  });

  // Trigger Retraining Mutation
  const triggerRetrainingMutation = useMutation({
    mutationFn: (payload: { recommendation_id: string; dataset_version: string }) =>
      api.triggerRetraining(payload),
    onSuccess: (data) => {
      refetchRetraining();
      success(
        "Retraining Initiated",
        `Controlled retraining experiment launched for ${data.affected_domain} targeting ${data.dataset_version_target}.`
      );
    },
  });

  const activeModel = registryList?.find((m) => m.is_active) || registryList?.[0];

  const getPsiBadge = (val: number) => {
    if (val < 0.10) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          STABLE (PSI {val.toFixed(3)})
        </span>
      );
    }
    if (val <= 0.25) {
      return (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          MODERATE SHIFT (PSI {val.toFixed(3)})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
        SIGNIFICANT DRIFT (PSI {val.toFixed(3)})
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Active Model Status Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <h2 className="text-lg sm:text-xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">
                Model Drift &amp; Continuous Performance Monitoring
              </h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Automated data &amp; concept drift tracking, statistical stability index (PSI/KS), environmental robustness, and candidate model governance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={api.getDriftExportCsvUrl()}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Audit CSV</span>
            </a>
            <button
              onClick={() => {
                refetchDrift();
                refetchAlerts();
                refetchRetraining();
                info("Metrics Refreshed", "Loaded latest model stability and drift statistics.");
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run Live Evaluation</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Production Model</span>
            <span className="text-slate-900 dark:text-white font-bold text-sm">{activeModel?.model_name || "YOLO11n-INT8"}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Version {activeModel?.version || "v1.2.0-int8"}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Input Data Drift (PSI)</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              {driftData ? driftData.psi_overall.toFixed(3) : "0.042"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              {driftData?.is_input_drift_detected ? "Shift Detected" : "Baseline Stable"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Concept Drift (ΔmAP)</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold text-sm">
              {driftData?.map50_delta_vs_baseline !== undefined && driftData.map50_delta_vs_baseline !== null
                ? `${driftData.map50_delta_vs_baseline > 0 ? "+" : ""}${(driftData.map50_delta_vs_baseline * 100).toFixed(1)}%`
                : "No GT (Unlabeled)"}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              {driftData?.has_ground_truth ? "Ground-Truth Verified" : "Input Shift Mode"}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Active Alerts</span>
            <span className={`font-bold text-sm ${(alertsList?.length || 0) > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {alertsList?.length ?? 0} Active
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              {(alertsList?.filter((a) => a.severity === "CRITICAL").length || 0)} Critical
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Data Drift Inspector (Controlled Domain Shift Simulator) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Statistical Data Drift (PSI &amp; KS-Test)</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Statistical monitoring of incoming patrol stream against reference baseline. Select a domain scenario to simulate real-world environmental distribution shifts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGroundTruth}
                onChange={(e) => setIncludeGroundTruth(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span>Include Ground Truth (Concept Drift)</span>
            </label>
          </div>
        </div>

        {/* Domain Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mr-1">Simulate Patrol Stream:</span>
          {[
            { id: null, label: "Baseline / Clear Highway" },
            { id: "rainy_wet", label: "Monsoon / Wet Asphalt" },
            { id: "nighttime", label: "Low-Light Nighttime" },
            { id: "lens_blur", label: "Defocused / Dirty Lens" },
          ].map((scen) => (
            <button
              key={scen.id ?? "baseline"}
              onClick={() => setActiveSimulation(scen.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                activeSimulation === scen.id
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {scen.label}
            </button>
          ))}
        </div>

        {/* Statistical PSI Breakdown Cards */}
        {driftData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Brightness Stability</span>
                {getPsiBadge(driftData.psi_brightness)}
              </div>
              <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                PSI: <strong className="text-slate-900 dark:text-white">{driftData.psi_brightness.toFixed(4)}</strong>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                KS-Stat: {driftData.ks_brightness_stat.toFixed(3)} (p={driftData.ks_brightness_pvalue.toExponential(2)})
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Contrast Stability</span>
                {getPsiBadge(driftData.psi_contrast)}
              </div>
              <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                PSI: <strong className="text-slate-900 dark:text-white">{driftData.psi_contrast.toFixed(4)}</strong>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Standard Deviation distribution
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Sharpness Stability</span>
                {getPsiBadge(driftData.psi_sharpness)}
              </div>
              <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                PSI: <strong className="text-slate-900 dark:text-white">{driftData.psi_sharpness.toFixed(4)}</strong>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Laplacian variance edge energy
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Overall Domain Drift</span>
                {getPsiBadge(driftData.psi_overall)}
              </div>
              <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                PSI: <strong className="text-slate-900 dark:text-white">{driftData.psi_overall.toFixed(4)}</strong>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {driftData.input_drift_summary}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Environmental & Corridor Breakdown */}
      {driftData && driftData.environmental_matrix && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Environmental &amp; Corridor Breakdown</span>
            </h3>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Patrol Conditions Tested</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(driftData.environmental_matrix).map(([envName, val]: [string, any]) => (
              <div key={envName} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/90 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold capitalize text-slate-800 dark:text-slate-300">
                  <span>{envName}</span>
                  <span className={`font-mono ${val.recall >= 0.85 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                    {(val.recall * 100).toFixed(0)}% Recall
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${val.recall >= 0.85 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(100, val.recall * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>mAP50: {(val.map50 * 100).toFixed(1)}%</span>
                  <span>{val.samples} frames</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Comparison & Acceptance Rules */}
      {comparisonData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span>Model Comparison &amp; Acceptance Checks</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Evaluation of candidate model ({comparisonData.candidate.version}) against production baseline ({comparisonData.production.version}) across 5 strict municipal acceptance rules.
              </p>
            </div>

            <div className="shrink-0">
              <span
                className={`px-3 py-1 rounded-md text-xs font-mono font-bold border ${
                  comparisonData.promotion_gate.passed_all
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40"
                }`}
              >
                {comparisonData.promotion_gate.verdict}
              </span>
            </div>
          </div>

          {/* 5-Rule Gate Checklist */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Municipal Rule</th>
                  <th className="py-2.5 px-3">Target Acceptance Gate</th>
                  <th className="py-2.5 px-3">Production (v1.2.0)</th>
                  <th className="py-2.5 px-3">Candidate (v1.3.0)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 bg-white dark:bg-slate-900/30 font-mono text-slate-700 dark:text-slate-300">
                {comparisonData.promotion_gate.rules.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{r.rule_name}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400 font-sans text-xs">{r.description}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                      {typeof r.production_val === "number" ? r.production_val.toFixed(2) : String(r.production_val)}
                    </td>
                    <td className="py-2 px-3 text-slate-900 dark:text-white font-bold">
                      {typeof r.candidate_val === "number" ? r.candidate_val.toFixed(2) : String(r.candidate_val)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.passed
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40"
                            : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        {r.passed ? "PASSED" : "FAILED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Alerts & Remediation Center */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Degradation &amp; Drift Alerts</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Actionable notifications on potholes, contrast drop, false positives, or edge latency degradation.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {alertsList && alertsList.length > 0 ? (
            alertsList.map((alert) => (
              <div
                key={alert.id}
                className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        alert.severity === "CRITICAL"
                          ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/40"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/40"
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{alert.alert_type}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Model {alert.affected_model_version}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Investigation steps: {alert.suggested_investigation_steps.join(" • ")}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {alert.is_acknowledged ? (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Signed off: {alert.acknowledged_by}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => setAcknowledgeModalAlert(alert)}
                      className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                    >
                      Engineer Sign-Off
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 font-mono">
              No active degradation alerts across monitored corridors.
            </div>
          )}
        </div>
      </div>

      {/* Retraining Recommendations */}
      {retrainingList && retrainingList.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-blue-500 dark:text-cyan-400" />
                <span>Retraining Recommendations</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Suggested retraining datasets and acceptance thresholds.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {retrainingList.map((rec) => (
              <div
                key={rec.recommendation_id}
                className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Domain: {rec.affected_domain}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-blue-500/15 text-blue-700 dark:text-blue-300">
                      Target: {rec.dataset_version_target}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    Samples required: <strong className="text-slate-900 dark:text-white">{rec.sample_count_needed} frames</strong>
                  </span>
                </div>

                <div className="text-xs text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-slate-400">Action Plan: </strong>
                  {rec.action_plan.join(" → ")}
                </div>

                <div className="flex items-center justify-end pt-1">
                  <button
                    disabled={triggerRetrainingMutation.isPending || rec.status === "TRAINING"}
                    onClick={() =>
                      triggerRetrainingMutation.mutate({
                        recommendation_id: rec.recommendation_id,
                        dataset_version: rec.dataset_version_target,
                      })
                    }
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    {triggerRetrainingMutation.isPending ? "Queuing Retraining..." : "Launch Retraining Experiment"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Engineer Sign-Off Modal */}
      {acknowledgeModalAlert && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAcknowledgeModalAlert(null)}
        >
          <div
            className="w-full max-w-md card p-5 border shadow-xl bg-white dark:bg-slate-900 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Acknowledge Alert &amp; Record Investigation
              </h3>
              <button
                onClick={() => setAcknowledgeModalAlert(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Engineer Name
                </label>
                <input
                  type="text"
                  value={engineerName}
                  onChange={(e) => setEngineerName(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Investigation &amp; Resolution Notes
                </label>
                <textarea
                  rows={3}
                  value={investigationNotes}
                  onChange={(e) => setInvestigationNotes(e.target.value)}
                  className="w-full p-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setAcknowledgeModalAlert(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  disabled={acknowledgeMutation.isPending || investigationNotes.trim().length < 5}
                  onClick={() =>
                    acknowledgeMutation.mutate({
                      id: acknowledgeModalAlert.id,
                      payload: {
                        engineer_name: engineerName,
                        investigation_notes: investigationNotes,
                      },
                    })
                  }
                  className="btn-primary text-xs"
                >
                  {acknowledgeMutation.isPending ? "Recording..." : "Save Engineer Sign-Off"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
