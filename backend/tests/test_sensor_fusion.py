"""Unit tests for edge/agent/sensor_fusion.py (Phase 6 COULD: Sensor Fusion Lite)."""

import pytest
from edge.agent.sensor_fusion import BumpDetector, ImuReading, SensorFusionMatcher


def test_bump_detector_baseline_and_spike() -> None:
    """Test that stable 1g gravity does not trigger bump, but sudden vertical shock does."""
    detector = BumpDetector(bump_threshold_mps2=12.0)

    # 1. Warm up baseline with smooth driving (~9.81 m/s^2)
    for i in range(20):
        reading = ImuReading(timestamp_s=i * 0.05, ax=0.1, ay=0.0, az=9.81)
        bump = detector.process_reading(reading)
        assert bump is None, "Smooth road should not trigger bump"

    # 2. Inject vertical shock (pothole wheel impact: 28.5 m/s^2)
    shock_reading = ImuReading(timestamp_s=1.05, ax=0.5, ay=-1.2, az=28.5)
    bump = detector.process_reading(shock_reading)
    assert bump is not None, "Violent vertical shock should trigger bump event"
    assert bump.severity_hint == "Critical"
    assert bump.delta_z_mps2 > 18.0


def test_sensor_fusion_matching() -> None:
    """Test matching between forward camera pothole detection and wheel impact."""
    detector = BumpDetector(bump_threshold_mps2=12.0)
    matcher = SensorFusionMatcher(time_window_s=1.5)

    # Simulate bump at t = 2.45s
    detector.process_reading(ImuReading(timestamp_s=0.0, ax=0.0, ay=0.0, az=9.81))
    detector.process_reading(ImuReading(timestamp_s=1.0, ax=0.0, ay=0.0, az=9.81))
    bump = detector.process_reading(ImuReading(timestamp_s=2.45, ax=0.2, ay=-0.5, az=25.0))
    assert bump is not None

    # Detections:
    # 1. Camera saw pothole at t = 2.0s (0.45s lookahead) -> should agree
    # 2. Camera saw crack at t = 10.0s -> no bump -> should not agree
    detections = [
        {"id": "det_pothole_1", "timestamp_s": 2.0, "class_code": "POTHOLE"},
        {"id": "det_crack_2", "timestamp_s": 10.0, "class_code": "CRACK_LONG"},
    ]

    results = matcher.cross_validate(detections, detector.bumps)
    assert len(results) == 2
    assert results[0].agreed is True
    assert results[0].matched_bump is not None
    assert results[0].temporal_delta_s == 0.45
    assert results[1].agreed is False
    assert results[1].matched_bump is None

