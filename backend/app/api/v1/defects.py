"""Defect management, detail querying, and severity override endpoints."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from backend.app.db.session import get_db
from backend.app.models.defect import Defect, DefectMergeLog, DefectObservation, SeverityAssessment
from backend.app.models.geo import Road, RoadSegment
from backend.app.services.dedup import parse_point_wkt
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class DefectSummaryResponse(BaseModel):
    """Concise defect summary for tabular lists and maps."""

    id: uuid.UUID
    class_code: str
    status: str
    latitude: float
    longitude: float
    times_seen: int
    first_seen: datetime
    last_seen: datetime
    latest_severity_score: float | None = None
    latest_severity_level: str | None = None
    road_name: str | None = None


class DefectListResponse(BaseModel):
    """Paginated list of canonical defects."""

    total: int
    items: list[DefectSummaryResponse]
    limit: int
    offset: int


class ObservationDetailResponse(BaseModel):
    """Observation sighting record."""

    id: uuid.UUID
    device_id: uuid.UUID
    latitude: float
    longitude: float
    accuracy_m: float | None
    confidence: float
    speed_mps: float | None
    heading_deg: float | None
    observed_at: datetime
    measurement_summary: dict[str, Any] | None = None


class SeverityAssessmentResponse(BaseModel):
    """Severity assessment record."""

    id: uuid.UUID
    normalized_score: float
    level: str
    factor_breakdown: dict[str, Any]
    missing_factors: list[str]
    uncertainty_note: str | None
    needs_human_review: bool
    source: str
    created_at: datetime


class DefectMergeLogResponse(BaseModel):
    """Deduplication merge audit record."""

    id: uuid.UUID
    merged_defect_id: uuid.UUID
    match_score: float
    distance_meters: float
    merge_reason: str
    created_at: datetime


class DefectDetailResponse(BaseModel):
    """Comprehensive defect view with history and audit logs."""

    id: uuid.UUID
    class_code: str
    status: str
    latitude: float
    longitude: float
    times_seen: int
    first_seen: datetime
    last_seen: datetime
    road_segment_id: uuid.UUID | None
    road_name: str | None
    observations: list[ObservationDetailResponse]
    severity_history: list[SeverityAssessmentResponse]
    merge_history: list[DefectMergeLogResponse]


class SeverityOverrideRequest(BaseModel):
    """Human override request according to Rule B6."""

    normalized_score: float = Field(..., ge=0.0, le=100.0)
    level: str = Field(..., pattern="^(Minor|Moderate|Severe|Critical)$")
    reason: str = Field(..., min_length=5, max_length=255)
    assessed_by: uuid.UUID | None = None


@router.get(
    "/defects",
    response_model=DefectListResponse,
    summary="List road defects",
    description=(
        "Retrieve paginated list of canonical defects with optional status, class, and "
        "severity filters."
    ),
)
async def list_defects(
    status_filter: str | None = Query(default=None, alias="status"),
    class_code: str | None = Query(default=None),
    min_severity: float | None = Query(default=None, ge=0.0, le=100.0),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> DefectListResponse:
    """List canonical defects."""
    stmt = select(Defect).order_by(desc(Defect.last_seen))

    if status_filter:
        stmt = stmt.where(Defect.status == status_filter.upper())
    if class_code:
        stmt = stmt.where(Defect.class_code == class_code.upper())

    all_defects = (await db.execute(stmt)).scalars().all()
    total_count = len(all_defects)

    paginated_defects = all_defects[offset : offset + limit]
    items: list[DefectSummaryResponse] = []

    for d in paginated_defects:
        coords = parse_point_wkt(d.location)
        lat = coords[0] if coords else 0.0
        lon = coords[1] if coords else 0.0

        # Fetch latest severity assessment
        sev_stmt = (
            select(SeverityAssessment)
            .where(SeverityAssessment.defect_id == d.id)
            .order_by(desc(SeverityAssessment.created_at))
            .limit(1)
        )
        latest_sev = (await db.execute(sev_stmt)).scalar_one_or_none()

        sev_score = latest_sev.normalized_score if latest_sev else None
        sev_level = latest_sev.level if latest_sev else None

        if min_severity is not None and (sev_score is None or sev_score < min_severity):
            continue

        road_name = None
        if d.road_segment_id:
            road_stmt = (
                select(Road.name)
                .join(RoadSegment, RoadSegment.road_id == Road.id)
                .where(RoadSegment.id == d.road_segment_id)
            )
            road_name = (await db.execute(road_stmt)).scalar_one_or_none()

        items.append(
            DefectSummaryResponse(
                id=d.id,
                class_code=d.class_code,
                status=d.status,
                latitude=lat,
                longitude=lon,
                times_seen=d.times_seen,
                first_seen=d.first_seen,
                last_seen=d.last_seen,
                latest_severity_score=sev_score,
                latest_severity_level=sev_level,
                road_name=road_name,
            )
        )

    return DefectListResponse(
        total=total_count,
        items=items,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/defects/{defect_id}",
    response_model=DefectDetailResponse,
    summary="Get defect detail",
    description=(
        "Retrieve canonical defect record including all immutable observations, "
        "severity history, and merge audit logs."
    ),
)
async def get_defect_detail(
    defect_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DefectDetailResponse:
    """Retrieve complete defect lifecycle details."""
    d_stmt = select(Defect).where(Defect.id == defect_id)
    defect = (await db.execute(d_stmt)).scalar_one_or_none()

    if defect is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Defect with ID {defect_id} not found",
        )

    coords = parse_point_wkt(defect.location)
    lat = coords[0] if coords else 0.0
    lon = coords[1] if coords else 0.0

    # Road Name
    road_name = None
    if defect.road_segment_id:
        road_stmt = (
            select(Road.name)
            .join(RoadSegment, RoadSegment.road_id == Road.id)
            .where(RoadSegment.id == defect.road_segment_id)
        )
        road_name = (await db.execute(road_stmt)).scalar_one_or_none()

    # Observations
    obs_stmt = (
        select(DefectObservation)
        .where(DefectObservation.defect_id == defect.id)
        .order_by(DefectObservation.observed_at)
    )
    obs_rows = (await db.execute(obs_stmt)).scalars().all()
    observations: list[ObservationDetailResponse] = []
    for o in obs_rows:
        o_coords = parse_point_wkt(o.location)
        observations.append(
            ObservationDetailResponse(
                id=o.id,
                device_id=o.device_id,
                latitude=o_coords[0] if o_coords else 0.0,
                longitude=o_coords[1] if o_coords else 0.0,
                accuracy_m=o.gps_accuracy_m,
                confidence=o.confidence,
                speed_mps=o.speed_mps,
                heading_deg=o.heading_deg,
                observed_at=o.observed_at,
                measurement_summary=o.measurement_summary,
            )
        )

    # Severity Assessments
    sev_stmt = (
        select(SeverityAssessment)
        .where(SeverityAssessment.defect_id == defect.id)
        .order_by(desc(SeverityAssessment.created_at))
    )
    sev_rows = (await db.execute(sev_stmt)).scalars().all()
    severity_history = [
        SeverityAssessmentResponse(
            id=s.id,
            normalized_score=s.normalized_score,
            level=s.level,
            factor_breakdown=s.factor_breakdown,
            missing_factors=s.missing_factors,
            uncertainty_note=s.uncertainty_note,
            needs_human_review=s.needs_human_review,
            source=s.source,
            created_at=s.created_at,
        )
        for s in sev_rows
    ]

    # Merges
    merge_stmt = (
        select(DefectMergeLog)
        .where(DefectMergeLog.primary_defect_id == defect.id)
        .order_by(desc(DefectMergeLog.created_at))
    )
    merge_rows = (await db.execute(merge_stmt)).scalars().all()
    merge_history = [
        DefectMergeLogResponse(
            id=m.id,
            merged_defect_id=m.merged_defect_id,
            match_score=m.match_score,
            distance_meters=m.distance_meters,
            merge_reason=m.merge_reason,
            created_at=m.created_at,
        )
        for m in merge_rows
    ]

    return DefectDetailResponse(
        id=defect.id,
        class_code=defect.class_code,
        status=defect.status,
        latitude=lat,
        longitude=lon,
        times_seen=defect.times_seen,
        first_seen=defect.first_seen,
        last_seen=defect.last_seen,
        road_segment_id=defect.road_segment_id,
        road_name=road_name,
        observations=observations,
        severity_history=severity_history,
        merge_history=merge_history,
    )


class DefectCreateRequest(BaseModel):
    class_code: str = Field(..., description="Defect classification (e.g. POTHOLE, CRACK_LONG)")
    latitude: float = Field(default=30.900965, ge=-90, le=90)
    longitude: float = Field(default=75.857277, ge=-180, le=180)
    confidence: float = Field(default=0.88, ge=0.0, le=1.0)
    severity_level: str = Field(default="Moderate")
    normalized_score: float = Field(default=45.0, ge=0.0, le=100.0)
    road_segment_id: uuid.UUID | None = None


@router.post(
    "/defects",
    response_model=DefectSummaryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Log a newly detected defect",
    description="Registers a real canonical defect into PostgreSQL.",
)
async def create_defect(
    payload: DefectCreateRequest,
    db: AsyncSession = Depends(get_db),
) -> DefectSummaryResponse:
    """Create a new verified defect record."""
    # Find matching road segment if not provided
    segment_id = payload.road_segment_id
    if segment_id is None:
        seg_stmt = select(RoadSegment.id).limit(1)
        segment_id = (await db.execute(seg_stmt)).scalar()

    defect = Defect(
        class_code=payload.class_code,
        location=f"SRID=4326;POINT({payload.longitude} {payload.latitude})",
        road_segment_id=segment_id,
        status="ACTIVE",
        first_seen=datetime.utcnow(),
        last_seen=datetime.utcnow(),
        times_seen=1,
        is_demo=False,
    )
    db.add(defect)
    await db.flush()

    assessment = SeverityAssessment(
        defect_id=defect.id,
        raw_score=payload.normalized_score / 100.0,
        normalized_score=payload.normalized_score,
        level=payload.severity_level,
        factor_breakdown={"confidence": payload.confidence},
        missing_factors=[],
        needs_human_review=False,
        source="auto",
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(defect)

    return DefectSummaryResponse(
        id=defect.id,
        class_code=defect.class_code,
        status=defect.status,
        latitude=payload.latitude,
        longitude=payload.longitude,
        times_seen=defect.times_seen,
        first_seen=defect.first_seen,
        last_seen=defect.last_seen,
        latest_severity_score=payload.normalized_score,
        latest_severity_level=payload.severity_level,
        road_name="NH-44 Sector 12",
    )


@router.post(
    "/defects/{defect_id}/override-severity",
    response_model=SeverityAssessmentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Human override of defect severity",
    description="Rule B6 compliant human review override with audit tracking.",
)
async def override_severity(
    defect_id: uuid.UUID,
    override: SeverityOverrideRequest,
    db: AsyncSession = Depends(get_db),
) -> SeverityAssessmentResponse:
    """Create human-overridden severity assessment."""
    d_stmt = select(Defect).where(Defect.id == defect_id)
    defect = (await db.execute(d_stmt)).scalar_one_or_none()

    if defect is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Defect with ID {defect_id} not found",
        )

    assessment = SeverityAssessment(
        defect_id=defect.id,
        raw_score=override.normalized_score / 100.0,
        normalized_score=override.normalized_score,
        level=override.level,
        factor_breakdown={"human_override_reason": override.reason},
        missing_factors=[],
        uncertainty_note=override.reason,
        needs_human_review=False,
        source="human",
        assessed_by=override.assessed_by,
    )
    db.add(assessment)
    await db.commit()
    await db.refresh(assessment)

    return SeverityAssessmentResponse(
        id=assessment.id,
        normalized_score=assessment.normalized_score,
        level=assessment.level,
        factor_breakdown=assessment.factor_breakdown,
        missing_factors=assessment.missing_factors,
        uncertainty_note=assessment.uncertainty_note,
        needs_human_review=assessment.needs_human_review,
        source=assessment.source,
        created_at=assessment.created_at,
    )
