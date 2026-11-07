"""Sensor Fusion Lite (Experimental).

Implements windowed vertical acceleration thresholding for smartphone / dashcam IMU
and temporal cross-validation with computer vision road defect detections.

Rule R1 / R7: Marked EXPERIMENTAL. Real field drives must be recorded before claiming
calibrated sensor fusion accuracy (queued in docs/HUMAN_TODO.md).
"""

from __future__ import annotations

from dataclasses import dataclass
import math
from typing import Any


@dataclass
class ImuReading:
    """Raw 3-axis accelerometer reading with timestamp."""

    timestamp_s: float
    ax: float  # m/s^2 (lateral)
    ay: float  # m/s^2 (longitudinal)
    az: float  # m/s^2 (vertical, includes gravity ~9.81 m/s^2)


@dataclass
class BumpEvent:
    """Detected mechanical road disturbance."""

    timestamp_s: float
    peak_accel_mps2: float
    delta_z_mps2: float
    duration_ms: float
    severity_hint: str  # Moderate, Severe, Critical


@dataclass
class FusionMatchResult:
    """Cross-validation output between vision detection and mechanical bump."""

    detection_id: str
    class_code: str
    detection_timestamp_s: float
    matched_bump: BumpEvent | None
    temporal_delta_s: float | None
    agreed: bool


class BumpDetector:
    """Windowed vertical-acceleration threshold bump detector.

    Maintains an exponential moving average (EMA) baseline of vertical acceleration
    to cancel gravity and vehicle pitch, then triggers when absolute vertical delta
    exceeds a calibrated threshold.
    """

    def __init__(
        self,
        baseline_alpha: float = 0.05,
        bump_threshold_mps2: float = 12.0,  # ~1.22g disturbance
        min_bump_separation_s: float = 0.35,
    ) -> None:
        self.alpha = baseline_alpha
        self.threshold = bump_threshold_mps2
        self.min_separation = min_bump_separation_s
        self.baseline_z: float | None = None
        self.last_bump_time: float = -1.0
        self.bumps: list[BumpEvent] = []

    def process_reading(self, reading: ImuReading) -> BumpEvent | None:
        """Process a single IMU reading and return BumpEvent if a spike is detected."""
        if self.baseline_z is None:
            self.baseline_z = reading.az
            return None

        # Compute delta against steady baseline BEFORE updating baseline
        delta_z = abs(reading.az - self.baseline_z)

        # Do not corrupt the steady-state road baseline with an outlier shock
        if delta_z < self.threshold:
            self.baseline_z = (1.0 - self.alpha) * self.baseline_z + self.alpha * reading.az

        if delta_z >= self.threshold:
            # Check minimum temporal separation to avoid multi-counting a single pothole rim
            if (reading.timestamp_s - self.last_bump_time) >= self.min_separation:
                self.last_bump_time = reading.timestamp_s

                # Classify bump severity hint based on vertical disturbance delta
                if delta_z >= 15.0:  # >1.5g violent shock
                    hint = "Critical"
                elif delta_z >= 10.0:  # >1.0g severe shock
                    hint = "Severe"
                else:
                    hint = "Moderate"

                bump = BumpEvent(
                    timestamp_s=reading.timestamp_s,
                    peak_accel_mps2=reading.az,
                    delta_z_mps2=delta_z,
                    duration_ms=60.0,
                    severity_hint=hint,
                )
                self.bumps.append(bump)
                return bump

        return None


class SensorFusionMatcher:
    """Cross-correlates vision detections with IMU mechanical bumps.

    Potholes captured by the forward camera precede mechanical wheel impact by:
      delta_t = distance_to_pothole / vehicle_speed
    At 40 km/h (11.1 m/s) with a 5m camera lookahead:
      delta_t ~ 5.0 / 11.1 ~ 0.45 seconds.
    A symmetric or lookahead window of [-0.5s, +2.0s] accommodates varied vehicle speeds.
    """

    def __init__(self, time_window_s: float = 1.5) -> None:
        self.time_window = time_window_s

    def cross_validate(
        self,
        detections: list[dict[str, Any]],
        bumps: list[BumpEvent],
    ) -> list[FusionMatchResult]:
        """Correlate a list of detections with detected bumps."""
        results: list[FusionMatchResult] = []

        for det in detections:
            det_id = str(det.get("id", "det_unknown"))
            det_time = float(det.get("timestamp_s", 0.0))
            class_code = str(det.get("class_code", "POTHOLE"))

            # Find closest bump within window
            best_bump: BumpEvent | None = None
            min_delta: float = float("inf")

            for bump in bumps:
                delta = abs(bump.timestamp_s - det_time)
                if delta <= self.time_window and delta < min_delta:
                    min_delta = delta
                    best_bump = bump

            matched = best_bump is not None
            results.append(
                FusionMatchResult(
                    detection_id=det_id,
                    class_code=class_code,
                    detection_timestamp_s=det_time,
                    matched_bump=best_bump,
                    temporal_delta_s=round(min_delta, 3) if matched else None,
                    agreed=matched,
                )
            )

        return results
