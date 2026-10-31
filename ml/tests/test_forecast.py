"""Unit tests for Road Degradation Forecasting and Road Health Index calculation."""

from datetime import UTC, datetime, timedelta

from ml.forecasting.forecast import RoadDegradationForecaster
from ml.forecasting.health_index import (
    SegmentHealthResult,
    compute_length_weighted_rollup,
    compute_segment_health,
)


def test_forecast_returns_insufficient_data_when_history_too_short() -> None:
    """Rule R6: Observations != forecasts.

    History < 2 points must return INSUFFICIENT_DATA.
    """
    forecaster = RoadDegradationForecaster()

    # 0 historical points
    res0 = forecaster.predict_segment_degradation("seg-001", [])
    assert res0.status == "INSUFFICIENT_DATA"
    assert len(res0.predictions) == 0

    # 1 historical point
    now = datetime.now(UTC)
    res1 = forecaster.predict_segment_degradation("seg-001", [(now, 85.0)])
    assert res1.status == "INSUFFICIENT_DATA"
    assert len(res1.predictions) == 0


def test_forecast_generates_widening_confidence_intervals() -> None:
    """Confidence intervals must widen as projection horizon increases."""
    forecaster = RoadDegradationForecaster()
    t0 = datetime.now(UTC) - timedelta(days=60)
    t1 = datetime.now(UTC)

    # Historical degradation from 90 to 82 over 60 days
    history = [(t0, 90.0), (t1, 82.0)]
    result = forecaster.predict_segment_degradation("seg-002", history)

    assert result.status == "OK"
    assert len(result.predictions) == 3  # 30, 60, 90 days

    p30, p60, p90 = result.predictions
    # Condition should decay over time
    assert p30.predicted_health_score > p60.predicted_health_score
    assert p60.predicted_health_score > p90.predicted_health_score

    # Interval width (high - low) must increase with horizon
    width_30 = p30.confidence_interval_high - p30.confidence_interval_low
    width_60 = p60.confidence_interval_high - p60.confidence_interval_low
    width_90 = p90.confidence_interval_high - p90.confidence_interval_low

    assert width_60 > width_30
    assert width_90 > width_60


def test_compute_segment_health_bounded_and_calibrated() -> None:
    """SPEC B8: RHI bounded between 0 and 100."""
    defects = [
        {"severity_score": 85.0, "class_code": "POTHOLE"},
        {"severity_score": 60.0, "class_code": "CRACK_LONG"},
    ]
    res = compute_segment_health("seg-003", defects, length_km=0.5, has_recent_inspection=True)

    assert res.score is not None
    assert 0.0 <= res.score <= 100.0
    assert res.coverage_status == "ADEQUATE"
    assert res.defect_count == 2
    assert res.defect_density_per_km == 4.0  # 2 / 0.5


def test_compute_segment_health_uninspected_returns_none() -> None:
    """Rule R7: Uninspected segment returns score=None, never synthetic score."""
    res = compute_segment_health("seg-004", [], length_km=1.0, has_recent_inspection=False)

    assert res.score is None
    assert res.coverage_status == "NO_INSPECTION"


def test_compute_length_weighted_rollup() -> None:
    """Rollup averages are correctly weighted by segment length in km."""
    r1 = SegmentHealthResult(
        "s1",
        score=80.0,
        coverage_status="ADEQUATE",
        defect_count=1,
        defect_density_per_km=1.0,
        length_km=1.0,
        confidence=0.8,
    )
    r2 = SegmentHealthResult(
        "s2",
        score=60.0,
        coverage_status="ADEQUATE",
        defect_count=3,
        defect_density_per_km=3.0,
        length_km=3.0,
        confidence=0.8,
    )

    # Weighted: (80*1 + 60*3) / (1 + 3) = (80 + 180) / 4 = 260 / 4 = 65.0
    avg_score, count, total_km = compute_length_weighted_rollup([r1, r2])
    assert avg_score == 65.0
    assert count == 2
    assert total_km == 4.0
