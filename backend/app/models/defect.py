"""Canonical defects, immutable observations, deduplication logs, and severity models."""

import uuid
from datetime import UTC, datetime

from backend.app.models.base import Base, TimestampMixin, UUIDMixin
from geoalchemy2 import Geography
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Defect(Base, UUIDMixin, TimestampMixin):
    """Canonical physical road defect (One Pothole = One Record guarantee)."""

    __tablename__ = "defects"

    class_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    location: Mapped[str] = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=False
    )
    road_segment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("road_segments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(50), default="ACTIVE", nullable=False, index=True
    )  # ACTIVE | UNDER_REPAIR | REPAIRED | MERGED | FALSE_POSITIVE
    first_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    last_seen: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )
    times_seen: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    observations: Mapped[list["DefectObservation"]] = relationship(
        "DefectObservation", back_populates="defect"
    )
    severity_assessments: Mapped[list["SeverityAssessment"]] = relationship(
        "SeverityAssessment", back_populates="defect"
    )

    __table_args__ = (Index("ix_defects_location", "location", postgresql_using="gist"),)


class DefectObservation(Base, UUIDMixin, TimestampMixin):
    """Immutable sighting of a defect during a single camera pass. Never overwritten."""

    __tablename__ = "defect_observations"

    defect_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    detection_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("detections.id", ondelete="SET NULL"), nullable=True
    )
    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("devices.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    location: Mapped[str] = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=False
    )
    gps_accuracy_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed_mps: Mapped[float | None] = mapped_column(Float, nullable=True)
    heading_deg: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    measurement_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    defect: Mapped["Defect"] = relationship("Defect", back_populates="observations")

    __table_args__ = (
        Index("ix_defect_observations_location", "location", postgresql_using="gist"),
    )


class DefectMergeLog(Base, UUIDMixin, TimestampMixin):
    """Audit log of deduplication merges ensuring all merges are traceable and reversible."""

    __tablename__ = "defect_merge_log"

    primary_defect_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    merged_defect_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    match_score: Mapped[float] = mapped_column(Float, nullable=False)
    distance_meters: Mapped[float] = mapped_column(Float, nullable=False)
    merge_reason: Mapped[str] = mapped_column(String(255), nullable=False)
    reverted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class SeverityAssessment(Base, UUIDMixin, TimestampMixin):
    """Multi-factor severity scoring assessment adhering to Rule R5, R6, R7."""

    __tablename__ = "severity_assessments"

    defect_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    raw_score: Mapped[float] = mapped_column(Float, nullable=False)
    normalized_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 100
    level: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # Minor | Moderate | Severe | Critical
    factor_breakdown: Mapped[dict] = mapped_column(JSONB, nullable=False)
    missing_factors: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    uncertainty_note: Mapped[str | None] = mapped_column(String(255), nullable=True)
    needs_human_review: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    source: Mapped[str] = mapped_column(String(20), default="auto", nullable=False)  # auto | human
    assessed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    defect: Mapped["Defect"] = relationship("Defect", back_populates="severity_assessments")


class RoadHealthScore(Base, UUIDMixin, TimestampMixin):
    """Aggregated ScamRoad Health Index for road segments."""

    __tablename__ = "road_health_scores"

    segment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("road_segments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)  # 0 to 100
    defect_density: Mapped[float] = mapped_column(Float, nullable=False)
    method_version: Mapped[str] = mapped_column(String(50), default="v1.0", nullable=False)

    __table_args__ = (
        Index("ix_road_health_segment_period", "segment_id", "period_start", unique=True),
    )
