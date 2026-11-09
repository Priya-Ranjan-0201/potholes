"""Comprehensive test suite for Model Drift & Continuous Performance Monitoring.

Validates all 10 core architectural requirements:
1. Model Version Registry (Model profiles, checkpoints, training configs).
2. Data Drift Detection (Population Stability Index - PSI & Kolmogorov-Smirnov test).
3. Concept Drift Monitoring (Ground-truth verification vs unlabeled data rule).
4. Performance Degradation Alerts (Configurable thresholds, class degradation, latency).
5. Geographic and Environmental Robustness (Road types, weather, lighting, cameras).
6. Automated Model Comparison & Promotion Gate (Municipal acceptance criteria).
7. Targeted Retraining Recommendations (Action plan, domain curation recipe).
8. Experiment & Alert Logging (Historical records, human engineer sign-offs).
9. CSV Telemetry Export.
"""

from __future__ import annotations

import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.app.services.drift_detector import (
    calculate_psi,
    calculate_two_sample_ks,
    extract_image_features,
    get_drift_monitoring_service,
)
from backend.app.services.model_comparison import (
    ModelProfile,
    evaluate_model_promotion,
    get_default_model_profiles,
)


# ==============================================================================
# 1. Mathematical Statistical Tests (PSI & KS Test)
# ==============================================================================
def test_psi_identical_distributions() -> None:
    """Verify that identical distributions yield PSI close to 0.0 (Stable)."""
    base = [120.0, 125.0, 130.0, 135.0, 140.0, 122.0, 128.0, 132.0, 138.0, 126.0]
    curr = [120.0, 125.0, 130.0, 135.0, 140.0, 122.0, 128.0, 132.0, 138.0, 126.0]
    psi = calculate_psi(base, curr)
    assert psi < 0.05, f"Expected stable PSI < 0.05, got {psi}"


def test_psi_significant_drift() -> None:
    """Verify that a shifted distribution (e.g. night illumination) yields PSI >= 0.25."""
    base = [120.0, 125.0, 130.0, 135.0, 140.0, 122.0, 128.0, 132.0, 138.0, 126.0]
    # Extreme low-light / night shift
    shifted = [35.0, 40.0, 42.0, 38.0, 45.0, 32.0, 44.0, 41.0, 39.0, 36.0]
    psi = calculate_psi(base, shifted)
    assert psi >= 0.25, f"Expected significant drift PSI >= 0.25, got {psi}"


def test_kolmogorov_smirnov_test() -> None:
    """Verify two-sample Kolmogorov-Smirnov test detects distribution differences."""
    sample_a = np.random.normal(130.0, 10.0, 100)
    sample_b = np.random.normal(60.0, 10.0, 100)  # Distinct distribution

    stat, pvalue = calculate_two_sample_ks(sample_a, sample_b)
    assert pvalue < 0.01, f"Expected p-value < 0.01 on different distributions, got {pvalue}"
    assert stat > 0.50, f"Expected KS stat > 0.50, got {stat}"


def test_image_feature_extraction() -> None:
    """Verify physical visual metrics extraction from raw image matrix."""
    # Synthetic bright daytime image
    bright_img = np.full((300, 400, 3), 140, dtype=np.uint8)
    feat_bright = extract_image_features(bright_img)
    assert feat_bright.brightness == 140.0
    assert feat_bright.aspect_ratio == 1.33
    assert feat_bright.estimated_condition == "daytime_clear"

    # Synthetic dark nighttime image
    dark_img = np.full((300, 400, 3), 35, dtype=np.uint8)
    feat_dark = extract_image_features(dark_img)
    assert feat_dark.brightness == 35.0
    assert feat_dark.estimated_condition == "nighttime_lowlight"


# ==============================================================================
# 2. Model Registry Endpoints (Section 1)
# ==============================================================================
def test_model_registry_list(client: TestClient) -> None:
    """Validate model registry listing contains production, candidate, and previous versions."""
    res = client.get("/api/v1/drift/registry")
    assert res.status_code == 200
    models = res.json()
    assert isinstance(models, list)
    assert len(models) >= 3

    versions = [m["version"] for m in models]
    assert "v1.2.0-int8" in versions
    assert "v1.1.0-int8" in versions
    assert "v1.3.0-rc1" in versions


def test_model_registry_detail(client: TestClient) -> None:
    """Validate retrieving a specific model's full evaluation and checkpoint profile."""
    res = client.get("/api/v1/drift/registry/v1.2.0-int8")
    assert res.status_code == 200
    data = res.json()
    assert data["version"] == "v1.2.0-int8"
    assert data["deployment_status"] == "PRODUCTION"
    assert data["is_active"] is True
    assert "evaluation_metrics" in data
    assert data["evaluation_metrics"]["mAP50"] >= 0.80


# ==============================================================================
# 3. Model Comparison & Promotion Gate (Section 6)
# ==============================================================================
def test_model_comparison_engine(client: TestClient) -> None:
    """Validate automated model comparison and municipal promotion acceptance gate."""
    payload = {
        "candidate_version": "v1.3.0-rc1",
        "baseline_version": "v1.2.0-int8",
    }
    res = client.post("/api/v1/drift/compare", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert "candidate" in data
    assert "production" in data
    assert "promotion_gate" in data
    gate = data["promotion_gate"]
    assert "is_eligible_for_promotion" in gate
    assert len(gate["checks"]) == 5
    assert gate["is_eligible_for_promotion"] is True


def test_promotion_gate_rejection_on_regression() -> None:
    """Verify that promotion gate strictly blocks candidates that regress on latency or accuracy."""
    profiles = {p.version: p for p in get_default_model_profiles()}
    prod = profiles["v1.2.0-int8"]

    # Create regressed candidate (excessive latency > 75ms)
    regressed_cand = ModelProfile(
        version="v1.4.0-bad",
        model_name="Slow Candidate",
        architecture="YOLOv8s",
        status="CANDIDATE",
        weights_path="none",
        dataset_version="v2.0",
        training_date="2026-11-09",
        training_epochs=50,
        mAP50=0.880,
        mAP50_95=0.810,
        precision=0.85,
        recall=0.91,
        f1_score=0.88,
        per_class_map50={"pothole": 0.92},
        per_class_recall={"pothole": 0.90},
        latency_p50_ms=110.0,
        latency_p95_ms=145.0,  # Fails <= 75ms rule!
        throughput_fps=8.0,
        model_size_mb=21.0,  # Fails <= 10MB rule!
        ram_footprint_mb=320.0,
        nighttime_retention_pct=85.0,
        wet_surface_retention_pct=82.0,
        blur_retention_pct=84.0,
    )

    gate = evaluate_model_promotion(regressed_cand, prod)
    assert gate.is_eligible_for_promotion is False
    assert "failed" in gate.summary.lower()


# ==============================================================================
# 4. Data Drift vs. Concept Drift Distinction (Sections 2 & 3)
# ==============================================================================
def test_unlabeled_data_drift_only(client: TestClient) -> None:
    """Ensure that unlabeled inference data reports input drift only, never claiming concept drift."""
    payload = {
        "model_version": "v1.2.0-int8",
        "dataset_name": "Unlabeled Highway Patrol Stream",
        "include_ground_truth": False,
        "simulate_domain_shift": "nighttime",
        "sample_count": 50,
    }
    res = client.post("/api/v1/drift/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["has_ground_truth"] is False
    # Strict rule: Without ground truth, do NOT claim concept drift
    assert data["concept_drift_detected"] is False
    assert data["map50"] is None
    # But input data distribution shift IS detected!
    assert data["is_input_drift_detected"] is True
    assert data["psi_overall"] >= 0.25


def test_concept_drift_with_ground_truth(client: TestClient) -> None:
    """Validate concept drift calculation when ground-truth evaluation is available."""
    payload = {
        "model_version": "v1.2.0-int8",
        "dataset_name": "Verified Wet Surface Audit Batch",
        "include_ground_truth": True,
        "simulate_domain_shift": "rainy_wet",
        "sample_count": 50,
    }
    res = client.post("/api/v1/drift/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["has_ground_truth"] is True
    assert data["concept_drift_detected"] is True
    assert data["map50"] is not None
    assert data["map50"] < 0.80  # Demonstrates measured performance degradation
    assert len(data["alerts_triggered"]) >= 1
    assert data["retraining_recommendation"] is not None


# ==============================================================================
# 5. Alerts & Remediation Lifecycle (Section 4 & 9)
# ==============================================================================
def test_alerts_listing_and_acknowledgement(client: TestClient) -> None:
    """Validate alert retrieval, filtering, and engineer sign-off."""
    res = client.get("/api/v1/drift/alerts")
    assert res.status_code == 200
    alerts = res.json()
    assert isinstance(alerts, list)
    assert len(alerts) >= 1

    alert_id = alerts[0]["id"]
    # Acknowledge the alert
    ack_payload = {
        "engineer_name": "Senior Municipal Auditor",
        "investigation_notes": "Nighttime headlights adjusted and sensor gain verified.",
    }
    ack_res = client.post(f"/api/v1/drift/alerts/{alert_id}/acknowledge", json=ack_payload)
    assert ack_res.status_code == 200
    ack_data = ack_res.json()
    assert ack_data["is_acknowledged"] is True
    assert ack_data["acknowledged_by"] == "Senior Municipal Auditor"


# ==============================================================================
# 6. Targeted Retraining Governance (Section 7)
# ==============================================================================
def test_retraining_recommendation_and_trigger(client: TestClient) -> None:
    """Validate targeted retraining workflow governance."""
    res = client.get("/api/v1/drift/retraining/recommendations")
    assert res.status_code == 200
    recs = res.json()
    assert len(recs) >= 1

    rec_id = recs[0]["recommendation_id"]
    assert "weak_classes" in recs[0]
    assert "acceptance_criteria" in recs[0]

    # Trigger retraining experiment
    trigger_payload = {
        "recommendation_id": rec_id,
        "dataset_version": "RDD2022-India-v2.2-patch",
        "epochs": 100,
        "engineer_notes": "Validated wet-surface labels on GT Road.",
    }
    trig_res = client.post("/api/v1/drift/retraining/trigger", json=trigger_payload)
    assert trig_res.status_code == 200
    trig_data = trig_res.json()
    assert trig_data["status"] == "RETRAINING_SCHEDULED"


# ==============================================================================
# 7. Environmental Robustness & CSV Export (Sections 5 & 9)
# ==============================================================================
def test_environmental_robustness_matrix(client: TestClient) -> None:
    """Validate multi-domain breakdown across lighting, surface, and cameras."""
    res = client.get("/api/v1/drift/robustness")
    assert res.status_code == 200
    data = res.json()
    assert "environmental" in data
    assert "geographic" in data
    assert "camera_types" in data
    assert "daytime_clear" in data["environmental"]
    assert "nighttime_lowlight" in data["environmental"]


def test_drift_csv_export(client: TestClient) -> None:
    """Validate streaming CSV export of drift and monitoring telemetry."""
    res = client.get("/api/v1/drift/export.csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    lines = res.text.strip().split("\r\n") if "\r\n" in res.text else res.text.strip().split("\n")
    assert len(lines) >= 1
    headers = lines[0].split(",")
    assert "session_id" in headers
    assert "psi_overall" in headers
    assert "input_drift_detected" in headers
