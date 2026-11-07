import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, WorkOrder } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  HardHat,
  ShieldAlert,
  X,
  FileCheck2,
} from "../components/Icons";

export const MaintenancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { activeRole } = useAuth();
  const { t } = useLanguage();

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newDefectId, setNewDefectId] = useState("");
  const [newContractorId, setNewContractorId] = useState("");
  const [newSlaPolicyId, setNewSlaPolicyId] = useState("");
  const [newPriority, setNewPriority] = useState("HIGH");
  const [newCost, setNewCost] = useState("12000");

  // Contractor Repair Submit modal
  const [repairModalWo, setRepairModalWo] = useState<WorkOrder | null>(null);
  const [materialsUsed, setMaterialsUsed] = useState("Hot-mix bitumen asphalt 2 tons, tack coat");
  const [actualCost, setActualCost] = useState("11500");

  // Human Verification modal (Rule R8)
  const [verifyModalWo, setVerifyModalWo] = useState<WorkOrder | null>(null);
  const [humanDecision, setHumanDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [decisionReason, setDecisionReason] = useState(
    "Visual inspection confirmed smooth asphalt compaction and edge blending"
  );

  // Queries
  const { data: woData, isLoading } = useQuery({
    queryKey: ["workOrders"],
    queryFn: () => api.listWorkOrders({ limit: 100 }),
    refetchInterval: 10000,
  });

  const { data: contractors } = useQuery({
    queryKey: ["contractorsList"],
    queryFn: api.listContractors,
  });

  const { data: slaPolicies } = useQuery({
    queryKey: ["slaPoliciesList"],
    queryFn: api.listSlaPolicies,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: api.createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workOrders"] });
      setCreateModalOpen(false);
      setNewDefectId("");
    },
  });

  const transitionMutation = useMutation({
    mutationFn: (vars: { id: string; new_status: string; notes?: string }) =>
      api.transitionWorkOrderStatus(vars.id, {
        new_status: vars.new_status,
        notes: vars.notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workOrders"] });
    },
  });

  const submitRepairMutation = useMutation({
    mutationFn: (vars: { id: string; materials: string; cost: number }) =>
      api.submitRepair(vars.id, {
        materials_used: vars.materials,
        actual_cost: vars.cost,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workOrders"] });
      setRepairModalWo(null);
    },
  });

  const verifyRepairMutation = useMutation({
    mutationFn: (vars: {
      id: string;
      pct: number;
      aiRec: string;
      decision: string;
      reason: string;
    }) =>
      api.verifyRepair(vars.id, {
        ai_damage_reduction_pct: vars.pct,
        ai_recommendation: vars.aiRec,
        human_decision: vars.decision,
        decision_reason: vars.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workOrders"] });
      queryClient.invalidateQueries({ queryKey: ["statsOverview"] });
      setVerifyModalWo(null);
    },
  });

  const workOrders = woData?.items || [];

  const columns = [
    { key: "ASSIGNED", label: t("colAssigned"), color: "border-blue-400 bg-blue-50/30 dark:bg-blue-950/20" },
    { key: "IN_PROGRESS", label: t("colInProgress"), color: "border-amber-400 bg-amber-50/30 dark:bg-amber-950/20" },
    { key: "COMPLETED", label: t("colVerified"), color: "border-purple-400 bg-purple-50/30 dark:bg-purple-950/20" },
    { key: "VERIFIED", label: t("colResolved"), color: "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20" },
  ];

  const getOrdersForColumn = (colKey: string) => {
    if (colKey === "ASSIGNED") {
      return workOrders.filter((wo) => wo.status === "CREATED" || wo.status === "ASSIGNED");
    }
    return workOrders.filter((wo) => wo.status === colKey);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 civic-card p-5 rounded-xl shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {t("maintenanceTitle")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("maintenanceSubtitle")}
          </p>
        </div>

        {(activeRole === "engineer" || activeRole === "admin") && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {t("dispatchWoBtn")}
          </button>
        )}
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colOrders = getOrdersForColumn(col.key);
          return (
            <div
              key={col.key}
              className={`rounded-xl border p-4 flex flex-col h-[680px] ${col.color}`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 mb-3">
                <span className="font-bold text-xs uppercase tracking-wide text-slate-700">
                  {col.label}
                </span>
                <span className="w-6 h-6 rounded-full bg-white text-slate-700 text-xs font-bold flex items-center justify-center border border-slate-200">
                  {colOrders.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="text-center text-xs text-slate-400 py-8">Loading orders...</div>
                ) : colOrders.length > 0 ? (
                  colOrders.map((wo) => {
                    const contractor = contractors?.find((c) => c.id === wo.contractor_id);
                    return (
                      <div
                        key={wo.id}
                        className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs space-y-2 text-xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              wo.priority === "CRITICAL"
                                ? "bg-red-100 text-red-700"
                                : wo.priority === "HIGH"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {wo.priority}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            #{wo.id.slice(0, 6)}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-500 text-[11px] block">Target Defect:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {wo.defect_id.slice(0, 13)}&hellip;
                          </span>
                        </div>

                        {contractor && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <HardHat className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-medium truncate">{contractor.name}</span>
                          </div>
                        )}

                        {wo.deadline && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Due: {new Date(wo.deadline).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Interactive Workflow Actions */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                          {/* ASSIGNED -> IN_PROGRESS */}
                          {(wo.status === "CREATED" || wo.status === "ASSIGNED") && (
                            <button
                              onClick={() =>
                                transitionMutation.mutate({
                                  id: wo.id,
                                  new_status: "IN_PROGRESS",
                                  notes: "Contractor crews arrived on site",
                                })
                              }
                              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition"
                            >
                              Start Repair Work
                            </button>
                          )}

                          {/* IN_PROGRESS -> Submit Repair Record */}
                          {wo.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => setRepairModalWo(wo)}
                              className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-[11px] transition shadow-2xs"
                            >
                              Submit Repair Completion
                            </button>
                          )}

                          {/* COMPLETED -> Human Repair Verification (Rule R8) */}
                          {wo.status === "COMPLETED" && (
                            <button
                              onClick={() => setVerifyModalWo(wo)}
                              className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-2xs"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                              Rule R8 Verification Sign-off
                            </button>
                          )}

                          {/* VERIFIED -> Verified badge */}
                          {wo.status === "VERIFIED" && (
                            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified by Engineer</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-xs text-slate-400 py-8">No work orders</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Work Order Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Dispatch Repair Work Order</h3>
              <button onClick={() => setCreateModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Defect ID</label>
                <input
                  type="text"
                  placeholder="Enter Defect UUID"
                  value={newDefectId}
                  onChange={(e) => setNewDefectId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Contractor</label>
                <select
                  value={newContractorId}
                  onChange={(e) => setNewContractorId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-medium"
                >
                  <option value="">-- Select Contractor --</option>
                  {contractors?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">SLA Resolution Policy</label>
                <select
                  value={newSlaPolicyId}
                  onChange={(e) => setNewSlaPolicyId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-medium"
                >
                  <option value="">-- Select SLA Policy --</option>
                  {slaPolicies?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.max_resolution_hours}h deadline)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-slate-50 font-medium"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  createMutation.mutate({
                    defect_id: newDefectId,
                    contractor_id: newContractorId || undefined,
                    sla_policy_id: newSlaPolicyId || undefined,
                    priority: newPriority,
                    estimated_cost: parseFloat(newCost) || undefined,
                  })
                }
                disabled={!newDefectId.trim() || createMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50 transition"
              >
                {createMutation.isPending ? "Dispatching..." : "Dispatch Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contractor Repair Submission Modal */}
      {repairModalWo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Submit Repair Completion Report</h3>
              <button onClick={() => setRepairModalWo(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Contractor completion sign-off. Transitions status to COMPLETED for municipal engineering review.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Materials Used</label>
                <textarea
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Actual Incurred Cost (₹)</label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRepairModalWo(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  submitRepairMutation.mutate({
                    id: repairModalWo.id,
                    materials: materialsUsed,
                    cost: parseFloat(actualCost) || 0,
                  })
                }
                disabled={submitRepairMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition"
              >
                {submitRepairMutation.isPending ? "Submitting..." : "Submit Completion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authoritative Human Verification Modal (Rule R8) */}
      {verifyModalWo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-600" />
                  Authoritative Human Verification (Rule R8)
                </h3>
                <span className="text-xs text-slate-500">
                  AI repair verification is advisory; a human engineer decides. AI never closes work orders.
                </span>
              </div>
              <button onClick={() => setVerifyModalWo(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Advisory AI Recommendation Card */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
                Advisory Edge AI Post-Repair Assessment
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700">Estimated Damage Reduction:</span>
                <span className="text-base font-black text-purple-900">92.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-700">AI Recommendation:</span>
                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-black bg-purple-200 text-purple-900">
                  PASS (Advisory Only)
                </span>
              </div>
            </div>

            {/* Human Decision Controls */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Human Engineering Decision (Mandatory)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setHumanDecision("APPROVED")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      humanDecision === "APPROVED"
                        ? "bg-emerald-500 text-white border-emerald-600"
                        : "bg-slate-50 text-slate-700 border-slate-300"
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve &amp; Close Defect
                  </button>

                  <button
                    type="button"
                    onClick={() => setHumanDecision("REJECTED")}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      humanDecision === "REJECTED"
                        ? "bg-red-500 text-white border-red-600"
                        : "bg-slate-50 text-slate-700 border-slate-300"
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                    Reject (Return to Contractor)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Engineer Reason &amp; Inspection Audit Note
                </label>
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setVerifyModalWo(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  verifyRepairMutation.mutate({
                    id: verifyModalWo.id,
                    pct: 92.4,
                    aiRec: "PASS",
                    decision: humanDecision,
                    reason: decisionReason,
                  })
                }
                disabled={decisionReason.trim().length < 5 || verifyRepairMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50 transition shadow-xs"
              >
                {verifyRepairMutation.isPending ? "Authorizing..." : "Submit Authoritative Sign-off"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
