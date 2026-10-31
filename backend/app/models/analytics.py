"""Weather, forecasting, notifications, reporting jobs, and system settings models."""

import uuid
from datetime import UTC, datetime

from backend.app.models.base import Base, TimestampMixin, UUIDMixin
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column


class WeatherRecord(Base, UUIDMixin, TimestampMixin):
    """Historical and recent atmospheric observations impacting asphalt degradation."""

    __tablename__ = "weather_records"

    district_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("districts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    rainfall_mm: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    temperature_celsius: Mapped[float] = mapped_column(Float, nullable=False)
    humidity_pct: Mapped[float] = mapped_column(Float, nullable=False)
    weather_provider: Mapped[str] = mapped_column(String(50), default="open-meteo", nullable=False)


class Forecast(Base, UUIDMixin, TimestampMixin):
    """Degradation forecasts strictly distinct from observations (Rule R6)."""

    __tablename__ = "forecasts"

    road_segment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("road_segments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_horizon_days: Mapped[int] = mapped_column(Integer, nullable=False)
    predicted_health_score: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_interval_low: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_interval_high: Mapped[float] = mapped_column(Float, nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )


class Notification(Base, UUIDMixin, TimestampMixin):
    """User alerts dispatched across app, push, or email channels."""

    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(
        String(50), default="IN_APP", nullable=False
    )  # IN_APP | EMAIL | PUSH
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class NotificationRule(Base, UUIDMixin, TimestampMixin):
    """Automated event-driven notification dispatch triggers."""

    __tablename__ = "notification_rules"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    event_trigger: Mapped[str] = mapped_column(String(100), nullable=False)
    recipient_role: Mapped[str] = mapped_column(String(50), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class ReportJob(Base, UUIDMixin, TimestampMixin):
    """Asynchronous municipal PDF/CSV report generation jobs."""

    __tablename__ = "report_jobs"

    requested_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    report_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # WARD_HEALTH | CONTRACTOR_SLA | DEFECT_SUMMARY
    format: Mapped[str] = mapped_column(String(10), default="PDF", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)
    download_url: Mapped[str | None] = mapped_column(String(500), nullable=True)


class SystemSetting(Base, UUIDMixin, TimestampMixin):
    """Global configuration key-value storage."""

    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[dict] = mapped_column(JSONB, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
