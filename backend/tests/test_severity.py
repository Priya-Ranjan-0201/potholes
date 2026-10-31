"""Unit tests for ScamRoad severity engine and factor calculations."""

from __future__ import annotations

import pytest

from ml.severity.engine import SeverityEngine, SeverityInput


@pytest.fixture
def engine() -> SeverityEngine:
    """Fixture providing SeverityEngine instance."""
    return SeverityEngine()


def test_severity_all_factors_present(engine: SeverityEngine) -> None:
    """Test severity scoring when all environmental and detection factors are available."""
    inp = SeverityInput(
        class_code="POTHOLE",
        confidence=0.90,
        relative_area=8.0,  # 8% of road ROI
        times_seen=4,
        poi_distance_m=40.0,  # near school
        recent_rainfall_mm=20.0,
        track_frames=6,
    )
    res = engine.compute_severity(inp)

    assert 70.0 <= res.normalized_score <= 100.0
    assert res.level in ("Severe", "Critical")
    assert len(res.missing_factors) == 0
    assert not res.needs_human_review
    assert res.uncertainty_note is None
    assert "class_base_risk" in res.factor_breakdown
    assert res.factor_breakdown["class_base_risk"]["available"] is True


def test_severity_missing_factors_renormalization(engine: SeverityEngine) -> None:
    """Test Rule R7: Missing data is NULL, never invented. Formula renormalizes over available."""
    inp_missing = SeverityInput(
        class_code="POTHOLE",
        confidence=0.85,
        relative_area=None,  # Missing
        times_seen=1,
        poi_distance_m=None,  # Missing
        recent_rainfall_mm=None,  # Missing
        track_frames=5,
    )
    res = engine.compute_severity(inp_missing)

    assert "relative_area" in res.missing_factors
    assert "vulnerable_poi_proximity" in res.missing_factors
    assert "rainfall_exposure" in res.missing_factors
    assert len(res.missing_factors) == 3

    # Check breakdown records missing factors honestly
    assert res.factor_breakdown["relative_area"]["available"] is False
    assert res.factor_breakdown["relative_area"]["raw_value"] is None

    # Score should still be validly normalized between 0 and 100
    assert 0.0 <= res.normalized_score <= 100.0


def test_severity_levels_and_thresholds(engine: SeverityEngine) -> None:
    """Test categorization into Minor, Moderate, Severe, Critical levels."""
    # Minor: Low hazard class, low confidence, small
    minor_inp = SeverityInput(
        class_code="MARKING_FADED",
        confidence=0.50,
        relative_area=0.2,
        times_seen=1,
    )
    minor_res = engine.compute_severity(minor_inp)
    assert minor_res.level == "Minor"
    assert minor_res.normalized_score <= 25.0

    # Critical: Massive pothole, repeated sightings, rainy near school
    crit_inp = SeverityInput(
        class_code="POTHOLE",
        confidence=0.98,
        relative_area=12.0,
        times_seen=6,
        poi_distance_m=20.0,
        recent_rainfall_mm=30.0,
    )
    crit_res = engine.compute_severity(crit_inp)
    assert crit_res.level == "Critical"
    assert crit_res.normalized_score > 75.0


def test_severity_monotonicity_with_area(engine: SeverityEngine) -> None:
    """Test that larger defect area monotonically produces equal or higher severity."""
    inp_small = SeverityInput(class_code="POTHOLE", confidence=0.8, relative_area=2.0)
    inp_large = SeverityInput(class_code="POTHOLE", confidence=0.8, relative_area=9.0)

    res_small = engine.compute_severity(inp_small)
    res_large = engine.compute_severity(inp_large)

    assert res_large.normalized_score >= res_small.normalized_score


def test_human_review_triggers(engine: SeverityEngine) -> None:
    """Test Rule B6: Low confidence flags needs_human_review without distorting score."""
    # Low confidence (< 0.40)
    low_conf_inp = SeverityInput(
        class_code="POTHOLE",
        confidence=0.30,
        track_frames=5,
    )
    res = engine.compute_severity(low_conf_inp)
    assert res.needs_human_review is True
    assert "Low AI confidence" in (res.uncertainty_note or "")

    # Short track length (< 3 frames)
    short_track_inp = SeverityInput(
        class_code="POTHOLE",
        confidence=0.85,
        track_frames=1,
    )
    res_short = engine.compute_severity(short_track_inp)
    assert res_short.needs_human_review is True
    assert "Short track length" in (res_short.uncertainty_note or "")
