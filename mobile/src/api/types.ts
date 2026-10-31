/**
 * ScamRoad Mobile Application - Shared Types & Contracts
 * Fully strictly typed conforming to shared JSON schemas and taxonomy.yaml.
 */

export type LanguageCode = "en" | "hi" | "pa";

export type DefectClassCode =
  | "POTHOLE"
  | "CRACK_LONG"
  | "CRACK_TRANS"
  | "CRACK_ALLIGATOR";

export type SeverityLevel = "CRITICAL" | "SEVERE" | "MODERATE" | "MINOR";

export type ComplaintStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "VERIFIED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "REJECTED";

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  altitude_m?: number;
  accuracy_m: number;
  speed_mps?: number;
  heading_deg?: number;
  timestamp: string;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  confidence: number;
  class_code: DefectClassCode;
}

export interface DefectObservationPayload {
  track_id: string;
  class_code: DefectClassCode;
  confidence: number;
  bounding_box: BoundingBox;
  relative_area_pct: number;
  location: GeoCoordinate;
  image_sha256?: string;
  is_privacy_blurred: boolean;
  captured_at: string;
}

export interface OutboxItem {
  id: string;
  created_at: string;
  priority: "high" | "normal";
  status: "pending" | "uploading" | "delivered" | "failed";
  retry_count: number;
  payload: DefectObservationPayload;
  image_base64?: string;
  last_error?: string;
}

export interface CitizenComplaintReport {
  id: string;
  class_code: DefectClassCode;
  description: string;
  latitude: number;
  longitude: number;
  status: ComplaintStatus;
  upvotes_count: number;
  has_upvoted?: boolean;
  image_url?: string;
  created_at: string;
  road_name?: string;
}

export interface RoadChecklistItem {
  id: string;
  category: "surface" | "drainage" | "shoulder" | "marking";
  title_key: string;
  completed: boolean;
  notes?: string;
}

