"""Forecast and Road Health Index API endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from backend.app.db.session import get_db
from backend.app.models.defect import Defect, RoadHealthScore
from backend.app.models.geo import RoadSegment
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ml.forecasting.forecast import forecaster
from ml.forecasting.health_index import compute_segment_health

router = APIRouter()


class HorizonPredictionResponse(BaseModel):
    horizon_days: int
    target_date: str
    predicted_health_score: float
    confidence_interval_low: float
    confidence_interval_high: float


class ForecastResponse(BaseModel):
    segment_id: str
    status: str
    model_version: str
    predictions: list[HorizonPredictionResponse]
    decay_rate_per_day: float | None
    generated_at: str
    historical_points_count: int


class RoadHealthScoreResponse(BaseModel):
    segment_id: str
    score: float | None
    coverage_status: str
    defect_count: int
    defect_density_per_km: float
    length_km: float
    confidence: float
    method_version: str


@router.get(
    "/forecasts/{segment_id}",
    response_model=ForecastResponse,
    summary="Retrieve road degradation forecast",
    description=(
        "Forecasts future road health over 30, 60, 90-day horizons. "
        "Returns INSUFFICIENT_DATA if history < 2 points (Rule R6)."
    ),
)
async def get_segment_forecast(
    segment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Retrieve or compute road degradation forecast for a road segment."""
    # Verify segment exists
    seg = await db.get(RoadSegment, segment_id)
    if not seg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Road segment not found")

    # Fetch historical health scores from DB
    stmt = (
        select(RoadHealthScore)
        .where(RoadHealthScore.segment_id == segment_id)
        .order_by(RoadHealthScore.period_start.asc())
    )
    res = await db.execute(stmt)
    records = res.scalars().all()

    historical_tuples: list[tuple[datetime, float]] = [
        (rec.period_start, rec.score) for rec in records
    ]

    # Compute forecast via forecaster engine
    result = forecaster.predict_segment_degradation(
        segment_id=str(segment_id),
        historical_scores=historical_tuples,
        rainfall_monthly_avg_mm=15.0,
    )

    return result.to_dict()


@router.get(
    "/health-index/{segment_id}",
    response_model=RoadHealthScoreResponse,
    summary="Compute live Road Health Index",
    description="Computes RHI score (0-100) based on confirmed defect severity and density per km.",
)
async def get_segment_health_index(
    segment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """Compute live Road Health Index for a segment."""
    seg = await db.get(RoadSegment, segment_id)
    if not seg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Road segment not found")

    # Count defects on this segment
    stmt = select(Defect).where(Defect.road_segment_id == segment_id, Defect.status == "ACTIVE")
    res = await db.execute(stmt)
    defects = res.scalars().all()

    defects_data = [{"severity_score": d.severity_score} for d in defects]
    length_km = float(seg.length_m) / 1000.0 if seg.length_m else 0.5

    result = compute_segment_health(
        segment_id=str(segment_id),
        defects=defects_data,
        length_km=length_km,
        has_recent_inspection=True,
    )

    return result.to_dict()
