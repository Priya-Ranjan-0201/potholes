import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, WorkOrder } from "../api/client";
import {
  Plus,
  Clock,
  CheckCircle,
  X,
  FileCheck2,
  Search,
  MessageSquareWarning,
} from "../components/Icons";
import {
  SeverityBadge,
  StatusChip,
  SegmentedControl,
  DemoBadge,
} from "../ui";
import { useToast } from "../context/ToastContext";

type SubTab = "work-orders" | "defects" | "reports";
type ViewMode = "table" | "kanban";

export const MaintenancePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, info } = useToast();

  // Tab & View States
  const [subTab, setSubTab] = useState<SubTab>("work-orders");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modals & Drawers
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createComplaintModalOpen, setCreateComplaintModalOpen] = useState(false);
  const [newDefectId, setNewDefectId] = useState("");
  const [newContractorId, setNewContractorId] = useState("");
  const [newPriority] = useState("HIGH");
  const [newCost, setNewCost] = useState("15000");

  // Citizen Complaint Modal State
  const [newComplaintDesc, setNewComplaintDesc] = useState("");
  const [newComplaintLat, setNewComplaintLat] = useState("30.9010");
  const [newComplaintLng, setNewComplaintLng] = useState("75.8573");

  // Engineer Sign-Off Modal
  const [verifyModalWo, setVerifyModalWo] = useState<WorkOrder | null>(null);
  const [humanDecision, setHumanDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [decisionReason, setDecisionReason] = useState(
    "Visual verification confirmed smooth compaction and compliant edge sealing."
  );

  // Engineer Severity Override State
  const [overrideLevel, setOverrideLevel] = useState<string>("Moderate");
  const [overrideReason, setOverrideReason] = useState<string>("");

  // Queries
  const { data: woData, isLoading: loadingWo } = useQuery({
    queryKey: ["workOrdersList"],
    queryFn: () => api.listWorkOrders({ limit: 100 }),
    refetchInterval: 12000,
  });

  const { data: defectsData } = useQuery({
    queryKey: ["defectsList"],
    queryFn: () => api.listDefects({ limit: 100 }),
    refetchInterval: 12000,
  });

  const { data: complaintsData } = useQuery({
    queryKey: ["complaintsList"],
    queryFn: () => api.listComplaints(),
    refetchInterval: 12000,
  });

  const { data: contractors } = useQuery({
    queryKey: ["contractorsList"],
    queryFn: api.listContractors,
  });

  const { data: defectDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["defectDetail", selectedDefectId],
    queryFn: () => (selectedDefectId ? api.getDefect(selectedDefectId) : null),
    enabled: Boolean(selectedDefectId),
  });

  const workOrders = woData?.items || [];
  const defects = defectsData?.items || [];
  const complaints = complaintsData?.items || [];

  // Deep-linking URL Query Params Sync
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "defects" || tabParam === "reports" || tabParam === "work-orders") {
      setSubTab(tabParam as SubTab);
    }
    const idParam = searchParams.get("id");
    if (idParam && workOrders.length > 0) {
      const foundWo = workOrders.find((w) => w.id === idParam || w.id.startsWith(idParam));
      if (foundWo) {
        setSelectedDefectId(foundWo.defect_id);
      }
    }
    const defectIdParam = searchParams.get("defectId");
    if (defectIdParam) {
      setSelectedDefectId(defectIdParam);
    }
    const wardParam = searchParams.get("ward");
    if (wardParam) {
      setSearchQuery(wardParam);
    }
  }, [searchParams, workOrders]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: api.createWorkOrder,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["workOrdersList"] });
      queryClient.invalidateQueries({ queryKey: ["statsOverview"] });
      setCreateModalOpen(false);
      setNewDefectId("");
      success("Work Order Dispatched", `Order #${res.id.slice(0, 8)} created and dispatched to contractor.`);
    },
  });

  const transitionMutation = useMutation({
    mutationFn: (vars: { id: string; new_status: string; notes?: string }) =>
      api.transitionWorkOrderStatus(vars.id, {
        new_status: vars.new_status,
        notes: vars.notes,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["workOrdersList"] });
      queryClient.invalidateQueries({ queryKey: ["statsOverview"] });
      info("Status Updated", `Work order #${vars.id.slice(0, 8)} shifted to ${vars.new_status}.`);
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
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["workOrdersList"] });
      queryClient.invalidateQueries({ queryKey: ["statsOverview"] });
      setVerifyModalWo(null);
      success("Authoritative Sign-Off Recorded", `Order #${vars.id.slice(0, 8)} signed off as ${vars.decision}.`);
    },
  });

  const overrideSeverityMutation = useMutation({
    mutationFn: (vars: { id: string; level: string; reason: string }) =>
      api.overrideSeverity(vars.id, {
        override_level: vars.level,
        reason: vars.reason,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["defectDetail", selectedDefectId] });
      queryClient.invalidateQueries({ queryKey: ["defectsList"] });
      queryClient.invalidateQueries({ queryKey: ["statsOverview"] });
      setOverrideReason("");
      success("Severity Overridden", `Defect #${vars.id.slice(0, 8)} reassessed as ${vars.level}.`);
    },
  });

  const createComplaintMutation = useMutation({
    mutationFn: api.createComplaint,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["complaintsList"] });
      setCreateComplaintModalOpen(false);
      setNewComplaintDesc("");
      success("Citizen Report Registered", `Public grievance #${res.id.slice(0, 8)} logged to municipal intake.`);
    },
  });

  // Filter Work Orders
  const filteredWorkOrders = workOrders.filter((wo) => {
    if (statusFilter !== "ALL" && wo.status !== statusFilter) return false;
    if (severityFilter !== "ALL" && wo.priority.toUpperCase() !== severityFilter.toUpperCase())
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = wo.id.toLowerCase().includes(q);
      const matchDef = wo.defect_id.toLowerCase().includes(q);
      return matchId || matchDef;
    }
    return true;
  });

  // Filter Defects
  const filteredDefects = defects.filter((def) => {
    if (statusFilter !== "ALL" && def.status !== statusFilter) return false;
    const sev = (def.latest_severity_level || def.severity_level || "Minor").toUpperCase();
    if (severityFilter !== "ALL" && sev !== severityFilter.toUpperCase())
      return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        def.id.toLowerCase().includes(q) ||
        def.class_code.toLowerCase().includes(q) ||
        (def.road_segment_id && def.road_segment_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filter Complaints
  const filteredComplaints = complaints.filter((cmp) => {
    if (statusFilter !== "ALL" && cmp.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        cmp.id.toLowerCase().includes(q) ||
        (cmp.description && cmp.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const kanbanColumns = [
    { key: "CREATED", label: "Created" },
    { key: "ASSIGNED", label: "Assigned" },
    { key: "IN_PROGRESS", label: "In Repair" },
    { key: "COMPLETED", label: "Pending Audit" },
    { key: "VERIFIED", label: "Verified" },
  ];

  const linkedOrderForSelectedDefect = workOrders.find((w) => w.defect_id === selectedDefectId);

  return (
    <div className="space-y-6">
      {/* 1. Page Header with Sub-tabs & Create Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Maintenance Management
            </h1>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Contractor dispatches, defect registry, and authoritative human engineer sign-offs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl<SubTab>
            value={subTab}
            onChange={(tab) => {
              setSubTab(tab);
              setSearchParams({ tab });
            }}
            options={[
              { id: "work-orders", label: "Work Orders", count: workOrders.length },
              { id: "defects", label: "Defects", count: defects.length },
              { id: "reports", label: "Citizen Reports", count: complaints.length },
            ]}
          />

          {subTab === "reports" ? (
            <button
              onClick={() => setCreateComplaintModalOpen(true)}
              className="btn-primary text-xs inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Hazard</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setNewDefectId(defects[0]?.id || "");
                setCreateModalOpen(true);
              }}
              className="btn-primary text-xs inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Order</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter Bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by ID, corridor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs w-48 sm:w-60 focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-1.5 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium"
          >
            <option value="ALL">All Statuses</option>
            {subTab === "reports" ? (
              <>
                <option value="SUBMITTED">Submitted</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </>
            ) : (
              <>
                <option value="CREATED">Created</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="VERIFIED">Verified</option>
              </>
            )}
          </select>

          {/* Severity Filter */}
          {subTab !== "reports" && (
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="py-1.5 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="SEVERE">Severe</option>
              <option value="MODERATE">Moderate</option>
              <option value="MINOR">Minor</option>
            </select>
          )}
        </div>

        {/* View Mode Toggle (Work Orders Only) */}
        {subTab === "work-orders" && (
          <SegmentedControl<ViewMode>
            size="sm"
            value={viewMode}
            onChange={(v) => setViewMode(v)}
            options={[
              { id: "kanban", label: "Kanban" },
              { id: "table", label: "Table" },
            ]}
          />
        )}
      </div>

      {/* 3. Sub-Tab Content: Work Orders */}
      {subTab === "work-orders" && (
        <>
          {viewMode === "kanban" ? (
            /* Kanban Board View */
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {kanbanColumns.map((col) => {
                const colOrders = filteredWorkOrders.filter((wo) => wo.status === col.key);
                return (
                  <div
                    key={col.key}
                    className="card p-3 flex flex-col min-h-[460px] bg-slate-50/50 dark:bg-slate-900/30"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800">
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                        {col.label}
                      </span>
                      <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                        {colOrders.length}
                      </span>
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto">
                      {loadingWo ? (
                        <div className="text-center text-xs text-slate-400 py-8 font-mono">
                          Loading orders...
                        </div>
                      ) : colOrders.length > 0 ? (
                        colOrders.map((wo) => {
                          const contractor = contractors?.find((c) => c.id === wo.contractor_id);
                          const deadlineDate = wo.deadline ? new Date(wo.deadline) : null;
                          const isOverdue =
                            deadlineDate &&
                            deadlineDate < new Date() &&
                            wo.status !== "VERIFIED" &&
                            wo.status !== "COMPLETED";

                          return (
                            <div
                              key={wo.id}
                              className="card p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-2xs space-y-2"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  onClick={() => setSelectedDefectId(wo.defect_id)}
                                  className="font-mono font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                  title="Inspect defect details"
                                >
                                  #{wo.id.slice(0, 8)}
                                </span>
                                <SeverityBadge level={wo.priority} size="sm" showScore={false} />
                              </div>

                              <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                                <div className="truncate">
                                  <span>Contractor: </span>
                                  <strong className="text-slate-700 dark:text-slate-300">
                                    {contractor ? contractor.name : "Unassigned"}
                                  </strong>
                                </div>
                                {deadlineDate && (
                                  <div
                                    className={`flex items-center gap-1 font-mono ${
                                      isOverdue
                                        ? "text-rose-600 dark:text-rose-400 font-medium"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {deadlineDate.toLocaleDateString([], {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                    {isOverdue && <span>(Overdue)</span>}
                                  </div>
                                )}
                              </div>

                              {/* Card Action Controls */}
                              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                                {wo.status === "CREATED" && (
                                  <button
                                    onClick={() =>
                                      transitionMutation.mutate({
                                        id: wo.id,
                                        new_status: "ASSIGNED",
                                      })
                                    }
                                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                  >
                                    Assign &rarr;
                                  </button>
                                )}
                                {wo.status === "ASSIGNED" && (
                                  <button
                                    onClick={() =>
                                      transitionMutation.mutate({
                                        id: wo.id,
                                        new_status: "IN_PROGRESS",
                                      })
                                    }
                                    className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
                                  >
                                    Start Repair &rarr;
                                  </button>
                                )}
                                {wo.status === "IN_PROGRESS" && (
                                  <button
                                    onClick={() =>
                                      transitionMutation.mutate({
                                        id: wo.id,
                                        new_status: "COMPLETED",
                                      })
                                    }
                                    className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                                  >
                                    Submit Closure &rarr;
                                  </button>
                                )}
                                {wo.status === "COMPLETED" && (
                                  <button
                                    onClick={() => setVerifyModalWo(wo)}
                                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
                                  >
                                    Sign-Off &rarr;
                                  </button>
                                )}
                                {wo.status === "VERIFIED" && (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Approved</span>
                                  </span>
                                )}

                                <button
                                  onClick={() => setSelectedDefectId(wo.defect_id)}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-400 font-mono">
                          No orders
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="card overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Defect ID</th>
                    <th>Priority</th>
                    <th>Contractor</th>
                    <th>Cost Est.</th>
                    <th>Deadline</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkOrders.map((wo) => {
                    const contractor = contractors?.find((c) => c.id === wo.contractor_id);
                    const deadlineDate = wo.deadline ? new Date(wo.deadline) : null;
                    const isOverdue =
                      deadlineDate &&
                      deadlineDate < new Date() &&
                      wo.status !== "VERIFIED" &&
                      wo.status !== "COMPLETED";

                    return (
                      <tr key={wo.id}>
                        <td className="font-mono text-xs font-semibold">
                          <button
                            onClick={() => setSelectedDefectId(wo.defect_id)}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            #{wo.id.slice(0, 8)}
                          </button>
                        </td>
                        <td className="font-mono text-xs text-slate-500">
                          #{wo.defect_id.slice(0, 8)}
                        </td>
                        <td>
                          <SeverityBadge level={wo.priority} size="sm" showScore={false} />
                        </td>
                        <td className="text-slate-700 dark:text-slate-300">
                          {contractor ? contractor.name : "—"}
                        </td>
                        <td className="font-mono text-slate-700 dark:text-slate-300">
                          {wo.estimated_cost ? `₹${wo.estimated_cost.toLocaleString()}` : "—"}
                        </td>
                        <td className="font-mono text-xs">
                          {deadlineDate ? (
                            <span className={isOverdue ? "text-rose-600 font-semibold" : "text-slate-500"}>
                              {deadlineDate.toLocaleDateString([], { month: "short", day: "numeric" })}
                              {isOverdue && " (Overdue)"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <StatusChip status={wo.status} />
                        </td>
                        <td className="text-right">
                          {wo.status === "COMPLETED" ? (
                            <button
                              onClick={() => setVerifyModalWo(wo)}
                              className="btn-primary text-xs"
                            >
                              Sign-Off
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedDefectId(wo.defect_id)}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Inspect
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* 4. Sub-Tab Content: Defects Registry */}
      {subTab === "defects" && (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Defect ID</th>
                <th>Class Code</th>
                <th>Severity</th>
                <th>First Sighted</th>
                <th>Sightings</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDefects.map((def) => {
                const firstSeen = new Date(def.first_seen);
                return (
                  <tr key={def.id}>
                    <td className="font-mono text-xs font-semibold">
                      <button
                        onClick={() => setSelectedDefectId(def.id)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        #{def.id.slice(0, 8)}
                      </button>
                    </td>
                    <td className="font-medium text-slate-900 dark:text-slate-100">
                      {def.class_code}
                    </td>
                    <td>
                      <SeverityBadge
                        level={def.latest_severity_level || def.severity_level || "Minor"}
                        score={def.latest_severity_score ?? def.normalized_score ?? undefined}
                        size="sm"
                      />
                    </td>
                    <td className="font-mono text-xs text-slate-500">
                      {firstSeen.toLocaleDateString([], { month: "short", day: "numeric" })}
                    </td>
                    <td className="font-mono text-slate-700 dark:text-slate-300">
                      {def.times_seen}×
                    </td>
                    <td>
                      <StatusChip status={def.status} />
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => setSelectedDefectId(def.id)}
                        className="btn-secondary text-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Sub-Tab Content: Citizen Reports */}
      {subTab === "reports" && (
        <div className="card overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Date</th>
                <th>Description</th>
                <th>Linked Defect</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length > 0 ? (
                filteredComplaints.map((cmp) => {
                  const createdDate = new Date(cmp.created_at);
                  return (
                    <tr key={cmp.id}>
                      <td className="font-mono text-xs font-semibold">
                        #{cmp.id.slice(0, 8)}
                      </td>
                      <td className="font-mono text-xs text-slate-500">
                        {createdDate.toLocaleDateString([], { month: "short", day: "numeric" })}
                      </td>
                      <td className="text-slate-700 dark:text-slate-300 max-w-sm truncate">
                        {cmp.description || "Public surface hazard reported"}
                      </td>
                      <td className="font-mono text-xs">
                        {cmp.defect_id ? (
                          <button
                            onClick={() => setSelectedDefectId(cmp.defect_id)}
                            className="text-blue-600 hover:underline"
                          >
                            #{cmp.defect_id.slice(0, 8)}
                          </button>
                        ) : (
                          <span className="text-slate-400">Unlinked</span>
                        )}
                      </td>
                      <td>
                        <StatusChip status={cmp.status} />
                      </td>
                      <td className="text-right">
                        {cmp.status === "SUBMITTED" && (
                          <button
                            onClick={() =>
                              api
                                .transitionComplaintStatus(cmp.id, {
                                  new_status: "UNDER_REVIEW",
                                })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ["complaintsList"] });
                                  info("Complaint Under Review", `Grievance #${cmp.id.slice(0, 8)} moved to active review.`);
                                })
                            }
                            className="btn-secondary text-xs"
                          >
                            Acknowledge
                          </button>
                        )}
                        {cmp.status === "UNDER_REVIEW" && (
                          <button
                            onClick={() =>
                              api
                                .transitionComplaintStatus(cmp.id, {
                                  new_status: "VERIFIED",
                                })
                                .then(() => {
                                  queryClient.invalidateQueries({ queryKey: ["complaintsList"] });
                                  info("Complaint Verified", `Grievance #${cmp.id.slice(0, 8)} verified by field engineer.`);
                                })
                            }
                            className="btn-primary text-xs"
                          >
                            Verify &rarr;
                          </button>
                        )}
                        {cmp.status === "VERIFIED" && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    No citizen complaints logged. Click &quot;Report Hazard&quot; above to submit an observation.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 6. Defect Inspection Slide Drawer (Modal/Drawer) */}
      {selectedDefectId && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end"
          onClick={() => setSelectedDefectId(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 font-mono uppercase block">
                  Defect Inspection Drawer
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  #{selectedDefectId.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDefectId(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 text-center text-xs text-slate-400 font-mono">
                Loading defect metadata...
              </div>
            ) : defectDetail ? (
              <div className="space-y-4 text-xs">
                {/* Visual Photographic Evidence */}
                <div className="space-y-1.5">
                  <span className="text-slate-500 font-medium">Photographic Evidence</span>
                  <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 aspect-video relative flex items-center justify-center">
                    <img
                      src={`/api/v1/media/${selectedDefectId}.jpg`}
                      onError={(e) => {
                        e.currentTarget.src = "/samples/asphalt_crater.jpg";
                      }}
                      alt={`Defect ${selectedDefectId}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white font-mono text-[10px] backdrop-blur-xs">
                      {defectDetail.latitude?.toFixed(4)}°N, {defectDetail.longitude?.toFixed(4)}°E
                    </div>
                  </div>
                </div>

                {/* Defect Metadata Card */}
                <div className="card p-3 space-y-2 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Distress Classification:</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-mono">
                      {defectDetail.class_code}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Severity Assessment:</span>
                    <SeverityBadge
                      level={defectDetail.severity_history?.[0]?.level || "Minor"}
                      score={defectDetail.severity_history?.[0]?.normalized_score}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Coordinates:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {defectDetail.latitude?.toFixed(4)}, {defectDetail.longitude?.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Sightings Count:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {defectDetail.times_seen} camera passes
                    </span>
                  </div>
                </div>

                {/* Associated Work Order Status */}
                <div className="card p-3 space-y-2 bg-slate-50 dark:bg-slate-800/20">
                  <span className="text-slate-500 font-medium block">Associated Work Order</span>
                  {linkedOrderForSelectedDefect ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          #{linkedOrderForSelectedDefect.id.slice(0, 8)}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Priority: {linkedOrderForSelectedDefect.priority}
                        </span>
                      </div>
                      <StatusChip status={linkedOrderForSelectedDefect.status} />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">No active work order dispatched.</span>
                      <button
                        onClick={() => {
                          setNewDefectId(selectedDefectId);
                          setCreateModalOpen(true);
                        }}
                        className="btn-primary text-[11px] py-1 px-2"
                      >
                        + Dispatch Order
                      </button>
                    </div>
                  )}
                </div>

                {/* Engineer Severity Override Section */}
                <div className="card p-3 space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    Human Engineer Severity Override
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Municipal engineers may override automated AI score with engineering justification.
                  </p>

                  <div className="space-y-2">
                    <select
                      value={overrideLevel}
                      onChange={(e) => setOverrideLevel(e.target.value)}
                      className="w-full py-1.5 px-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="Minor">Minor (Routine maintenance)</option>
                      <option value="Moderate">Moderate (Scheduled patching)</option>
                      <option value="Severe">Severe (48h resolution SLA)</option>
                      <option value="Critical">Critical (Immediate road hazard)</option>
                    </select>

                    <textarea
                      rows={2}
                      placeholder="Engineer reasoning for override (e.g. adjacent water main risk)..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden"
                    />

                    <button
                      onClick={() =>
                        overrideSeverityMutation.mutate({
                          id: selectedDefectId,
                          level: overrideLevel,
                          reason: overrideReason || "Manual engineering reassessment",
                        })
                      }
                      className="btn-secondary text-xs w-full"
                    >
                      Save Override
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Defect record not found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Human Engineer Sign-Off Modal */}
      {verifyModalWo && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setVerifyModalWo(null)}
        >
          <div
            className="w-full max-w-md card p-5 border shadow-xl bg-white dark:bg-slate-900 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Municipal Engineer Verification Sign-Off
                </h3>
              </div>
              <button
                onClick={() => setVerifyModalWo(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Authoritative human closure for Order #{verifyModalWo.id.slice(0, 8)}. AI model recommends approval with 94.5% damage reduction.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Engineer Decision
                </label>
                <select
                  value={humanDecision}
                  onChange={(e) => setHumanDecision(e.target.value as "APPROVED" | "REJECTED")}
                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="APPROVED">APPROVED — Repair Accepted</option>
                  <option value="REJECTED">REJECTED — Rework Required</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Justification / Inspection Notes
                </label>
                <textarea
                  rows={3}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setVerifyModalWo(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    verifyRepairMutation.mutate({
                      id: verifyModalWo.id,
                      pct: 94.5,
                      aiRec: "PASS",
                      decision: humanDecision,
                      reason: decisionReason,
                    })
                  }
                  className="btn-primary text-xs"
                >
                  Confirm Sign-Off
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Create Work Order Modal */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setCreateModalOpen(false)}
        >
          <div
            className="w-full max-w-md card p-5 border shadow-xl bg-white dark:bg-slate-900 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                Dispatch Maintenance Work Order
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Defect
                </label>
                <select
                  value={newDefectId}
                  onChange={(e) => setNewDefectId(e.target.value)}
                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="">Select an active defect...</option>
                  {defects.slice(0, 30).map((d) => (
                    <option key={d.id} value={d.id}>
                      #{d.id.slice(0, 8)} — {d.class_code} ({d.latest_severity_level || d.severity_level || "Defect"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Contractor Assignment
                </label>
                <select
                  value={newContractorId}
                  onChange={(e) => setNewContractorId(e.target.value)}
                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                >
                  <option value="">Select certified contractor...</option>
                  {contractors?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estimated Repair Cost (₹)
                </label>
                <input
                  type="number"
                  value={newCost}
                  onChange={(e) => setNewCost(e.target.value)}
                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setCreateModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    createMutation.mutate({
                      defect_id: newDefectId || defects[0]?.id || "",
                      contractor_id: newContractorId || null,
                      estimated_cost: Number(newCost) || null,
                      priority: newPriority,
                    })
                  }
                  disabled={!defects.length}
                  className="btn-primary text-xs"
                >
                  Dispatch Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Citizen Report Modal */}
      {createComplaintModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setCreateComplaintModalOpen(false)}
        >
          <div
            className="w-full max-w-md card p-5 border shadow-xl bg-white dark:bg-slate-900 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Submit Citizen Road Hazard Report
                </h3>
              </div>
              <button
                onClick={() => setCreateComplaintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hazard Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe road defect location, size, and vehicle safety hazard..."
                  value={newComplaintDesc}
                  onChange={(e) => setNewComplaintDesc(e.target.value)}
                  className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Latitude
                  </label>
                  <input
                    type="text"
                    value={newComplaintLat}
                    onChange={(e) => setNewComplaintLat(e.target.value)}
                    className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Longitude
                  </label>
                  <input
                    type="text"
                    value={newComplaintLng}
                    onChange={(e) => setNewComplaintLng(e.target.value)}
                    className="w-full p-2 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setCreateComplaintModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    createComplaintMutation.mutate({
                      latitude: parseFloat(newComplaintLat) || 30.901,
                      longitude: parseFloat(newComplaintLng) || 75.8573,
                      description: newComplaintDesc || "Public surface hazard reported",
                    })
                  }
                  className="btn-primary text-xs"
                >
                  Submit Grievance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
