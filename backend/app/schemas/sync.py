"""Pydantic schemas for sync batch ingestion adhering to shared/json-schemas."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class LocationSchema(BaseModel):
    """Geographic coordinate and kinematics schema."""

    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    accuracy_m: float | None = Field(default=None, ge=0.0)
    speed_mps: float | None = Field(default=None, ge=0.0)
    heading_deg: float | None = Field(default=None, ge=0.0, le=360.0)
    altitude_m: float | None = Field(default=None)


class MeasurementSummarySchema(BaseModel):
    """Defect dimensions conforming to Rule R4."""

    relative_area: float | None = Field(default=None)
    bbox_width_px: float | None = Field(default=None)
    bbox_height_px: float | None = Field(default=None)
    unit: str | None = Field(default="px")
    calibrated: bool | None = Field(default=False)


class ObservationPayloadSchema(BaseModel):
    """Observation schema matching observation.schema.json."""

    observation_id: uuid.UUID
    defect_id: uuid.UUID
    device_id: uuid.UUID
    inspection_id: uuid.UUID | None = None
    detection_id: str | None = None
    location: LocationSchema
    confidence: float = Field(..., ge=0.0, le=1.0)
    class_code: str
    measurement_summary: MeasurementSummarySchema | None = None
    best_frame_path: str | None = None
    track_length_frames: int | None = Field(default=None, ge=1)
    quality_score: float | None = Field(default=None, ge=0.0, le=1.0)
    observed_at: datetime
    created_at: datetime | None = None


class MediaManifestItemSchema(BaseModel):
    """Metadata of captured and privacy-redacted media."""

    media_id: uuid.UUID
    filename: str
    sha256: str = Field(..., min_length=64, max_length=64)
    mime_type: str
    size_bytes: int = Field(..., ge=1)
    observation_ids: list[uuid.UUID] | None = None


class InspectionMetadataSchema(BaseModel):
    """Survey inspection session telemetry."""

    inspection_id: uuid.UUID | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    total_frames_processed: int | None = Field(default=None, ge=0)
    total_detections: int | None = Field(default=None, ge=0)
    avg_fps: float | None = Field(default=None, ge=0.0)
    avg_inference_ms: float | None = Field(default=None, ge=0.0)


class SyncBatchRequest(BaseModel):
    """Incoming sync batch from edge outbox."""

    batch_id: uuid.UUID
    device_id: uuid.UUID
    idempotency_key: str = Field(..., min_length=1, max_length=255)
    model_version: str | None = None
    observations: list[ObservationPayloadSchema] = Field(..., min_length=1)
    media_manifest: list[MediaManifestItemSchema] = Field(default_factory=list)
    inspection_metadata: InspectionMetadataSchema | None = None
    sent_at: datetime
    retry_count: int = 0


class SyncBatchResponse(BaseModel):
    """Confirmation receipt for ingested batch."""

    status: str  # SYNCED | ALREADY_PROCESSED
    batch_id: uuid.UUID
    idempotency_key: str
    total_received: int
    synced_observations: int
    new_defects: int
    merged_defects: int
    media_registered: int
    message: str
