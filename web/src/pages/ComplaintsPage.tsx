import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ComplaintItem } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  MessageSquareWarning,
  Plus,
  Send,
  MapPin,
  Clock,
  ArrowRight,
  X,
} from "../components/Icons";

export const ComplaintsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();

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
      setTransitionNotes("");
      setRejectionReason("");
    },
  });

  const complaints = data?.items || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "UNDER_REVIEW":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "VERIFIED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "ASSIGNED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "IN_PROGRESS":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "REJECTED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getNextTransitions = (status: string): string[] => {
    switch (status) {
      case "SUBMITTED":
        return ["UNDER_REVIEW", "REJECTED"];
      case "UNDER_REVIEW":
        return ["VERIFIED", "REJECTED"];
      case "VERIFIED":
        return ["ASSIGNED", "REJECTED"];
      case "ASSIGNED":
        return ["IN_PROGRESS", "VERIFIED"];
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
    <div className="space-y-6 pb-16">
      {/* Header and Submit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 civic-card p-5 rounded-xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Citizen Grievance Redressal &amp; Damage Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Citizen damage submissions governed by strict municipal state machine transitions (Rule B7).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="">All Complaint Statuses</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>

          <button
            onClick={() => setReportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Submit Citizen Report
          </button>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center text-xs text-slate-400 py-12">Loading complaints...</div>
        ) : complaints.length > 0 ? (
          complaints.map((c) => {
            const allowedNext = getNextTransitions(c.status);
            return (
              <div
                key={c.id}
                className="civic-card rounded-xl p-5 shadow-xs hover:border-emerald-500/30 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${getStatusBadge(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                    <span className="font-mono text-xs text-slate-400">ID: #{c.id.slice(0, 8)}</span>
                    {c.defect_id && (
                      <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                        Linked Defect: {c.defect_id.slice(0, 8)}&hellip;
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block">Report Description:</span>
                    <p className="text-slate-600 dark:text-slate-300 font-medium">
                      {c.description || "No written description provided by citizen."}
                    </p>
                    {c.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 rounded text-xs font-medium">
                        Rejection Reason: {c.rejection_reason}
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-100 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      GPS Coordinate
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px] block">
                      {c.latitude.toFixed(5)}, {c.longitude.toFixed(5)}
                    </span>
                  </div>
                </div>

                {/* State Machine Transition Actions for Engineers / Admins */}
                {(activeRole === "engineer" || activeRole === "admin") && allowedNext.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Engineer State Transitions:
                    </span>
                    <div className="flex items-center gap-2">
                      {allowedNext.map((st) => (
                        <button
                          key={st}
                          onClick={() => handleOpenTransition(c, st)}
                          className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                            st === "REJECTED"
                              ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          <span>Move to {st}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center text-xs text-slate-400 py-12 bg-white rounded-xl border border-slate-200">
            No citizen reports found matching current filters
          </div>
        )}
      </div>

      {/* Submit Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Submit Citizen Road Damage Report</h3>
              <button onClick={() => setReportModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Citizens can report hazardous potholes or road damage with location coordinates.
            </p>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="text"
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Damage Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe location, size, and road hazard condition..."
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  createReportMutation.mutate({
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    description: description || undefined,
                  })
                }
                disabled={createReportMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {createReportMutation.isPending ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State Machine Transition Modal */}
      {transitionComplaint && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">
                Transition Complaint &rarr; {targetStatus}
              </h3>
              <button onClick={() => setTransitionComplaint(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Executing state machine transition from {transitionComplaint.status} to {targetStatus}.
            </p>

            <div className="space-y-3 text-xs">
              {targetStatus === "REJECTED" ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Rejection Reason (Mandatory)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Inaccurate photo, not a road defect, or duplicate submission"
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Engineering Audit Notes
                  </label>
                  <textarea
                    value={transitionNotes}
                    onChange={(e) => setTransitionNotes(e.target.value)}
                    placeholder="Notes on inspection findings or contractor assignment..."
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTransitionComplaint(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  transitionMutation.mutate({
                    id: transitionComplaint.id,
                    status: targetStatus,
                    notes: transitionNotes || undefined,
                    rejection: rejectionReason || undefined,
                  })
                }
                disabled={
                  (targetStatus === "REJECTED" && rejectionReason.trim().length < 3) ||
                  transitionMutation.isPending
                }
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition"
              >
                {transitionMutation.isPending ? "Transitioning..." : "Confirm Transition"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
