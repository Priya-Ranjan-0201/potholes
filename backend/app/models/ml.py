"""Machine learning model registry, media, detections, and measurement models."""

import uuid

from backend.app.models.base import Base, TimestampMixin, UUIDMixin
from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column


class ModelVersion(Base, UUIDMixin, TimestampMixin):
    """Registry of trained road-damage detection models with deployment metadata."""

    __tablename__ = "model_versions"

    version_tag: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    framework: Mapped[str] = mapped_column(String(50), nullable=False)  # ultralytics_yolov8
    target_hardware: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # onnx_mobile | tflite_int8 | tensorrt
    model_size_mb: Mapped[float] = mapped_column(Float, nullable=False)
    metrics_summary: Mapped[dict] = mapped_column(JSONB, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Inspection(Base, UUIDMixin, TimestampMixin):
    """An individual road inspection survey run or drive."""

    __tablename__ = "inspections"

    device_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("devices.id", ondelete="CASCADE"), nullable=False, index=True
    )
    surveyor_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="IN_PROGRESS", nullable=False
    )  # IN_PROGRESS | COMPLETED | FAILED


class Media(Base, UUIDMixin, TimestampMixin):
    """Uploaded or captured image/video frames stored in MinIO."""

    __tablename__ = "media"

    inspection_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("inspections.id", ondelete="SET NULL"), nullable=True
    )
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    is_privacy_blurred: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class Detection(Base, UUIDMixin, TimestampMixin):
    """A single object bounding box predicted on a media frame."""

    __tablename__ = "detections"

    media_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="CASCADE"), nullable=False, index=True
    )
    model_version_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("model_versions.id", ondelete="RESTRICT"), nullable=False
    )
    class_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_x1: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_y1: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_x2: Mapped[float] = mapped_column(Float, nullable=False)
    bbox_y2: Mapped[float] = mapped_column(Float, nullable=False)
    frame_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class SegmentationMask(Base, UUIDMixin, TimestampMixin):
    """Polygonal or RLE segmentation mask associated with a detection."""

    __tablename__ = "segmentation_masks"

    detection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("detections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    rle_string: Mapped[str | None] = mapped_column(Text, nullable=True)
    relative_area: Mapped[float | None] = mapped_column(Float, nullable=True)


class Measurement(Base, UUIDMixin, TimestampMixin):
    """Physical or relative dimension estimates adhering to Rule R4."""

    __tablename__ = "measurements"

    detection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("detections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    unit: Mapped[str] = mapped_column(String(20), nullable=False)  # px | cm | m | relative
    calibrated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    method: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # ground_homography | depth_sensor | none
    error_estimate: Mapped[float | None] = mapped_column(Float, nullable=True)
    width_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    height_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    area_value: Mapped[float | None] = mapped_column(Float, nullable=True)
