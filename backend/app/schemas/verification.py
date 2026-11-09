"""Pydantic schemas for AI-Powered Road Repair Verification."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class DefectCoordinateItem(BaseModel):
    """Bounding box coordinates and area."""

    id: str | None = None
    label: str
    confidence: float
    box: list[float]  # [x%, y%, w%, h%]
    area_px: int


class VerifyRepairRequest(BaseModel):
    """Request payload for comparing pre- and post-repair pavement images."""

    work_order_id: uuid.UUID | None = None
    defect_id: uuid.UUID | None = None
    corridor_name: str = "NH-44 GT Road Corridor"
    latitude: float = 30.9010
    longitude: float = 75.8573
    inspection_date: datetime = Field(default_factory=lambda: datetime.now(UTC))
    repair_date: datetime | None = None
    before_image_src: str | None = None
    after_image_src: str | None = None
    before_detections: list[dict[str, Any]] | None = None


class VerificationAssessmentResponse(BaseModel):
    """Full AI-powered repair verification and quality classification response."""

    id: str
    status: str
    # successfully_repaired | partially_repaired | incomplete_repair |
    # damage_recurring | new_damage_detected | verification_inconclusive
    effectiveness_pct: float
    explanation: str

    alignment_confidence: float
    inliers_count: int
    matches_count: int
    inlier_ratio: float
    perspective_corrected: bool

    before_area_px: int
    remaining_area_px: int
    new_area_px: int
    area_reduction_pct: float
    measurement_type: str = "uncalibrated_pixel_area_relative"
    is_calibrated: bool = False

    before_defects: list[dict[str, Any]] = Field(default_factory=list)
    remaining_defects: list[dict[str, Any]] = Field(default_factory=list)
    new_defects: list[dict[str, Any]] = Field(default_factory=list)
    resolved_defects: list[dict[str, Any]] = Field(default_factory=list)

    recurrence_detected: bool = False
    recurrence_count: int = 0
    days_to_recurrence: int | None = None

    feature_matches_data_uri: str | None = None
    difference_heatmap_data_uri: str | None = None
    aligned_after_data_uri: str | None = None

    corridor_name: str = "NH-44 GT Road Corridor"
    latitude: float = 30.9010
    longitude: float = 75.8573
    inspection_date: datetime
    repair_date: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class VerificationRecordListItem(BaseModel):
    """Summary item for historical repair verification listings."""

    id: str
    work_order_id: str | None = None
    defect_id: str | None = None
    corridor_name: str
    latitude: float
    longitude: float
    inspection_date: datetime
    repair_date: datetime | None = None
    status: str
    effectiveness_pct: float
    before_area_px: int
    remaining_area_px: int
    area_reduction_pct: float
    recurrence_detected: bool
    recurrence_count: int
    alignment_confidence: float
    created_at: datetime


class BenchmarkPairItem(BaseModel):
    """Benchmark test pair for evaluation and verification testing."""

    id: str
    title: str
    category_expected: str
    before_src: str
    after_src: str
    corridor: str
    description: str
