"""ScamRoad Health Index (RHI) Calculation Engine.

Implements SPEC B8 & Rules R4, R6, R7:
- Segment-level health score: 100 - min(100, sum(severity_weight * density))
- Length-weighted rollup across road networks and wards
- Missing or insufficient coverage returns score=None (Rule R7: never invent data)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class SegmentHealthResult:
    """Calculated Road Health Index result for a road segment."""

    segment_id: str
    score: float | None
    coverage_status: str  # ADEQUATE | INSUFFICIENT_COVERAGE | NO_INSPECTION
    defect_count: int
    defect_density_per_km: float
    length_km: float
    confidence: float
    method_version: str = "rhi_v1.0"

    def to_dict(self) -> dict[str, Any]:
        return {
            "segment_id": self.segment_id,
            "score": round(self.score, 2) if self.score is not None else None,
            "coverage_status": self.coverage_status,
            "defect_count": self.defect_count,
            "defect_density_per_km": round(self.defect_density_per_km, 3),
            "length_km": round(self.length_km, 3),
            "confidence": round(self.confidence, 2),
            "method_version": self.method_version,
        }


def compute_segment_health(
    segment_id: str,
    defects: list[dict[str, Any]],
    length_km: float,
    has_recent_inspection: bool = True,
    min_length_km: float = 0.05,
) -> SegmentHealthResult:
    """Calculate the ScamRoad Health Index for a road segment.

    Parameters
    ----------
    segment_id : str
        Identifier of the road segment.
    defects : list[dict[str, Any]]
        List of confirmed active defects on this segment, each with 'severity_score'
        or 'severity_base'.
    length_km : float
        Segment length in kilometers.
    has_recent_inspection : bool
        Whether this segment has been surveyed within the valid inspection window.
    min_length_km : float
        Minimum valid length threshold to avoid division by zero.

    Returns
    -------
    SegmentHealthResult
        Calculated score or None if coverage is insufficient.
    """
    if not has_recent_inspection:
        return SegmentHealthResult(
            segment_id=segment_id,
            score=None,
            coverage_status="NO_INSPECTION",
            defect_count=len(defects),
            defect_density_per_km=0.0,
            length_km=max(min_length_km, length_km),
            confidence=0.0,
        )

    effective_length = max(min_length_km, length_km)
    defect_count = len(defects)
    density_per_km = defect_count / effective_length

    # Sum of severity impacts normalized by density
    total_penalty = 0.0
    for defect in defects:
        # severity_score is 0-100; normalize to 0-1 weight
        sev = float(defect.get("severity_score", defect.get("severity_base", 50.0)))
        total_penalty += sev * (1.0 / effective_length) * 0.15

    clamped_penalty = min(100.0, total_penalty)
    health_score = max(0.0, round(100.0 - clamped_penalty, 2))

    # Confidence depends on inspection sample density
    confidence = min(1.0, round(0.5 + 0.1 * min(5, defect_count), 2))

    return SegmentHealthResult(
        segment_id=segment_id,
        score=health_score,
        coverage_status="ADEQUATE",
        defect_count=defect_count,
        defect_density_per_km=density_per_km,
        length_km=effective_length,
        confidence=confidence,
    )


def compute_length_weighted_rollup(
    results: list[SegmentHealthResult],
) -> tuple[float | None, int, float]:
    """Calculate the length-weighted average Road Health Index across segments.

    Returns
    -------
    tuple[float | None, int, float]
        (weighted_average_score, total_evaluated_segments, total_km)
    """
    valid_results = [r for r in results if r.score is not None and r.length_km > 0]
    if not valid_results:
        return None, 0, 0.0

    total_weighted_score = sum(r.score * r.length_km for r in valid_results if r.score is not None)
    total_length = sum(r.length_km for r in valid_results)

    if total_length == 0:
        return None, 0, 0.0

    weighted_average = round(total_weighted_score / total_length, 2)
    return weighted_average, len(valid_results), round(total_length, 2)
