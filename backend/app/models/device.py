"""Edge device registration and operational health telemetry models."""

import uuid

from backend.app.models.base import Base, TimestampMixin, UUIDMixin
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Device(Base, UUIDMixin, TimestampMixin):
    """Enrolled edge devices (Android phones, Raspberry Pi, laptop units)."""

    __tablename__ = "devices"

    device_key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    device_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # android | raspberry_pi | jetson | laptop
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)  # e.g., "OPPO K13"
    assigned_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    active_model_version: Mapped[str | None] = mapped_column(String(100), nullable=True)

    heartbeats: Mapped[list["DeviceHeartbeat"]] = relationship(
        "DeviceHeartbeat", back_populates="device", cascade="all, delete-orphan"
    )


class DeviceHeartbeat(Base, UUIDMixin, TimestampMixin):
    """Periodic telemetry report emitted by connected edge agents."""

    __tablename__ = "device_heartbeats"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fps: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature_celsius: Mapped[float | None] = mapped_column(Float, nullable=True)
    battery_level_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    queue_depth: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    has_gps_fix: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    telemetry_meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    device: Mapped["Device"] = relationship("Device", back_populates="heartbeats")
