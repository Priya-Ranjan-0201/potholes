import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ComplaintItem } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Plus,
  MapPin,
  Clock,
  X,
} from "../components/Icons";
import { MilestoneHeader, EmptyState } from "../ui";

export const ComplaintsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const { t } = useLanguage();

  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // New report form state
  const [lat, setLat] = useState("30.7333");
  const [lon, setLon] = useState("76.7794");
  const [description, setDescription] = useState("");

  // Transition modal state
  const [transitionComplaint, setTransitionComplaint] = useState<ComplaintItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("");
  const [transitionNotes, setTransitionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["complaintsList", selectedStatus],
    queryFn: () => api.listComplaints(selectedStatus || undefined),
    refetchInterval: 10000,
  });

  const createReportMutation = useMutation({
    mutationFn: api.createComplaint,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaintsList"] });
      queryClient.invalidateQueries({ queryKey: ["statsOverview"] });
      setReportModalOpen(false);
      setDescription("");
    },
  });

  const transitionMutation = useMutation({
    mutationFn: (vars: { id: string; status: string; notes?: string; rejection?: string }) =>
      api.transitionComplaintStatus(vars.id, {
        new_status: vars.status,
        notes: vars.notes,
        rejection_reason: vars.rejection,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaintsList"] });
      queryClient.invalidateQueries({ queryKey: ["statsOverview"] });
      setTransitionComplaint(null);
    },
  });

  const complaints = data?.items || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/40";
      case "UNDER_REVIEW":
        return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40";
      case "VERIFIED":
        return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40";
      case "ASSIGNED":
        return "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/40";
      case "IN_PROGRESS":
        return "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/40";
      case "RESOLVED":
        return "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/60";
      case "REJECTED":
        return "bg-red-500/15 text-red-800 dark:text-red-300 border-red-500/40";
      default:
        return "bg-stone-500/15 text-stone-700 dark:text-stone-300 border-stone-500/40";
    }
  };

  const getNextTransitions = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return ["UNDER_REVIEW", "REJECTED"];
      case "UNDER_REVIEW":
        return ["VERIFIED", "REJECTED"];
      case "VERIFIED":
        return ["ASSIGNED"];
      case "ASSIGNED":
        return ["IN_PROGRESS"];
      case "IN_PROGRESS":
        return ["RESOLVED", "ASSIGNED"];
      case "REJECTED":
        return ["UNDER_REVIEW"];
      default:
        return [];
    }
  };

  const handleOpenTransition = (complaint: ComplaintItem, nextSt: string) => {
    setTransitionComplaint(complaint);
    setTargetStatus(nextSt);
    setTransitionNotes("");
    setRejectionReason("");
  };

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header and Submit Button with Milestone Stone */}
      <div className="dhaba-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <MilestoneHeader
            tag="GRIEVANCES"
            title={t("complaintsTitle")}
            subtitle={t("complaintsSubtitle")}
            variant="yellow"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-200 dark:border-stone-700 rounded-xl px-3 py-2 bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-200 font-bold focus:outline-none"
          >
            <option value="">All Redressal Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="VERIFIED">Verified</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl text-xs font-black transition shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Report Road Defect</span>
          </button>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-xs text-stone-400 py-12 font-mono">
            Loading public grievance records...
          </div>
        ) : complaints.length > 0 ? (
          complaints.map((c) => {
            const allowedNext = getNextTransitions(c.status);
            return (
              <div
                key={c.id}
                className="dhaba-card p-5 space-y-3 hover:border-amber-500/40 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 dark:border-stone-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-black uppercase border font-mono ${getStatusBadge(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                    <span className="font-mono text-xs text-stone-400">ID: #{c.id.slice(0, 8)}</span>
                    {c.defect_id && (
                      <span className="text-[11px] bg-amber-500/10 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono border border-amber-500/20">
                        Linked Defect: {c.defect_id.slice(0, 8)}&hellip;
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-stone-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1">
                    <span className="font-bold text-stone-700 dark:text-stone-200 block font-mono">
                      Grievance Description:
                    </span>
                    <p className="text-stone-600 dark:text-stone-300 font-medium leading-relaxed">
                      {c.description || "No description provided"}
                    </p>
                    {c.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 rounded text-xs font-medium">
                        Rejection Reason: {c.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 bg-stone-50 dark:bg-stone-900/60 p-3 rounded-xl border border-slate-200 dark:border-stone-800">
                    <span className="font-bold text-stone-700 dark:text-stone-200 block font-mono flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>GPS Coordinates:</span>
                    </span>
                    <div className="font-mono text-stone-600 dark:text-stone-300 text-xs">
                      {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
                    </div>
                  </div>
                </div>

                {/* Workflow Transitions (Admin / Engineer Role) */}
                {(activeRole === "engineer" || activeRole === "admin") && allowedNext.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-stone-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 font-mono">
                      Municipal Redressal Actions:
                    </span>
                    <div className="flex items-center gap-2">
                      {allowedNext.map((st) => (
                        <button
                          key={st}
                          onClick={() => handleOpenTransition(c, st)}
                          className="px-3 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-lg text-xs font-bold transition border border-stone-200 dark:border-stone-700"
                        >
                          Mark {st} &rarr;
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState
            title="Zero Pending Grievances"
            description="No road defect reports match your selection. Public highway feedback is current and fully resolved."
            actionLabel="Submit Road Issue"
            onAction={() => setReportModalOpen(true)}
          />
        )}
      </div>

      {/* Submit Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="dhaba-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-stone-800 pb-3">
              <h3 className="font-black text-base text-stone-900 dark:text-stone-100 font-signboard">
                Submit Public Road Grievance
              </h3>
              <button onClick={() => setReportModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Latitude:
                </label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Longitude:
                </label>
                <input
                  type="text"
                  value={lon}
                  onChange={(e) => setLon(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Distress Description &amp; Landmark:
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe crater depth, edge cracking, or nearest milestone..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <button
                onClick={() =>
                  createReportMutation.mutate({
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    description,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition shadow-md"
              >
                Lodge Grievance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition Modal */}
      {transitionComplaint && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="dhaba-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-stone-800 pb-3">
              <h3 className="font-black text-base text-stone-900 dark:text-stone-100 font-signboard">
                Update Grievance Status &rarr; {targetStatus}
              </h3>
              <button onClick={() => setTransitionComplaint(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Administrative Notes:
                </label>
                <textarea
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              {targetStatus === "REJECTED" && (
                <div>
                  <label className="font-bold text-red-600 block mb-1 font-mono">
                    Official Rejection Reason:
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Non-corridor distress, duplicate filing..."
                    className="w-full text-xs p-2.5 rounded-xl border border-red-500/40 bg-red-500/[0.04] text-stone-900 dark:text-stone-100 focus:outline-none font-medium"
                  />
                </div>
              )}

              <button
                onClick={() =>
                  transitionMutation.mutate({
                    id: transitionComplaint.id,
                    status: targetStatus,
                    notes: transitionNotes,
                    rejection: rejectionReason,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition shadow-md"
              >
                Confirm Status Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
