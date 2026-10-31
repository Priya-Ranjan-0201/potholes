"""Backend Severity Service connecting ORM models to ML Severity Engine."""

from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from backend.app.models.defect import Defect, SeverityAssessment

from ml.severity.engine import SeverityEngine, SeverityInput, SeverityResult

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


class SeverityService:
    """Calculates and persists defect severity assessments."""

    def __init__(self, engine: SeverityEngine | None = None) -> None:
        self.engine = engine or SeverityEngine()

    def evaluate(
        self,
        class_code: str,
        confidence: float,
        relative_area: float | None = None,
        times_seen: int = 1,
        poi_distance_m: float | None = None,
        recent_rainfall_mm: float | None = None,
        track_frames: int | None = None,
    ) -> SeverityResult:
        """Evaluate damage severity synchronously."""
        inp = SeverityInput(
            class_code=class_code,
            confidence=confidence,
            relative_area=relative_area,
            times_seen=times_seen,
            poi_distance_m=poi_distance_m,
            recent_rainfall_mm=recent_rainfall_mm,
            track_frames=track_frames,
        )
        return self.engine.compute_severity(inp)

    async def assess_and_record(
        self,
        session: AsyncSession,
        defect: Defect,
        confidence: float,
        relative_area: float | None = None,
        track_frames: int | None = None,
        poi_distance_m: float | None = None,
        recent_rainfall_mm: float | None = None,
        source: str = "auto",
        assessed_by: uuid.UUID | None = None,
    ) -> tuple[SeverityAssessment, SeverityResult]:
        """Compute severity score and persist new SeverityAssessment record."""
        result = self.evaluate(
            class_code=defect.class_code,
            confidence=confidence,
            relative_area=relative_area,
            times_seen=defect.times_seen,
            poi_distance_m=poi_distance_m,
            recent_rainfall_mm=recent_rainfall_mm,
            track_frames=track_frames,
        )

        assessment = SeverityAssessment(
            defect_id=defect.id,
            raw_score=result.raw_score,
            normalized_score=result.normalized_score,
            level=result.level,
            factor_breakdown=result.factor_breakdown,
            missing_factors=result.missing_factors,
            uncertainty_note=result.uncertainty_note,
            needs_human_review=result.needs_human_review,
            source=source,
            assessed_by=assessed_by,
        )

        session.add(assessment)
        return assessment, result
