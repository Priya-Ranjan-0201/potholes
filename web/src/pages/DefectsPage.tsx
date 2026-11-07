import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, DefectItem } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Filter,
  Eye,
  Sliders,
  X,
  History,
  ShieldCheck,
  Copy,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle,
} from "../components/Icons";
import { MilestoneHeader, SeverityBadge, EmptyState } from "../ui";

export const DefectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const { t } = useLanguage();

  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [activeDefectId, setActiveDefectId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        limit: 100,
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

  const handleCopyCoords = (lat: number, lon: number, id: string) => {
    const coords = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    navigator.clipboard.writeText(coords);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };



  // Filter defects based on query and severity dropdown
  const filteredItems = (data?.items || []).filter((defect: DefectItem) => {
    if (selectedSeverity && defect.severity_level !== selectedSeverity) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = defect.id.toLowerCase().includes(q);
      const matchClass = defect.class_code.toLowerCase().includes(q);
      const matchRoad = (defect.road_segment_id || "").toLowerCase().includes(q);
      if (!matchId && !matchClass && !matchRoad) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Page Header & Filtering with Milestone Stone */}
      <div className="dhaba-card p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <MilestoneHeader
              km="04"
              title={t("defectsTitle")}
              subtitle={t("defectsSubtitle")}
              highway="NH-44"
              variant="yellow"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  viewMode === "table"
                    ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-900 dark:hover:text-white"
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter controls bar */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>{t("filterLabel")}</span>
          </div>

          <input
            type="text"
            placeholder="Search by ID, corridor, or road..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none min-w-[200px]"
          />

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

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical (76-100)</option>
            <option value="Severe">Severe (51-75)</option>
            <option value="Moderate">Moderate (26-50)</option>
            <option value="Minor">Minor (0-25)</option>
          </select>

          <span className="ml-auto text-xs font-bold text-slate-500 dark:text-slate-400">
            Showing {filteredItems.length} records
          </span>
        </div>
      </div>

      {/* Defects List (Table or Card Grid) */}
      {viewMode === "table" ? (
        <div className="dhaba-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">{t("colDefectId")}</th>
                  <th className="py-3 px-4">{t("colClass")}</th>
                  <th className="py-3 px-4">Location &amp; Corridor</th>
                  <th className="py-3 px-4 text-center">GPS Coordinates</th>
                  <th className="py-3 px-4 text-center">{t("colSightings")}</th>
                  <th className="py-3 px-4">{t("colSeverity")}</th>
                  <th className="py-3 px-4 text-center">{t("scoreLabel")}</th>
                  <th className="py-3 px-4">{t("colStatus")}</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                      Loading defects registry...
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((defect: DefectItem) => (
                    <tr key={defect.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono text-xs font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{defect.id.slice(0, 8)}&hellip;</span>
                          {defect.is_demo && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200">
                              DEMO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {defect.class_code.toUpperCase()}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {defect.road_segment_id || "Corridor Segment Urban-12"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Ward 12 &bull; Accuracy &plusmn;2.4m
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                            {defect.latitude.toFixed(5)}, {defect.longitude.toFixed(5)}
                          </span>
                          <button
                            onClick={() => handleCopyCoords(defect.latitude, defect.longitude, defect.id)}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
                            title="Copy coordinates"
                          >
                            {copiedId === defect.id ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${defect.latitude},${defect.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600 transition"
                            title="Open in your maps app"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-full">
                          {defect.times_seen}x
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <SeverityBadge level={defect.severity_level || "Minor"} size="sm" showScore={false} />
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900 dark:text-white">
                        {defect.normalized_score !== null && defect.normalized_score !== undefined
                          ? Math.round(defect.normalized_score)
                          : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            defect.status === "REPAIRED"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                              : defect.status === "ACTIVE"
                              ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                              : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          }`}
                        >
                          {defect.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveDefectId(defect.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-lg text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                      No matching defects found in registry
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-400">
              Loading defect cards...
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((defect: DefectItem) => (
              <div
                key={defect.id}
                className="dhaba-card p-4 space-y-3 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {defect.class_code.toUpperCase()}
                  </span>
                  <SeverityBadge
                    level={defect.severity_level || "Minor"}
                    score={defect.normalized_score ?? undefined}
                    size="sm"
                  />
                </div>

                <div className="text-xs space-y-1">
                  <div className="text-slate-700 dark:text-slate-300 font-semibold truncate">
                    Corridor: {defect.road_segment_id || "Urban Link Central"}
                  </div>
                  <div className="font-mono text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      {defect.latitude.toFixed(5)}, {defect.longitude.toFixed(5)}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyCoords(defect.latitude, defect.longitude, defect.id)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900"
                        title="Copy coordinates"
                      >
                        {copiedId === defect.id ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${defect.latitude},${defect.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-blue-600"
                        title="Open in your maps app"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Accuracy &plusmn;2.4m &bull; Sightings: {defect.times_seen}x pass(es)
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                      defect.status === "REPAIRED"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : defect.status === "ACTIVE"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {defect.status}
                  </span>
                  <button
                    onClick={() => setActiveDefectId(defect.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:opacity-90 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                title="No Matching Defects in Registry"
                description="No road distress records match your current filter settings. All corridors in this selection are clear."
                actionLabel="Scan New Road Photo"
                actionLink="/scanner"
              />
            </div>
          )}
        </div>
      )}

      {/* Defect Detail Slide-Over / Modal */}
      {activeDefectId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Defect Telemetry &amp; Audit</h2>
                <span className="font-mono text-xs text-slate-400">{activeDefectId}</span>
              </div>
              <button
                onClick={() => setActiveDefectId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail || !defectDetail ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading defect data...</div>
            ) : (
              <div className="space-y-6">
                {/* Defect Status & Coordinates Card */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Class</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {defectDetail.defect.class_code.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Status</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {defectDetail.defect.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">GPS Coordinates</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-bold">
                        {defectDetail.defect.latitude.toFixed(5)}, {defectDetail.defect.longitude.toFixed(5)}
                      </span>
                      <button
                        onClick={() =>
                          handleCopyCoords(
                            defectDetail.defect.latitude,
                            defectDetail.defect.longitude,
                            defectDetail.defect.id
                          )
                        }
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                        title="Copy coordinates"
                      >
                        {copiedId === defectDetail.defect.id ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${defectDetail.defect.latitude},${defectDetail.defect.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600"
                        title="Open in your maps app"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Road Corridor</span>
                    <span className="font-mono text-xs text-slate-800 dark:text-slate-200">
                      {defectDetail.defect.road_segment_id || "Corridor Urban-12 (Unsnapped)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-500">Sightings (Multi-Pass)</span>
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                      {defectDetail.defect.times_seen} pass(es)
                    </span>
                  </div>
                </div>

                {/* Multi-Factor Severity Assessment Card */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Severity Scoring (Rubric Inspired by IRC:SP:84-2019)
                    </h3>
                    <SeverityBadge
                      level={defectDetail.defect.severity_level || "Minor"}
                      score={defectDetail.defect.normalized_score ?? undefined}
                      size="md"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Normalized Score
                      </span>
                      <span className="text-xl font-black text-slate-900 dark:text-white">
                        {defectDetail.defect.normalized_score !== null &&
                        defectDetail.defect.normalized_score !== undefined
                          ? Math.round(defectDetail.defect.normalized_score)
                          : "N/A"}
                        <span className="text-xs text-slate-400 font-normal"> / 100</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Review Trigger
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
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
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Human Severity Override (Rule B6)
                      </button>
                    </div>
                  )}
                </div>

                {/* Observation History Timeline */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    Camera Pass Observations ({defectDetail.observations.length})
                  </h3>

                  <div className="space-y-2">
                    {defectDetail.observations.map((obs, idx) => (
                      <div
                        key={obs.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            Pass #{idx + 1} &mdash; Confidence: {Math.round(obs.confidence * 100)}%
                          </span>
                          <span className="text-slate-400 text-[11px] block">
                            {new Date(obs.observed_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-0.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 text-[10px] font-mono">
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
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Human Severity Override</h3>
              <button onClick={() => setOverrideModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authoritative human adjustment overriding automated AI calculation. The change and reason will be permanently audited in accordance with Rule B6.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  New Hazard Severity Level
                </label>
                <select
                  value={overrideLevel}
                  onChange={(e) => setOverrideLevel(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
                >
                  <option value="Minor">Minor (0-25)</option>
                  <option value="Moderate">Moderate (26-50)</option>
                  <option value="Severe">Severe (51-75)</option>
                  <option value="Critical">Critical (76-100)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Engineering Justification (Mandatory)
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Defect is located directly in high-speed motorcycle lane near school crosswalk"
                  rows={3}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOverrideModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
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
