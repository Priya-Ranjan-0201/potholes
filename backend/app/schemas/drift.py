"""Pydantic schemas for Model Drift & Continuous Performance Monitoring."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ModelRegistryItem(BaseModel):
    """Registered model profile with versioning, architecture, and deployment state."""

    id: str
    model_name: str
    architecture: str
    version: str
    training_dataset_version: str
    training_config: Dict[str, Any] = Field(default_factory=dict)
    training_date: str
    evaluation_metrics: Dict[str, Any] = Field(default_factory=dict)
    checkpoint_location: str
    deployment_status: str
    previous_model_version: Optional[str] = None
    is_active: bool = False


class ModelCompareRequest(BaseModel):
    """Request payload for comparing two or more model versions."""

    candidate_version: str = "v1.3.0-rc1"
    baseline_version: str = "v1.2.0-int8"


class ModelCompareResponse(BaseModel):
    """Detailed model comparison with per-class deltas and promotion acceptance gate."""

    candidate: Dict[str, Any]
    production: Dict[str, Any]
    promotion_gate: Dict[str, Any]
    all_models: List[Dict[str, Any]] = Field(default_factory=list)


class DriftAnalysisRequest(BaseModel):
    """Request payload to execute data and concept drift analysis on a batch."""

    model_version: str = "v1.2.0-int8"
    dataset_name: str = "NH-44 Patrol Stream"
    include_ground_truth: bool = False
    simulate_domain_shift: Optional[str] = None  # None | "rainy_wet" | "nighttime" | "lens_blur"
    sample_count: int = 50


class DriftAnalysisResponse(BaseModel):
    """Results of empirical data and concept drift assessment."""

    model_version: str
    dataset_name: str
    sample_count: int
    evaluation_timestamp: str

    psi_brightness: float
    psi_contrast: float
    psi_sharpness: float
    psi_overall: float
    ks_brightness_stat: float
    ks_brightness_pvalue: float
    is_input_drift_detected: bool
    input_drift_summary: str

    has_ground_truth: bool
    concept_drift_detected: bool
    map50: Optional[float] = None
    map50_95: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None
    map50_delta_vs_baseline: Optional[float] = None
    recall_delta_vs_baseline: Optional[float] = None
    per_class_metrics: Dict[str, Any] = Field(default_factory=dict)

    environmental_matrix: Dict[str, Any] = Field(default_factory=dict)
    geographic_matrix: Dict[str, Any] = Field(default_factory=dict)

    alerts_triggered: List[Dict[str, Any]] = Field(default_factory=list)
    retraining_recommendation: Optional[Dict[str, Any]] = None


class ModelDriftAlertItem(BaseModel):
    """Actionable alert item describing model degradation or data drift."""

    id: str
    severity: str  # CRITICAL | WARNING | INFO
    alert_type: str
    affected_model_version: str
    affected_categories: List[str] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)
    suggested_investigation_steps: List[str] = Field(default_factory=list)
    is_acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    created_at: str


class AcknowledgeAlertRequest(BaseModel):
    """Payload for engineer acknowledging and commenting on an alert."""

    engineer_name: str = "Municipal Lead Engineer"
    investigation_notes: str = "Inspected night camera sensor gain; scheduled calibration."


class RetrainingRecommendationItem(BaseModel):
    """Targeted retraining proposal triggered by domain drift."""

    recommendation_id: str
    model_version: str
    affected_domain: str
    weak_classes: List[str]
    sample_count_needed: int
    dataset_version_target: str
    status: str
    acceptance_criteria: Dict[str, Any]
    action_plan: List[str]


class TriggerRetrainingRequest(BaseModel):
    """Payload to trigger a controlled retraining experiment."""

    recommendation_id: str
    dataset_version: str = "RDD2022-India-v2.2-patch"
    epochs: int = 100
    engineer_notes: Optional[str] = None

