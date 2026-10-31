"""ScamRoad Severity Scoring Engine.

Adheres strictly to docs/SPEC.md B6 and Rules R5, R6, R7:
- Rule R5: Detection confidence != severity (scored as distinct weighted factor).
- Rule R6: Observations != forecasts (computes empirical instant score from sightings).
- Rule R7: Missing data is NULL, never invented. Renormalizes over available factors.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass
class SeverityInput:
    """Input parameters for road damage severity calculation."""

    class_code: str
    confidence: float
    relative_area: float | None = None  # percentage of road area (e.g., 4.5 for 4.5%)
    times_seen: int = 1
    poi_distance_m: float | None = None
    recent_rainfall_mm: float | None = None
    track_frames: int | None = None


@dataclass
class SeverityFactorDetail:
    """Detailed contribution of a single factor."""

    name: str
    available: bool
    raw_value: float | None
    normalized_value: float
    weight: float
    contribution: float


@dataclass
class SeverityResult:
    """Result of severity evaluation."""

    raw_score: float
    normalized_score: float  # 0.0 to 100.0
    level: str  # Minor | Moderate | Severe | Critical
    factor_breakdown: dict[str, dict[str, Any]]
    missing_factors: list[str]
    needs_human_review: bool
    uncertainty_note: str | None
    recommended_action: str
    sla_hours: int
    weights_version: str


class SeverityEngine:
    """Configurable hybrid severity scoring engine."""

    def __init__(self, config_path: Path | str | None = None) -> None:
        if config_path is None:
            config_path = (
                Path(__file__).resolve().parent.parent / "configs" / "severity_weights.yaml"
            )

        self.config_path = Path(config_path)
        self.weights_version = "1.0.0"
        self.weights: dict[str, float] = {
            "class_base_risk": 0.30,
            "relative_area": 0.25,
            "recurrence_density": 0.15,
            "detection_confidence": 0.10,
            "vulnerable_poi_proximity": 0.10,
            "rainfall_exposure": 0.10,
        }
        self.class_base_risks: dict[str, float] = {
            "POTHOLE": 0.85,
            "CRACK_ALLIGATOR": 0.65,
            "MANHOLE_DAMAGED": 0.75,
            "WATERLOGGING": 0.70,
            "CRACK_TRANS": 0.45,
            "CRACK_LONG": 0.35,
            "EDGE_DAMAGE": 0.40,
            "SURFACE_DETERIORATION": 0.30,
            "SPEEDBREAKER_DAMAGED": 0.50,
            "MARKING_FADED": 0.20,
            "DEFAULT": 0.30,
        }
        self.thresholds: dict[str, Any] = {}
        self.review_triggers: dict[str, Any] = {
            "min_confidence_for_auto": 0.40,
            "min_track_frames_for_auto": 3,
            "high_area_threshold_pct": 15.0,
        }

        self._load_config()

    def _load_config(self) -> None:
        if self.config_path.exists():
            with open(self.config_path, encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
                self.weights_version = str(data.get("version", "1.0.0"))
                if "weights" in data:
                    self.weights = data["weights"]
                if "class_base_risks" in data:
                    self.class_base_risks = data["class_base_risks"]
                if "thresholds" in data:
                    self.thresholds = data["thresholds"]
                if "review_triggers" in data:
                    self.review_triggers = data["review_triggers"]

    def _calc_poi_proximity(self, dist_m: float | None) -> tuple[bool, float]:
        if dist_m is None:
            return False, 0.0
        if dist_m <= 50.0:
            return True, 1.0
        if dist_m <= 150.0:
            return True, 0.7
        if dist_m <= 300.0:
            return True, 0.3
        return True, 0.0

    def _calc_rainfall(self, rain_mm: float | None) -> tuple[bool, float]:
        if rain_mm is None:
            return False, 0.0
        if rain_mm >= 25.0:
            return True, 1.0
        if rain_mm >= 10.0:
            return True, 0.6
        if rain_mm >= 2.0:
            return True, 0.3
        return True, 0.0

    def _check_review_triggers(self, inp: SeverityInput) -> tuple[bool, str | None]:
        review_reasons: list[str] = []
        min_conf = self.review_triggers.get("min_confidence_for_auto", 0.40)
        if inp.confidence < min_conf:
            review_reasons.append(f"Low AI confidence ({inp.confidence:.2f} < {min_conf:.2f})")

        min_frames = self.review_triggers.get("min_track_frames_for_auto", 3)
        if inp.track_frames is not None and inp.track_frames < min_frames:
            review_reasons.append(f"Short track length ({inp.track_frames} frames < {min_frames})")

        high_area = self.review_triggers.get("high_area_threshold_pct", 15.0)
        if inp.relative_area is not None and inp.relative_area >= high_area:
            review_reasons.append(
                f"Exceptionally large damage area ({inp.relative_area:.1f}% >= {high_area:.1f}%)"
            )

        needs_review = len(review_reasons) > 0
        uncertainty = "; ".join(review_reasons) if needs_review else None
        return needs_review, uncertainty

    def compute_severity(self, inp: SeverityInput) -> SeverityResult:
        """Calculate damage severity using available factors and dynamic renormalization."""
        factors: dict[str, SeverityFactorDetail] = {}
        missing: list[str] = []

        # 1. Class Base Hazard
        c_risk = self.class_base_risks.get(
            inp.class_code.upper(), self.class_base_risks.get("DEFAULT", 0.30)
        )
        w_class = self.weights.get("class_base_risk", 0.30)
        factors["class_base_risk"] = SeverityFactorDetail(
            name="class_base_risk",
            available=True,
            raw_value=c_risk,
            normalized_value=c_risk,
            weight=w_class,
            contribution=w_class * c_risk,
        )

        # 2. Relative Area
        w_area = self.weights.get("relative_area", 0.25)
        if inp.relative_area is not None:
            norm_area = min(1.0, max(0.0, inp.relative_area / 10.0))
            factors["relative_area"] = SeverityFactorDetail(
                name="relative_area",
                available=True,
                raw_value=inp.relative_area,
                normalized_value=round(norm_area, 4),
                weight=w_area,
                contribution=w_area * norm_area,
            )
        else:
            missing.append("relative_area")
            factors["relative_area"] = SeverityFactorDetail(
                name="relative_area",
                available=False,
                raw_value=None,
                normalized_value=0.0,
                weight=w_area,
                contribution=0.0,
            )

        # 3. Recurrence / Times Seen
        w_rec = self.weights.get("recurrence_density", 0.15)
        rec_factor = min(1.0, max(0.2, 0.2 * inp.times_seen))
        factors["recurrence_density"] = SeverityFactorDetail(
            name="recurrence_density",
            available=True,
            raw_value=float(inp.times_seen),
            normalized_value=round(rec_factor, 4),
            weight=w_rec,
            contribution=w_rec * rec_factor,
        )

        # 4. Confidence
        w_conf = self.weights.get("detection_confidence", 0.10)
        norm_conf = min(1.0, max(0.0, inp.confidence))
        factors["detection_confidence"] = SeverityFactorDetail(
            name="detection_confidence",
            available=True,
            raw_value=inp.confidence,
            normalized_value=round(norm_conf, 4),
            weight=w_conf,
            contribution=w_conf * norm_conf,
        )

        # 5. POI Proximity
        w_poi = self.weights.get("vulnerable_poi_proximity", 0.10)
        poi_avail, norm_poi = self._calc_poi_proximity(inp.poi_distance_m)
        if not poi_avail:
            missing.append("vulnerable_poi_proximity")
        factors["vulnerable_poi_proximity"] = SeverityFactorDetail(
            name="vulnerable_poi_proximity",
            available=poi_avail,
            raw_value=inp.poi_distance_m,
            normalized_value=norm_poi,
            weight=w_poi,
            contribution=w_poi * norm_poi if poi_avail else 0.0,
        )

        # 6. Rainfall Exposure
        w_rain = self.weights.get("rainfall_exposure", 0.10)
        rain_avail, norm_rain = self._calc_rainfall(inp.recent_rainfall_mm)
        if not rain_avail:
            missing.append("rainfall_exposure")
        factors["rainfall_exposure"] = SeverityFactorDetail(
            name="rainfall_exposure",
            available=rain_avail,
            raw_value=inp.recent_rainfall_mm,
            normalized_value=norm_rain,
            weight=w_rain,
            contribution=w_rain * norm_rain if rain_avail else 0.0,
        )

        # Renormalization over available weights (Rule R7)
        avail_weight = sum(f.weight for f in factors.values() if f.available)
        raw_weighted = sum(f.contribution for f in factors.values() if f.available)
        score = round(100.0 * (raw_weighted / avail_weight), 2) if avail_weight > 0 else 0.0
        score = min(100.0, max(0.0, score))

        level, sla_hours, action = self._categorize_level(score)
        needs_review, uncertainty = self._check_review_triggers(inp)

        breakdown = {
            name: {
                "available": f.available,
                "raw_value": f.raw_value,
                "normalized_value": f.normalized_value,
                "weight": f.weight,
                "contribution": round(f.contribution, 4),
            }
            for name, f in factors.items()
        }

        return SeverityResult(
            raw_score=round(raw_weighted, 4),
            normalized_score=score,
            level=level,
            factor_breakdown=breakdown,
            missing_factors=missing,
            needs_human_review=needs_review,
            uncertainty_note=uncertainty,
            recommended_action=action,
            sla_hours=sla_hours,
            weights_version=self.weights_version,
        )

    def _categorize_level(self, score: float) -> tuple[str, int, str]:
        if score <= 25.0:
            return "Minor", 168, "Routine monitoring / scheduled patch"
        if score <= 50.0:
            return "Moderate", 72, "Cold mix / asphalt fill in next maintenance run"
        if score <= 75.0:
            return "Severe", 24, "Immediate hot-mix repair / traffic warning marker"
        return "Critical", 6, "Emergency closure / barricade & rapid remediation"
