import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, DefectItem } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  AlertTriangle,
  Filter,
  Eye,
  Sliders,
  X,
  History,
  ShieldCheck,
} from "../components/Icons";

export const DefectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const { t } = useLanguage();

  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [activeDefectId, setActiveDefectId] = useState<string | null>(null);

  // Override modal state
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState("Severe");
  const [overrideReason, setOverrideReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["defectsList", selectedStatus, selectedClass],
    queryFn: () =>
      api.listDefects({
        status: selectedStatus || undefined,
        class_code: selectedClass || undefined,
        limit: 50,
      }),
  });

  const { data: defectDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["defectDetail", activeDefectId],
    queryFn: () => (activeDefectId ? api.getDefect(activeDefectId) : null),
    enabled: !!activeDefectId,
  });

  const overrideMutation = useMutation({
    mutationFn: (vars: { id: string; level: string; reason: string }) =>
      api.overrideSeverity(vars.id, {
        override_level: vars.level,
        reason: vars.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["defectsList"] });
      queryClient.invalidateQueries({ queryKey: ["defectDetail", activeDefectId] });
      setOverrideModalOpen(false);
      setOverrideReason("");
    },
  });

  const handleOpenDetail = (id: string) => {
    setActiveDefectId(id);
  };

  const handleCloseDetail = () => {
    setActiveDefectId(null);
  };

  const getSeverityBadgeClass = (level?: string | null) => {
    switch (level) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "Severe":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Moderate":
        return "bg-amber-100 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Page Header & Filtering */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 civic-card p-5 rounded-xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t("defectsTitle")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("defectsSubtitle")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>{t("filterLabel")}</span>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="">{t("allStatuses")}</option>
            <option value="ACTIVE">{t("activeDefects")}</option>
            <option value="TRIAGED">{t("statusUnderReview")}</option>
            <option value="IN_PROGRESS">{t("statusInProgress")}</option>
            <option value="REPAIRED">{t("repairedDefects")}</option>
          </select>

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="">{t("allDefectClasses")}</option>
            <option value="POTHOLE">{t("potholeLabel")}</option>
            <option value="CRACK_LONG">{t("crackLongLabel")}</option>
            <option value="CRACK_TRANS">{t("crackTransLabel")}</option>
          </select>
        </div>
      </div>

      {/* Defects Table */}
      <div className="civic-card rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">{t("colDefectId")}</th>
                <th className="py-3 px-4">{t("colClass")}</th>
                <th className="py-3 px-4">{t("colStatus")}</th>
                <th className="py-3 px-4 text-center">{t("colSightings")}</th>
                <th className="py-3 px-4">{t("colSeverity")}</th>
                <th className="py-3 px-4 text-center">{t("scoreLabel")}</th>
                <th className="py-3 px-4">{t("colTime")}</th>
                <th className="py-3 px-4 text-right">#</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    Loading defects catalog...
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((defect: DefectItem) => (
                  <tr key={defect.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 font-mono text-xs font-medium text-slate-800">
                      {defect.id.slice(0, 8)}&hellip;
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {defect.class_code.toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          defect.status === "REPAIRED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : defect.status === "ACTIVE"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {defect.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-full">
                        {defect.times_seen}x
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold border ${getSeverityBadgeClass(
                          defect.severity_level
                        )}`}
                      >
                        {defect.severity_level || "Minor"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {defect.normalized_score !== null && defect.normalized_score !== undefined
                        ? Math.round(defect.normalized_score)
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      {new Date(defect.first_seen).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(defect.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                    No matching defects found in registry
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Defect Detail Slide-Over / Modal */}
      {activeDefectId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Defect Telemetry &amp; Audit</h2>
                <span className="font-mono text-xs text-slate-400">{activeDefectId}</span>
              </div>
              <button
                onClick={handleCloseDetail}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail || !defectDetail ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading defect data...</div>
            ) : (
              <div className="space-y-6">
                {/* Defect Status & Coordinates Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Class</span>
                    <span className="text-sm font-bold text-slate-900">
                      {defectDetail.defect.class_code.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Status</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {defectDetail.defect.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Coordinates</span>
                    <span className="font-mono text-xs text-slate-800">
                      {defectDetail.defect.latitude.toFixed(5)}, {defectDetail.defect.longitude.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Road Segment</span>
                    <span className="font-mono text-xs text-slate-800">
                      {defectDetail.defect.road_segment_id || "Unsnapped (>50m)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Sightings (Multi-Pass)</span>
                    <span className="text-xs font-black text-emerald-700">
                      {defectDetail.defect.times_seen} pass(es)
                    </span>
                  </div>
                </div>

                {/* Multi-Factor Severity Assessment Card */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Severity Scoring (Rules R5, R6, R7)
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-black uppercase border ${getSeverityBadgeClass(
                        defectDetail.defect.severity_level
                      )}`}
                    >
                      {defectDetail.defect.severity_level || "Minor"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Normalized Score
                      </span>
                      <span className="text-xl font-black text-slate-900">
                        {defectDetail.defect.normalized_score !== null &&
                        defectDetail.defect.normalized_score !== undefined
                          ? Math.round(defectDetail.defect.normalized_score)
                          : "N/A"}
                        <span className="text-xs text-slate-400 font-normal"> / 100</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Review Trigger
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {defectDetail.defect.needs_human_review
                          ? "⚠️ Needs Engineer Review"
                          : "Standard Auto-Scored"}
                      </span>
                    </div>
                  </div>

                  {/* Human Override Action (Rule B6) */}
                  {(activeRole === "engineer" || activeRole === "admin") && (
                    <div className="pt-2">
                      <button
                        onClick={() => setOverrideModalOpen(true)}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Human Severity Override (Rule B6)
                      </button>
                    </div>
                  )}
                </div>

                {/* Observation History Timeline */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-600" />
                    Camera Pass Observations ({defectDetail.observations.length})
                  </h3>

                  <div className="space-y-2">
                    {defectDetail.observations.map((obs, idx) => (
                      <div
                        key={obs.id}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">
                            Pass #{idx + 1} &mdash; Confidence: {Math.round(obs.confidence * 100)}%
                          </span>
                          <span className="text-slate-400 text-[11px] block">
                            {new Date(obs.observed_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 bg-white text-slate-600 rounded border border-slate-200 text-[10px] font-mono">
                            {obs.track_length_frames || 1} frames
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Human Override Dialog */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Human Severity Override</h3>
              <button onClick={() => setOverrideModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Authoritative human adjustment overriding automated AI calculation. The change and reason will be permanently audited in accordance with Rule B6.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  New Hazard Severity Level
                </label>
                <select
                  value={overrideLevel}
                  onChange={(e) => setOverrideLevel(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-slate-50 font-medium"
                >
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Engineering Justification (Mandatory)
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Defect is located directly in high-speed motorcycle lane near school crosswalk"
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  activeDefectId &&
                  overrideMutation.mutate({
                    id: activeDefectId,
                    level: overrideLevel,
                    reason: overrideReason,
                  })
                }
                disabled={overrideReason.trim().length < 5 || overrideMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition"
              >
                {overrideMutation.isPending ? "Submitting..." : "Confirm Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
