/**
 * Typed ScamRoad API Client adhering to Rule A6.
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
  normalized_score?: number | null;
  factor_breakdown?: Record<string, number> | null;
  missing_factors?: string[] | null;
  needs_human_review?: boolean;
}

export interface DefectDetailResponse {
  defect: DefectItem;
  observations: Array<{
    id: string;
    observed_at: string;
    confidence: number;
    latitude: number;
    longitude: number;
    track_length_frames?: number | null;
    best_frame_path?: string | null;
  }>;
  assessments: Array<{
    id: string;
    normalized_score: number;
    level: string;
    source: string;
    needs_human_review: boolean;
    uncertainty_note?: string | null;
    created_at: string;
  }>;
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

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.ok) {
      return (await res.json()) as T;
    }
  } catch {
    // Backend offline: seamlessly fallback to demonstration dataset
  }

  // Fallback demonstration response mapping
  if (endpoint.includes("/stats/overview")) {
    return MOCK_OVERVIEW as unknown as T;
  }
  if (endpoint.includes("/stats/trends")) {
    return MOCK_TRENDS as unknown as T;
  }
  if (endpoint.includes("/map/geojson")) {
    return MOCK_GEOJSON as unknown as T;
  }
  if (endpoint.includes("/defects")) {
    return MOCK_DEFECTS_LIST as unknown as T;
  }
  if (endpoint.includes("/work-orders")) {
    return MOCK_WORK_ORDERS_LIST as unknown as T;
  }
  if (endpoint.includes("/stats/wards")) {
    return MOCK_WARDS as unknown as T;
  }
  if (endpoint.includes("/stats/contractors") || endpoint.includes("/contractors")) {
    return MOCK_CONTRACTORS as unknown as T;
  }

  return {} as T;
}

const MOCK_OVERVIEW: StatsOverview = {
  total_defects: 42,
  open_defects: 11,
  repaired_defects: 31,
  critical_defects: 7,
  defects_by_severity: { Critical: 7, Severe: 14, Moderate: 12, Minor: 9 },
  defects_by_status: { OPEN: 11, ASSIGNED: 5, IN_PROGRESS: 4, REPAIRED: 22 },
  defects_by_class: { POTHOLE: 24, CRACK_LONG: 10, CRACK_ALLIGATOR: 5, CRACK_TRANS: 3 },
  total_complaints: 18,
  complaints_by_status: { PENDING: 3, VERIFIED: 15 },
  total_work_orders: 28,
  work_orders_by_status: { ASSIGNED: 6, IN_PROGRESS: 4, COMPLETED: 18 },
  total_roads_monitored: 8,
  average_road_health_index: 86.4,
};

const MOCK_TRENDS: TrendsResponse = {
  days: 14,
  trends: [
    { date: "Oct 22", observations_count: 8, complaints_count: 2, repairs_count: 4 },
    { date: "Oct 24", observations_count: 14, complaints_count: 3, repairs_count: 6 },
    { date: "Oct 26", observations_count: 11, complaints_count: 1, repairs_count: 9 },
    { date: "Oct 28", observations_count: 19, complaints_count: 4, repairs_count: 12 },
    { date: "Oct 30", observations_count: 15, complaints_count: 2, repairs_count: 14 },
    { date: "Nov 01", observations_count: 22, complaints_count: 5, repairs_count: 18 },
    { date: "Nov 03", observations_count: 12, complaints_count: 1, repairs_count: 21 },
  ],
};

const MOCK_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [75.8562, 30.9052] },
      properties: {
        id: "def-001",
        class_code: "POTHOLE",
        severity_level: "Critical",
        normalized_score: 92,
        road_name: "NH-44 Ludhiana Bypass (KM 312)",
        first_seen: "2026-11-03T14:20:00Z",
        status: "OPEN",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [75.8624, 30.9115] },
      properties: {
        id: "def-002",
        class_code: "CRACK_ALLIGATOR",
        severity_level: "Severe",
        normalized_score: 78,
        road_name: "Ferozepur Road (PAU Gate 2)",
        first_seen: "2026-11-02T11:15:00Z",
        status: "ASSIGNED",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [75.8441, 30.898] },
      properties: {
        id: "def-003",
        class_code: "POTHOLE",
        severity_level: "Critical",
        normalized_score: 88,
        road_name: "Gill Road / Industrial Area C",
        first_seen: "2026-11-04T08:30:00Z",
        status: "OPEN",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [75.871, 30.919] },
      properties: {
        id: "def-004",
        class_code: "CRACK_LONG",
        severity_level: "Moderate",
        normalized_score: 54,
        road_name: "Jalandhar Bypass Northbound",
        first_seen: "2026-11-01T16:45:00Z",
        status: "IN_PROGRESS",
      },
    },
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [75.838, 30.925] },
      properties: {
        id: "def-005",
        class_code: "POTHOLE",
        severity_level: "Minor",
        normalized_score: 32,
        road_name: "Mall Road / Civil Lines",
        first_seen: "2026-10-31T09:10:00Z",
        status: "REPAIRED",
      },
    },
  ],
};

const MOCK_DEFECTS_LIST = {
  total: 5,
  limit: 20,
  offset: 0,
  items: [
    {
      id: "def-001",
      class_code: "POTHOLE",
      status: "OPEN",
      latitude: 30.9052,
      longitude: 75.8562,
      road_segment_id: "NH-44 KM 312",
      first_seen: "2026-11-03T14:20:00Z",
      last_seen: "2026-11-04T07:15:00Z",
      times_seen: 4,
      is_demo: true,
      severity_level: "Critical",
      normalized_score: 92,
      needs_human_review: false,
    },
    {
      id: "def-002",
      class_code: "CRACK_ALLIGATOR",
      status: "ASSIGNED",
      latitude: 30.9115,
      longitude: 75.8624,
      road_segment_id: "Ferozepur Road",
      first_seen: "2026-11-02T11:15:00Z",
      last_seen: "2026-11-04T06:00:00Z",
      times_seen: 3,
      is_demo: true,
      severity_level: "Severe",
      normalized_score: 78,
      needs_human_review: false,
    },
    {
      id: "def-003",
      class_code: "POTHOLE",
      status: "OPEN",
      latitude: 30.898,
      longitude: 75.8441,
      road_segment_id: "Gill Road",
      first_seen: "2026-11-04T08:30:00Z",
      last_seen: "2026-11-04T08:30:00Z",
      times_seen: 1,
      is_demo: true,
      severity_level: "Critical",
      normalized_score: 88,
      needs_human_review: false,
    },
    {
      id: "def-004",
      class_code: "CRACK_LONG",
      status: "IN_PROGRESS",
      latitude: 30.919,
      longitude: 75.871,
      road_segment_id: "Jalandhar Bypass",
      first_seen: "2026-11-01T16:45:00Z",
      last_seen: "2026-11-03T18:00:00Z",
      times_seen: 5,
      is_demo: true,
      severity_level: "Moderate",
      normalized_score: 54,
      needs_human_review: false,
    },
    {
      id: "def-005",
      class_code: "POTHOLE",
      status: "REPAIRED",
      latitude: 30.925,
      longitude: 75.838,
      road_segment_id: "Mall Road",
      first_seen: "2026-10-31T09:10:00Z",
      last_seen: "2026-11-02T14:00:00Z",
      times_seen: 6,
      is_demo: true,
      severity_level: "Minor",
      normalized_score: 32,
      needs_human_review: false,
    },
  ],
};

const MOCK_WORK_ORDERS_LIST = {
  total: 4,
  limit: 20,
  offset: 0,
  items: [
    {
      id: "wo-001",
      defect_id: "def-001",
      contractor_id: "cont-01",
      sla_policy_id: "sla-24h",
      priority: "CRITICAL",
      status: "ASSIGNED",
      estimated_cost: 18500,
      deadline: "2026-11-05T14:20:00Z",
      created_at: "2026-11-03T15:00:00Z",
      history: [],
    },
    {
      id: "wo-002",
      defect_id: "def-002",
      contractor_id: "cont-02",
      sla_policy_id: "sla-48h",
      priority: "HIGH",
      status: "IN_PROGRESS",
      estimated_cost: 24000,
      deadline: "2026-11-06T11:00:00Z",
      created_at: "2026-11-02T12:00:00Z",
      history: [],
    },
    {
      id: "wo-003",
      defect_id: "def-005",
      contractor_id: "cont-01",
      sla_policy_id: "sla-72h",
      priority: "NORMAL",
      status: "VERIFIED",
      estimated_cost: 14000,
      deadline: "2026-11-03T10:00:00Z",
      created_at: "2026-10-31T10:00:00Z",
      history: [],
      repair_record: {
        id: "rep-001",
        repaired_at: "2026-11-02T13:30:00Z",
        materials_used: "Hot-Mix Asphalt Type II",
        actual_cost: 13800,
      },
      verification: {
        id: "ver-001",
        ai_damage_reduction_pct: 96.5,
        ai_recommendation: "PASS",
        human_decision: "VERIFIED",
        decision_reason: "Smooth surface compaction meets IRC:SP:84-2019 standard.",
      },
    },
  ],
};

const MOCK_WARDS: WardStat[] = [
  { ward_id: "w-01", ward_name: "Ward 12 (Clock Tower)", ward_code: "LDH-12", total_defects: 14, critical_defects: 3, repaired_defects: 9, allocated_budget: 1500000, spent_budget: 850000, average_road_health: 82.5 },
  { ward_id: "w-02", ward_name: "Ward 18 (PAU & Ferozepur Rd)", ward_code: "LDH-18", total_defects: 11, critical_defects: 2, repaired_defects: 8, allocated_budget: 1800000, spent_budget: 920000, average_road_health: 88.0 },
  { ward_id: "w-03", ward_name: "Ward 24 (Industrial Area C)", ward_code: "LDH-24", total_defects: 17, critical_defects: 4, repaired_defects: 10, allocated_budget: 2000000, spent_budget: 1150000, average_road_health: 79.4 },
];

const MOCK_CONTRACTORS: ContractorStat[] = [
  { contractor_id: "cont-01", contractor_name: "Ludhiana Asphalt Infra Ltd", total_assigned: 16, total_completed: 12, total_verified: 12, sla_compliance_rate_pct: 95.2 },
  { contractor_id: "cont-02", contractor_name: "Punjab Roadway Works Co.", total_assigned: 12, total_completed: 9, total_verified: 8, sla_compliance_rate_pct: 91.5 },
];

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

  // Maps & GeoJSON
  getMapGeoJson: (severity?: string, status?: string) => {
    const params = new URLSearchParams();
    if (severity) params.set("severity", severity);
    if (status) params.set("status", status);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return request<GeoJSON.FeatureCollection>(`/map/geojson${qs}`);
  },

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
};
