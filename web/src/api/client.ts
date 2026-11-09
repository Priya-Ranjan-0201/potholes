/**
 * Typed ScamRoad API Client adhering to Specification.
 * Enforces JWT Bearer authentication, UTC timestamps, and standardized error envelopes.
 */

const BASE_URL = "/api/v1";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  is_active: boolean;
  is_verified: boolean;
  roles: string[];
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserProfile;
}

export interface StatsOverview {
  total_defects: number;
  open_defects: number;
  repaired_defects: number;
  critical_defects: number;
  defects_by_severity: Record<string, number>;
  defects_by_status: Record<string, number>;
  defects_by_class: Record<string, number>;
  total_complaints: number;
  complaints_by_status: Record<string, number>;
  total_work_orders: number;
  work_orders_by_status: Record<string, number>;
  total_roads_monitored: number;
  average_road_health_index: number | null;
}

export interface WardStat {
  ward_id: string;
  ward_name: string;
  ward_code: string | null;
  total_defects: number;
  critical_defects: number;
  repaired_defects: number;
  allocated_budget: number;
  spent_budget: number;
  average_road_health: number | null;
}

export interface ContractorStat {
  contractor_id: string;
  contractor_name: string;
  total_assigned: number;
  total_completed: number;
  total_verified: number;
  sla_compliance_rate_pct: number | null;
}

export interface DailyTrend {
  date: string;
  observations_count: number;
  complaints_count: number;
  repairs_count: number;
}

export interface TrendsResponse {
  days: number;
  trends: DailyTrend[];
}

export interface DefectItem {
  id: string;
  class_code: string;
  status: string;
  latitude: number;
  longitude: number;
  road_segment_id: string | null;
  first_seen: string;
  last_seen: string;
  times_seen: number;
  is_demo: boolean;
  severity_level?: string | null;
  latest_severity_level?: string | null;
  normalized_score?: number | null;
  latest_severity_score?: number | null;
  factor_breakdown?: Record<string, number> | null;
  missing_factors?: string[] | null;
  needs_human_review?: boolean;
}

export interface DefectObservationItem {
  id: string;
  observed_at: string;
  confidence: number;
  latitude: number;
  longitude: number;
  accuracy_m?: number | null;
  speed_mps?: number | null;
  heading_deg?: number | null;
  track_length_frames?: number | null;
  best_frame_path?: string | null;
  measurement_summary?: Record<string, any> | null;
}

export interface DefectSeverityHistoryItem {
  id: string;
  normalized_score: number;
  level: string;
  source: string;
  needs_human_review: boolean;
  factor_breakdown?: Record<string, number> | null;
  missing_factors?: string[] | null;
  uncertainty_note?: string | null;
  created_at: string;
}

export interface DefectDetailResponse {
  id: string;
  class_code: string;
  status: string;
  latitude: number;
  longitude: number;
  times_seen: number;
  first_seen: string;
  last_seen: string;
  road_segment_id?: string | null;
  road_name?: string | null;
  observations: DefectObservationItem[];
  severity_history?: DefectSeverityHistoryItem[];
  merge_history?: any[];
  defect?: DefectItem;
  assessments?: DefectSeverityHistoryItem[];
}

export interface ModelEvaluationResponse {
  timestamp_utc: string;
  model_version: string;
  checkpoint: string;
  sha256: string;
  file_size_mb: number;
  dataset_name: string;
  test_images_count: number;
  test_instances_total: number;
  test_instances_by_class: Record<string, number>;
  overall: {
    mAP50: number;
    mAP50_95: number;
    precision: number;
    recall: number;
    f1: number;
    ece: number;
  };
  per_class: Record<
    string,
    {
      instances: number;
      precision: number;
      recall: number;
      f1: number;
      mAP50: number;
      mAP50_95: number;
    }
  >;
  confusion_matrix: {
    classes: string[];
    counts: number[][];
    normalized: number[][];
  };
  inference_latency: {
    host_os: string;
    host_processor: string;
    device: string;
    execution_provider: string;
    imgsz: number;
    p50_ms: number;
    p95_ms: number;
    p99_ms: number;
    throughput_fps: number;
    test_iterations: number;
  };
  confidence_calibration: {
    ece: number;
    num_bins: number;
    bins: Array<{
      bin_idx: number;
      bin_range: [number, number];
      count: number;
      mean_conf: number;
      accuracy: number;
      error: number;
    }>;
  };
  failure_gallery: Array<{
    id: string;
    type: string;
    predicted_class: string;
    ground_truth: string;
    confidence: number;
    image_id: string;
    root_cause: string;
    mitigation: string;
  }>;
  device_matrix?: Array<{
    device: string;
    status: string;
    fps: number | null;
    latency_p50_ms: number | null;
    notes?: string;
  }>;
  model_comparisons?: Array<{
    name: string;
    family: string;
    tier: string;
    params_m: number;
    size_mb: number;
    latency_ms: number;
    fps: number;
    precision: number;
    recall: number;
    mAP50: number;
    mAP50_95: number;
  }>;
  quantization?: {
    fp32_size_mb: number;
    int8_size_mb: number;
    compression_percentage: number;
  };
  dataset_splits?: {
    train?: number;
    val?: number;
    test?: number;
    total?: number;
  };
  limitations_note?: string;
}

export interface WorkOrder {
  id: string;
  defect_id: string;
  contractor_id: string | null;
  sla_policy_id: string | null;
  priority: string;
  status: string;
  estimated_cost: number | null;
  deadline: string | null;
  created_at: string;
  history: Array<{
    id: string;
    from_status: string;
    to_status: string;
    changed_by_user_id: string | null;
    notes: string | null;
    created_at: string;
  }>;
  repair_record?: {
    id: string;
    repaired_at: string;
    materials_used: string | null;
    actual_cost: number | null;
  } | null;
  verification?: {
    id: string;
    ai_damage_reduction_pct: number;
    ai_recommendation: string;
    human_decision: string | null;
    decision_reason: string | null;
  } | null;
}

export interface ComplaintItem {
  id: string;
  citizen_report_id: string;
  defect_id: string | null;
  status: string;
  latitude: number;
  longitude: number;
  description: string | null;
  media_path: string | null;
  assigned_to_user_id: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface Contractor {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string;
  email: string | null;
  is_active: boolean;
}

export interface SlaPolicy {
  id: string;
  name: string;
  severity_level: string;
  max_resolution_hours: number;
}

export interface VerificationAssessment {
  id: string;
  status:
    | "successfully_repaired"
    | "partially_repaired"
    | "incomplete_repair"
    | "damage_recurring"
    | "new_damage_detected"
    | "verification_inconclusive"
    | string;
  effectiveness_pct: number;
  explanation: string;
  alignment_confidence: number;
  inliers_count: number;
  matches_count: number;
  inlier_ratio: number;
  perspective_corrected: boolean;
  before_area_px: number;
  remaining_area_px: number;
  new_area_px: number;
  area_reduction_pct: number;
  measurement_type: string;
  is_calibrated: boolean;
  before_defects: Array<{ id?: string; label: string; confidence: number; box: number[]; area_px: number }>;
  remaining_defects: Array<{ id?: string; label: string; confidence: number; box: number[]; area_px: number }>;
  new_defects: Array<{ id?: string; label: string; confidence: number; box: number[]; area_px: number }>;
  resolved_defects: Array<{ id?: string; label: string; confidence: number; box: number[]; area_px: number }>;
  recurrence_detected: boolean;
  recurrence_count: number;
  days_to_recurrence: number | null;
  feature_matches_data_uri?: string | null;
  difference_heatmap_data_uri?: string | null;
  aligned_after_data_uri?: string | null;
  corridor_name: string;
  latitude: number;
  longitude: number;
  inspection_date: string;
  repair_date?: string | null;
  created_at: string;
}

export interface VerificationRecordItem {
  id: string;
  work_order_id?: string | null;
  defect_id?: string | null;
  corridor_name: string;
  latitude: number;
  longitude: number;
  inspection_date: string;
  repair_date?: string | null;
  status: string;
  effectiveness_pct: number;
  before_area_px: number;
  remaining_area_px: number;
  area_reduction_pct: number;
  recurrence_detected: boolean;
  recurrence_count: number;
  alignment_confidence: number;
  created_at: string;
}

export interface BenchmarkPairItem {
  id: string;
  title: string;
  category_expected: string;
  before_src: string;
  after_src: string;
  corridor: string;
  description: string;
}

export interface VerifyRepairPayload {
  work_order_id?: string | null;
  defect_id?: string | null;
  corridor_name?: string;
  latitude?: number;
  longitude?: number;
  inspection_date?: string;
  repair_date?: string | null;
  before_image_src?: string | null;
  after_image_src?: string | null;
  before_detections?: Array<any> | null;
}

// --------------------------------------------------------------------------
// Model Drift & Performance Monitoring Schemas
// --------------------------------------------------------------------------

export interface ModelRegistryItem {
  id: string;
  model_name: string;
  architecture: string;
  version: string;
  training_dataset_version: string;
  training_config: Record<string, any>;
  training_date: string;
  evaluation_metrics: Record<string, any>;
  checkpoint_location: string;
  deployment_status: string;
  previous_model_version?: string | null;
  is_active: boolean;
}

export interface ModelCompareResponse {
  candidate: Record<string, any>;
  production: Record<string, any>;
  promotion_gate: {
    passed_all: boolean;
    verdict: string;
    rules: Array<{
      rule_name: string;
      description: string;
      passed: boolean;
      candidate_val: any;
      production_val: any;
    }>;
  };
  all_models: Array<Record<string, any>>;
}

export interface DriftAnalysisResponse {
  model_version: string;
  dataset_name: string;
  sample_count: number;
  evaluation_timestamp: string;

  psi_brightness: number;
  psi_contrast: number;
  psi_sharpness: number;
  psi_overall: number;
  ks_brightness_stat: number;
  ks_brightness_pvalue: number;
  is_input_drift_detected: boolean;
  input_drift_summary: string;

  has_ground_truth: boolean;
  concept_drift_detected: boolean;
  map50?: number | null;
  map50_95?: number | null;
  precision?: number | null;
  recall?: number | null;
  f1?: number | null;
  map50_delta_vs_baseline?: number | null;
  recall_delta_vs_baseline?: number | null;
  per_class_metrics: Record<string, any>;

  environmental_matrix: Record<string, any>;
  geographic_matrix: Record<string, any>;

  alerts_triggered: Array<Record<string, any>>;
  retraining_recommendation?: Record<string, any> | null;
}

export interface ModelDriftAlertItem {
  id: string;
  severity: "CRITICAL" | "WARNING" | "INFO";
  alert_type: string;
  affected_model_version: string;
  affected_categories: string[];
  metrics: Record<string, any>;
  suggested_investigation_steps: string[];
  is_acknowledged: boolean;
  acknowledged_by?: string | null;
  created_at: string;
}

export interface RetrainingRecommendationItem {
  recommendation_id: string;
  model_version: string;
  affected_domain: string;
  weak_classes: string[];
  sample_count_needed: number;
  dataset_version_target: string;
  status: string;
  acceptance_criteria: Record<string, any>;
  action_plan: string[];
}

// Token storage helpers
export function getStoredToken(): string | null {
  return localStorage.getItem("scamroad_access_token");
}

export function setStoredTokens(access: string, refresh: string): void {
  localStorage.setItem("scamroad_access_token", access);
  localStorage.setItem("scamroad_refresh_token", refresh);
}

export function clearStoredTokens(): void {
  localStorage.removeItem("scamroad_access_token");
  localStorage.removeItem("scamroad_refresh_token");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API Error ${res.status} [${endpoint}]: ${errorBody || res.statusText}`);
  }

  return (await res.json()) as T;
}

export const api = {
  // Auth
  register: (payload: { email: string; password: string; full_name: string; role?: string }) =>
    request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),

  login: (payload: { email: string; password: string }) =>
    request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),

  getMe: () => request<UserProfile>("/auth/me"),

  // Stats
  getOverview: () => request<StatsOverview>("/stats/overview"),
  getWards: () => request<WardStat[]>("/stats/wards"),
  getContractorsStats: () => request<ContractorStat[]>("/stats/contractors"),
  getTrends: (days = 14) => request<TrendsResponse>(`/stats/trends?days=${days}`),

  // Defects
  listDefects: (params?: { limit?: number; offset?: number; status?: string; class_code?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", params.limit.toString());
    if (params?.offset) qs.set("offset", params.offset.toString());
    if (params?.status) qs.set("status", params.status);
    if (params?.class_code) qs.set("class_code", params.class_code);
    return request<{ total: number; items: DefectItem[]; limit: number; offset: number }>(
      `/defects?${qs.toString()}`
    );
  },

  getDefect: (id: string) => request<DefectDetailResponse>(`/defects/${id}`),

  createDefect: (payload: {
    class_code: string;
    latitude?: number;
    longitude?: number;
    confidence?: number;
    severity_level?: string;
    normalized_score?: number;
  }) =>
    request<DefectItem>("/defects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  clearAllDefects: () =>
    request<{ status: string; message: string }>("/defects/clear-all", {
      method: "DELETE",
    }),

  overrideSeverity: (id: string, payload: { override_level: string; reason: string }) =>
    request<any>(`/defects/${id}/override-severity`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Work Orders & Maintenance
  listWorkOrders: (params?: { limit?: number; offset?: number; status?: string; priority?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set("limit", params.limit.toString());
    if (params?.offset) qs.set("offset", params.offset.toString());
    if (params?.status) qs.set("status", params.status);
    if (params?.priority) qs.set("priority", params.priority);
    return request<{ total: number; items: WorkOrder[]; limit: number; offset: number }>(
      `/work-orders?${qs.toString()}`
    );
  },

  getWorkOrder: (id: string) => request<WorkOrder>(`/work-orders/${id}`),

  createWorkOrder: (payload: {
    defect_id: string;
    contractor_id?: string | null;
    sla_policy_id?: string | null;
    priority?: string;
    estimated_cost?: number | null;
  }) =>
    request<WorkOrder>("/work-orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  transitionWorkOrderStatus: (id: string, payload: { new_status: string; notes?: string }) =>
    request<WorkOrder>(`/work-orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  submitRepair: (
    id: string,
    payload: { materials_used?: string; actual_cost?: number; before_media_id?: string; after_media_id?: string }
  ) =>
    request<any>(`/work-orders/${id}/repair`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  verifyRepair: (
    id: string,
    payload: {
      ai_damage_reduction_pct: number;
      ai_recommendation: string;
      human_decision: string;
      decision_reason: string;
    }
  ) =>
    request<any>(`/work-orders/${id}/verify`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listContractors: () => request<Contractor[]>("/contractors"),
  listSlaPolicies: () => request<SlaPolicy[]>("/sla-policies"),

  // Complaints
  listComplaints: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return request<{ total: number; items: ComplaintItem[]; limit: number; offset: number }>(
      `/reports${qs}`
    );
  },

  createComplaint: (payload: { latitude: number; longitude: number; description?: string }) =>
    request<ComplaintItem>("/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  transitionComplaintStatus: (
    id: string,
    payload: { new_status: string; notes?: string; rejection_reason?: string }
  ) =>
    request<ComplaintItem>(`/reports/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  // AI Model Evaluation Metrics
  getModelEvaluation: () => request<ModelEvaluationResponse>("/models/evaluation"),
  health: () => request<any>("/health"),

  // AI-Powered Repair Verification
  verifyRepairAssessment: (payload: VerifyRepairPayload) =>
    request<VerificationAssessment>("/verifications/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  listVerificationRecords: (params?: { status?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status && params.status !== "ALL") qs.set("status", params.status);
    if (params?.limit) qs.set("limit", params.limit.toString());
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<VerificationRecordItem[]>(`/verifications/records${query}`);
  },

  getVerificationBenchmarks: () =>
    request<BenchmarkPairItem[]>("/verifications/benchmarks"),

  getVerificationDetail: (id: string) =>
    request<VerificationAssessment>(`/verifications/${id}`),

  getVerificationPdfUrl: (id: string) => `${BASE_URL}/verifications/${id}/pdf`,
  getVerificationsCsvUrl: () => `${BASE_URL}/verifications/export.csv`,

  // Model Drift & Continuous Performance Monitoring
  listModelRegistry: () => request<ModelRegistryItem[]>("/drift/registry"),
  getModelRegistryDetail: (version: string) => request<ModelRegistryItem>(`/drift/registry/${version}`),
  compareModels: (payload: { candidate_version: string; baseline_version: string }) =>
    request<ModelCompareResponse>("/drift/compare", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  analyzeDrift: (payload: {
    model_version?: string;
    dataset_name?: string;
    include_ground_truth?: boolean;
    simulate_domain_shift?: string | null;
    sample_count?: number;
  }) =>
    request<DriftAnalysisResponse>("/drift/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listDriftRecords: () => request<any[]>("/drift/records"),
  listDriftAlerts: (params?: { severity?: string; unacknowledged_only?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.severity) qs.set("severity", params.severity);
    if (params?.unacknowledged_only !== undefined)
      qs.set("unacknowledged_only", params.unacknowledged_only ? "true" : "false");
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<ModelDriftAlertItem[]>(`/drift/alerts${query}`);
  },
  acknowledgeDriftAlert: (id: string, payload: { engineer_name: string; investigation_notes: string }) =>
    request<ModelDriftAlertItem>(`/drift/alerts/${id}/acknowledge`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listRetrainingRecommendations: () =>
    request<RetrainingRecommendationItem[]>("/drift/retraining/recommendations"),
  triggerRetraining: (payload: {
    recommendation_id: string;
    dataset_version?: string;
    epochs?: number;
    engineer_notes?: string;
  }) =>
    request<RetrainingRecommendationItem>("/drift/retraining/trigger", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getDriftRobustness: () => request<any>("/drift/robustness"),
  getDriftExportCsvUrl: () => `${BASE_URL}/drift/export.csv`,
};
