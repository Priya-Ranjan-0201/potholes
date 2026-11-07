import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, WorkOrder } from "../api/client";
import { useLanguage } from "../context/LanguageContext";
import {
  Plus,
  Clock,
  CheckCircle,
  HardHat,
  X,
  FileCheck2,
  Sparkles,
} from "../components/Icons";
import { MilestoneHeader, CatsEye, PetalBurst, PatternBand } from "../ui";

export const MaintenancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // Create modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newDefectId, setNewDefectId] = useState("");
  const [newContractorId, setNewContractorId] = useState("");
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
  const [showCelebration, setShowCelebration] = useState(false);

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
      // Trigger momentary marigold celebration burst on human engineer sign-off (Rule 5)
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2500);
    },
  });

  const workOrders = woData?.items || [];

  const columns = [
    { key: "ASSIGNED", label: "Assigned", color: "border-blue-500/40 bg-blue-500/[0.04]", catseye: "peacock" as const },
    { key: "IN_PROGRESS", label: "In Repair", color: "border-amber-500/40 bg-amber-500/[0.04]", catseye: "amber" as const },
    { key: "COMPLETED", label: "Pending Audit", color: "border-purple-500/40 bg-purple-500/[0.04]", catseye: "amber" as const },
    { key: "VERIFIED", label: "Verified Closure", color: "border-emerald-500/40 bg-emerald-500/[0.04]", catseye: "peacock" as const },
  ];

  const getOrdersForColumn = (colKey: string) => {
    if (colKey === "ASSIGNED") {
      return workOrders.filter((wo) => wo.status === "CREATED" || wo.status === "ASSIGNED");
    }
    return workOrders.filter((wo) => wo.status === colKey);
  };

  return (
    <div className="space-y-6 pb-16 w-full relative">
      {/* Authentic Marigold Petal & Gulal Burst (Rule U5 & Section 5) */}
      <PetalBurst active={showCelebration} onComplete={() => setShowCelebration(false)} />

      {/* Celebration Marigold Confetti Overlay when Human Engineer Signs Off */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
          <div className="p-6 rounded-2xl bg-[#0A0C12]/95 border-2 border-amber-400 text-white shadow-2xl flex items-center gap-3 animate-bounce">
            <Sparkles className="w-8 h-8 text-amber-400" />
            <div>
              <h4 className="font-black text-base text-amber-400 font-signboard">
                Work Order Verified &amp; Closed!
              </h4>
              <p className="text-xs text-stone-300 font-mono">
                Field compaction confirmed by human municipal engineer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Regional Pattern Band */}
      <PatternBand regional height={6} opacity={0.4} />

      {/* Header with Milestone Stone and Create Dispatch Button */}
      <div className="dhaba-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <MilestoneHeader
            tag="WORK ORDERS"
            title={t("maintenanceTitle")}
            subtitle={t("maintenanceSubtitle")}
            variant="yellow"
          />
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-xl text-xs font-black transition shadow-md shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t("dispatchWoBtn")}</span>
        </button>
      </div>

      {/* Kanban Board Columns styled as Highway Lanes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colOrders = getOrdersForColumn(col.key);
          return (
            <div
              key={col.key}
              className={`rounded-2xl border-2 p-4 flex flex-col min-h-[380px] max-h-[720px] ${col.color} dhaba-card shadow-xs`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#EBD9B8] dark:border-stone-800 mb-3">
                <div className="flex items-center gap-1.5">
                  <CatsEye color={col.catseye} size="sm" />
                  <span className="font-black text-xs uppercase tracking-wide text-stone-800 dark:text-stone-200 font-mono">
                    {col.label}
                  </span>
                </div>
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-black flex items-center justify-center border border-amber-500/40 font-mono">
                  {colOrders.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {isLoading ? (
                  <div className="text-center text-xs text-stone-400 py-8 font-mono">
                    Loading highway lane orders...
                  </div>
                ) : colOrders.length > 0 ? (
                  colOrders.map((wo) => {
                    const contractor = contractors?.find((c) => c.id === wo.contractor_id);
                    return (
                      <div
                        key={wo.id}
                        className="bg-white dark:bg-stone-900 rounded-xl p-3.5 border-2 border-[#EBD9B8] dark:border-stone-800 shadow-xs space-y-2 text-xs hover:border-amber-500/50 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                              wo.priority === "CRITICAL"
                                ? "bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/40"
                                : wo.priority === "HIGH"
                                ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40"
                                : "bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-500/40"
                            }`}
                          >
                            {wo.priority}
                          </span>
                          <span className="font-mono text-[10px] text-stone-400">
                            #{wo.id.slice(0, 6)}
                          </span>
                        </div>

                        <div>
                          <span className="text-stone-500 dark:text-stone-400 text-[11px] block font-mono">
                            Target Defect:
                          </span>
                          <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                            {wo.defect_id.slice(0, 13)}&hellip;
                          </span>
                        </div>

                        {contractor && (
                          <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                            <HardHat className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-semibold truncate">{contractor.name}</span>
                          </div>
                        )}

                        {wo.deadline && (
                          <div className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400 text-[11px] font-mono">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Due: {new Date(wo.deadline).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Actions based on state */}
                        <div className="pt-2 border-t border-[#EBD9B8] dark:border-stone-800 flex items-center justify-between gap-1">
                          {col.key === "ASSIGNED" && (
                            <button
                              onClick={() =>
                                transitionMutation.mutate({
                                  id: wo.id,
                                  new_status: "IN_PROGRESS",
                                  notes: "Contractor mobilized crew to road segment",
                                })
                              }
                              className="w-full py-1.5 bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold rounded-lg hover:bg-amber-500/25 transition text-center"
                            >
                              Mobilize Crew &rarr;
                            </button>
                          )}

                          {col.key === "IN_PROGRESS" && (
                            <button
                              onClick={() => setRepairModalWo(wo)}
                              className="w-full py-1.5 bg-purple-500/15 text-purple-800 dark:text-purple-300 font-bold rounded-lg hover:bg-purple-500/25 transition text-center"
                            >
                              Log Patch Materials &rarr;
                            </button>
                          )}

                          {col.key === "COMPLETED" && (
                            <button
                              onClick={() => setVerifyModalWo(wo)}
                              className="w-full py-1.5 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition text-center shadow-xs"
                            >
                              Engineer Sign-Off &rarr;
                            </button>
                          )}

                          {col.key === "VERIFIED" && (
                            <span className="w-full py-1 text-center font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Closed &amp; Verified</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center py-12 text-center text-stone-400 dark:text-stone-500">
                    <CheckCircle className="w-6 h-6 opacity-30 mb-2" />
                    <span className="text-xs font-semibold">No active orders</span>
                    <span className="text-[11px] opacity-70">Lane clear</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Human Engineer Verification Modal (Rule R5 & R8) */}
      {verifyModalWo && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="dhaba-card max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EBD9B8] dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-stone-900 dark:text-stone-100 font-signboard">
                  Human Municipal Engineer Sign-Off
                </h3>
              </div>
              <button onClick={() => setVerifyModalWo(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              In accordance with municipal guidelines (Rule R5), an authorized human engineer must visually inspect the patched asphalt before signing off closure. The AI provides diagnostic assistance only.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Engineer Decision:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHumanDecision("APPROVED")}
                    className={`py-2 rounded-xl font-black text-xs transition border ${
                      humanDecision === "APPROVED"
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-md"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700"
                    }`}
                  >
                    Approve &amp; Close Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setHumanDecision("REJECTED")}
                    className={`py-2 rounded-xl font-black text-xs transition border ${
                      humanDecision === "REJECTED"
                        ? "bg-red-500 text-white border-red-600 shadow-md"
                        : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700"
                    }`}
                  >
                    Reject (Requires Recasting)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Field Inspection Notes:
                </label>
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EBD9B8] dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <button
                onClick={() =>
                  verifyRepairMutation.mutate({
                    id: verifyModalWo.id,
                    pct: 92.5,
                    aiRec: "VERIFY_REPAIR",
                    decision: humanDecision,
                    reason: decisionReason,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition shadow-md"
              >
                Sign &amp; Seal Verification Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Patch Materials Modal */}
      {repairModalWo && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="dhaba-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EBD9B8] dark:border-stone-800 pb-3">
              <h3 className="font-black text-base text-stone-900 dark:text-stone-100 font-signboard">
                Log Contractor Patch Materials
              </h3>
              <button onClick={() => setRepairModalWo(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Materials Used:
                </label>
                <input
                  type="text"
                  value={materialsUsed}
                  onChange={(e) => setMaterialsUsed(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EBD9B8] dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Actual Cost (₹):
                </label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EBD9B8] dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none font-mono"
                />
              </div>

              <button
                onClick={() =>
                  submitRepairMutation.mutate({
                    id: repairModalWo.id,
                    materials: materialsUsed,
                    cost: parseFloat(actualCost) || 0,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition shadow-md"
              >
                Submit for Municipal Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Work Order Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="dhaba-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#EBD9B8] dark:border-stone-800 pb-3">
              <h3 className="font-black text-base text-stone-900 dark:text-stone-100 font-signboard">
                Dispatch New Road Work Order
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Defect ID:
                </label>
                <input
                  type="text"
                  placeholder="Enter or paste Defect UUID..."
                  value={newDefectId}
                  onChange={(e) => setNewDefectId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EBD9B8] dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Contractor:
                </label>
                <select
                  value={newContractorId}
                  onChange={(e) => setNewContractorId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EBD9B8] dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
                >
                  <option value="">Select Contractor...</option>
                  {contractors?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Priority:
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EBD9B8] dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none font-mono"
                >
                  <option value="CRITICAL">Critical (24-Hr Compaction)</option>
                  <option value="HIGH">High (48-Hr SLA)</option>
                  <option value="MEDIUM">Medium (72-Hr SLA)</option>
                  <option value="LOW">Low (7-Day Routine)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 dark:text-stone-300 block mb-1 font-mono">
                  Estimated Cost (₹):
                </label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#EBD9B8] dark:border-stone-700 bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none font-mono"
                />
              </div>

              <button
                onClick={() =>
                  createMutation.mutate({
                    defect_id: newDefectId,
                    contractor_id: newContractorId || undefined,
                    priority: newPriority,
                    estimated_cost: parseFloat(newCost) || 12000,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition shadow-md"
              >
                Dispatch to Contractor Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
