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


class ModelRegistryEntry(Base, UUIDMixin, TimestampMixin):
    """Complete Model Registry containing versioning, training configuration, and deployment state."""

    __tablename__ = "model_registry"

    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    architecture: Mapped[str] = mapped_column(String(50), nullable=False)
    version: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    training_dataset_version: Mapped[str] = mapped_column(String(100), nullable=False)
    training_config: Mapped[str] = mapped_column(Text, nullable=False)  # JSON
    training_date: Mapped[str] = mapped_column(String(50), nullable=False)
    evaluation_metrics: Mapped[str] = mapped_column(Text, nullable=False)  # JSON
    checkpoint_location: Mapped[str] = mapped_column(String(500), nullable=False)
    deployment_status: Mapped[str] = mapped_column(
        String(50), default="CANDIDATE", nullable=False, index=True
    )  # PRODUCTION | PREVIOUS | CANDIDATE | ARCHIVED | REJECTED
    previous_model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class ModelDriftRecord(Base, UUIDMixin, TimestampMixin):
    """Record of an empirical data drift and concept drift evaluation session."""

    __tablename__ = "model_drift_records"

    model_version: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    dataset_name: Mapped[str] = mapped_column(String(100), nullable=False)
    sample_count: Mapped[int] = mapped_column(Integer, nullable=False)
    psi_brightness: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    psi_contrast: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    psi_sharpness: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    psi_overall: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ks_statistic: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    ks_pvalue: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    is_input_drift_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_ground_truth: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    map50: Mapped[float | None] = mapped_column(Float, nullable=True)
    map50_95: Mapped[float | None] = mapped_column(Float, nullable=True)
    precision: Mapped[float | None] = mapped_column(Float, nullable=True)
    recall: Mapped[float | None] = mapped_column(Float, nullable=True)
    f1: Mapped[float | None] = mapped_column(Float, nullable=True)
    per_class_metrics: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    environmental_matrix: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class ModelDriftAlert(Base, UUIDMixin, TimestampMixin):
    """Actionable alert generated when model performance degradation or significant data drift is observed."""

    __tablename__ = "model_drift_alerts"

    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # CRITICAL | WARNING | INFO
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    affected_model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    affected_categories: Mapped[str] = mapped_column(Text, nullable=False)  # JSON list
    metrics_summary: Mapped[str] = mapped_column(Text, nullable=False)  # JSON dict
    suggested_investigation_steps: Mapped[str] = mapped_column(Text, nullable=False)  # JSON list
    is_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    acknowledged_by: Mapped[str | None] = mapped_column(String(100), nullable=True)


class ModelRetrainingRecommendation(Base, UUIDMixin, TimestampMixin):
    """Targeted retraining proposal triggered by domain drift or class-wise degradation."""

    __tablename__ = "model_retraining_recommendations"

    trigger_alert_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)
    affected_domain: Mapped[str] = mapped_column(String(100), nullable=False)
    weak_classes: Mapped[str] = mapped_column(Text, nullable=False)  # JSON list
    sample_count_needed: Mapped[int] = mapped_column(Integer, default=150, nullable=False)
    dataset_version_target: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="RECOMMENDED", nullable=False, index=True
    )  # RECOMMENDED | CURATING_DATA | RETRAINING_SCHEDULED | EVALUATING_CANDIDATE | PROMOTED | REJECTED
    acceptance_criteria: Mapped[str] = mapped_column(Text, nullable=False)  # JSON dict

