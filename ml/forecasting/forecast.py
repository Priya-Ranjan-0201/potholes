"""Road degradation and deterioration forecasting engine.

Implements SPEC B8 and Rule R6:
- Observations != forecasts: separate schemas and database persistence
- Baseline linear deterioration and weather-adjusted degradation models
- Strict INSUFFICIENT_DATA path when historical observations < 2
- Generates 90% confidence interval bands that widen with projection horizon
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any


@dataclass(frozen=True)
class HorizonPrediction:
    """Forecast prediction for a specific future horizon."""

    horizon_days: int
    target_date: str
    predicted_health_score: float
    confidence_interval_low: float
    confidence_interval_high: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "horizon_days": self.horizon_days,
            "target_date": self.target_date,
            "predicted_health_score": round(self.predicted_health_score, 2),
            "confidence_interval_low": round(self.confidence_interval_low, 2),
            "confidence_interval_high": round(self.confidence_interval_high, 2),
        }


@dataclass(frozen=True)
class RoadForecastResult:
    """Complete forecast result for a road segment."""

    segment_id: str
    status: str  # OK | INSUFFICIENT_DATA
    model_version: str
    predictions: list[HorizonPrediction]
    decay_rate_per_day: float | None
    generated_at: str
    historical_points_count: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "segment_id": self.segment_id,
            "status": self.status,
            "model_version": self.model_version,
            "predictions": [p.to_dict() for p in self.predictions],
            "decay_rate_per_day": (
                round(self.decay_rate_per_day, 4) if self.decay_rate_per_day is not None else None
            ),
            "generated_at": self.generated_at,
            "historical_points_count": self.historical_points_count,
        }


class RoadDegradationForecaster:
    """Forecaster predicting road health decay over 30, 60, and 90 day horizons."""

    def __init__(self, model_version: str = "baseline_linear_v1") -> None:
        self.model_version = model_version
        self.default_horizons = [30, 60, 90]

    def predict_segment_degradation(
        self,
        segment_id: str,
        historical_scores: list[tuple[datetime, float]],
        rainfall_monthly_avg_mm: float = 0.0,
        horizons_days: list[int] | None = None,
    ) -> RoadForecastResult:
        """Forecast future road health for a segment based on historical scores.

        Parameters
        ----------
        segment_id : str
            Identifier of the segment.
        historical_scores : list[tuple[datetime, float]]
            List of (timestamp, health_score) historical observations sorted by date.
        rainfall_monthly_avg_mm : float
            Recent average monthly rainfall in mm affecting moisture distress.
        horizons_days : list[int] | None
            Future horizons in days to forecast (default: [30, 60, 90]).

        Returns
        -------
        RoadForecastResult
            Forecast object or INSUFFICIENT_DATA status if points < 2.
        """
        horizons = horizons_days or self.default_horizons
        now_iso = datetime.now(UTC).isoformat()

        # Rule R6: History too short -> return INSUFFICIENT_DATA
        if len(historical_scores) < 2:
            return RoadForecastResult(
                segment_id=segment_id,
                status="INSUFFICIENT_DATA",
                model_version=self.model_version,
                predictions=[],
                decay_rate_per_day=None,
                generated_at=now_iso,
                historical_points_count=len(historical_scores),
            )

        # Sort by timestamp
        sorted_scores = sorted(historical_scores, key=lambda x: x[0])
        first_time, first_score = sorted_scores[0]
        last_time, last_score = sorted_scores[-1]

        elapsed_days = max(1.0, (last_time - first_time).total_seconds() / 86400.0)
        measured_slope = (last_score - first_score) / elapsed_days

        # Realistic asphalt decay: roads naturally degrade unless maintained
        # Weather distress factor: higher rainfall accelerates decay
        weather_factor = 1.0 + min(1.5, rainfall_monthly_avg_mm / 100.0)
        daily_decay = min(-0.01, measured_slope * weather_factor)

        # Baseline linear projection from last measured health score
        predictions: list[HorizonPrediction] = []
        for h in horizons:
            target_dt = last_time + timedelta(days=h)
            predicted_score = max(5.0, min(100.0, last_score + (daily_decay * h)))

            # 90% confidence intervals widen with horizon distance
            uncertainty_margin = (h / 30.0) * 3.5
            ci_low = max(0.0, round(predicted_score - uncertainty_margin, 2))
            ci_high = min(100.0, round(predicted_score + uncertainty_margin, 2))

            predictions.append(
                HorizonPrediction(
                    horizon_days=h,
                    target_date=target_dt.strftime("%Y-%m-%d"),
                    predicted_health_score=round(predicted_score, 2),
                    confidence_interval_low=ci_low,
                    confidence_interval_high=ci_high,
                )
            )

        return RoadForecastResult(
            segment_id=segment_id,
            status="OK",
            model_version=self.model_version,
            predictions=predictions,
            decay_rate_per_day=daily_decay,
            generated_at=now_iso,
            historical_points_count=len(historical_scores),
        )


forecaster = RoadDegradationForecaster()

