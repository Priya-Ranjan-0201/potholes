"""Citizen report and complaint state machine endpoints (SPEC B7)."""

from __future__ import annotations

import uuid
from datetime import datetime

from backend.app.api.deps import get_current_user, get_optional_user, require_role
from backend.app.db.session import get_db
from backend.app.models.auth import User
from backend.app.models.complaint import (
    CitizenReport,
    Complaint,
    ComplaintStatusHistory,
)
from backend.app.models.defect import Defect
from backend.app.services.dedup import parse_point_wkt
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/reports")

# Allowed state machine transitions (SPEC B7)
VALID_TRANSITIONS: dict[str, list[str]] = {
    "SUBMITTED": ["UNDER_REVIEW", "REJECTED"],
    "UNDER_REVIEW": ["VERIFIED", "REJECTED"],
    "VERIFIED": ["ASSIGNED", "REJECTED"],
    "ASSIGNED": ["IN_PROGRESS", "VERIFIED"],
    "IN_PROGRESS": ["RESOLVED", "ASSIGNED"],
    "RESOLVED": [],  # Terminal state
    "REJECTED": ["UNDER_REVIEW"],  # Can be reopened for review
}


class CreateReportRequest(BaseModel):
    """Citizen damage report creation."""

    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    description: str | None = Field(default=None, max_length=1000)
    media_path: str | None = None
    defect_id: uuid.UUID | None = None


class StatusTransitionRequest(BaseModel):
    """State transition request."""

    new_status: str = Field(
        ..., pattern="^(UNDER_REVIEW|VERIFIED|ASSIGNED|IN_PROGRESS|RESOLVED|REJECTED)$"
    )
    notes: str | None = Field(default=None, max_length=500)
    rejection_reason: str | None = Field(default=None, max_length=255)
    assigned_to_user_id: uuid.UUID | None = None


class StatusHistoryResponse(BaseModel):
    """Status transition audit item."""

    from_status: str
    to_status: str
    changed_by_user_id: uuid.UUID | None
    comment: str | None = None
    created_at: datetime


class ComplaintResponse(BaseModel):
    """Citizen complaint response model."""

    id: uuid.UUID
    citizen_report_id: uuid.UUID
    defect_id: uuid.UUID | None
    status: str
    latitude: float
    longitude: float
    description: str | None
    media_path: str | None
    assigned_to_user_id: uuid.UUID | None
    rejection_reason: str | None
    created_at: datetime
    history: list[StatusHistoryResponse] = Field(default_factory=list)


class ComplaintListResponse(BaseModel):
    """Paginated complaint list."""

    total: int
    items: list[ComplaintResponse]
    limit: int
    offset: int


@router.post(
    "",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit citizen road damage report",
)
async def create_citizen_report(
    req: CreateReportRequest,
    current_user: User | None = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Submit citizen road defect report and initialize complaint in SUBMITTED status."""
    report = CitizenReport(
        reporter_user_id=current_user.id if current_user else None,
        location=f"POINT({req.longitude} {req.latitude})",
        description=req.description,
        media_path=req.media_path,
    )
    db.add(report)
    await db.flush()

    complaint = Complaint(
        citizen_report_id=report.id,
        defect_id=req.defect_id,
        status="SUBMITTED",
    )
    db.add(complaint)
    await db.flush()

    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status="NONE",
        to_status="SUBMITTED",
        changed_by_user_id=current_user.id if current_user else None,
        comment="Initial submission by citizen",
    )
    db.add(history)
    await db.commit()

    return ComplaintResponse(
        id=complaint.id,
        citizen_report_id=report.id,
        defect_id=complaint.defect_id,
        status=complaint.status,
        latitude=req.latitude,
        longitude=req.longitude,
        description=report.description,
        media_path=report.media_path,
        assigned_to_user_id=None,
        rejection_reason=None,
        created_at=complaint.created_at,
        history=[
            StatusHistoryResponse(
                from_status="NONE",
                to_status="SUBMITTED",
                changed_by_user_id=current_user.id if current_user else None,
                comment="Initial submission by citizen",
                created_at=history.created_at,
            )
        ],
    )


@router.get(
    "",
    response_model=ComplaintListResponse,
    summary="List complaints",
)
async def list_complaints(
    status_filter: str | None = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> ComplaintListResponse:
    """List citizen complaints with optional status filtering."""
    stmt = (
        select(Complaint)
        .options(selectinload(Complaint.citizen_report))
        .order_by(desc(Complaint.created_at))
    )
    if status_filter:
        stmt = stmt.where(Complaint.status == status_filter.upper())

    all_complaints = (await db.execute(stmt)).scalars().all()
    total = len(all_complaints)
    paginated = all_complaints[offset : offset + limit]

    items: list[ComplaintResponse] = []
    for c in paginated:
        coords = parse_point_wkt(c.citizen_report.location) if c.citizen_report else None
        lat = coords[0] if coords else 0.0
        lon = coords[1] if coords else 0.0

        items.append(
            ComplaintResponse(
                id=c.id,
                citizen_report_id=c.citizen_report_id,
                defect_id=c.defect_id,
                status=c.status,
                latitude=lat,
                longitude=lon,
                description=c.citizen_report.description if c.citizen_report else None,
                media_path=c.citizen_report.media_path if c.citizen_report else None,
                assigned_to_user_id=c.assigned_to_user_id,
                rejection_reason=c.rejection_reason,
                created_at=c.created_at,
            )
        )

    return ComplaintListResponse(total=total, items=items, limit=limit, offset=offset)


@router.patch(
    "/{complaint_id}/status",
    response_model=ComplaintResponse,
    summary="Transition complaint status (state machine)",
)
async def transition_complaint_status(
    complaint_id: uuid.UUID,
    req: StatusTransitionRequest,
    current_user: User = Depends(require_role(["engineer", "admin"])),
    db: AsyncSession = Depends(get_db),
) -> ComplaintResponse:
    """Execute state machine transition on complaint (Rule B7)."""
    stmt = (
        select(Complaint)
        .options(selectinload(Complaint.citizen_report), selectinload(Complaint.history))
        .where(Complaint.id == complaint_id)
    )
    complaint = (await db.execute(stmt)).scalar_one_or_none()
    if complaint is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    old_status = complaint.status
    target_status = req.new_status.upper()

    allowed_targets = VALID_TRANSITIONS.get(old_status, [])
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Invalid state transition from '{old_status}' to '{target_status}'. "
                f"Allowed transitions: {allowed_targets}"
            ),
        )

    if target_status == "REJECTED" and not req.rejection_reason:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Rejection reason is required when transitioning to REJECTED.",
        )

    complaint.status = target_status
    if req.rejection_reason:
        complaint.rejection_reason = req.rejection_reason
    if req.assigned_to_user_id:
        complaint.assigned_to_user_id = req.assigned_to_user_id

    # If resolved, update linked defect status to REPAIRED
    if target_status == "RESOLVED" and complaint.defect_id:
        def_stmt = select(Defect).where(Defect.id == complaint.defect_id)
        linked_defect = (await db.execute(def_stmt)).scalar_one_or_none()
        if linked_defect:
            linked_defect.status = "REPAIRED"

    history = ComplaintStatusHistory(
        complaint_id=complaint.id,
        from_status=old_status,
        to_status=target_status,
        changed_by_user_id=current_user.id,
        comment=req.notes or f"Transitioned to {target_status}",
    )
    db.add(history)
    await db.commit()

    coords = (
        parse_point_wkt(complaint.citizen_report.location) if complaint.citizen_report else None
    )
    lat = coords[0] if coords else 0.0
    lon = coords[1] if coords else 0.0

    return ComplaintResponse(
        id=complaint.id,
        citizen_report_id=complaint.citizen_report_id,
        defect_id=complaint.defect_id,
        status=complaint.status,
        latitude=lat,
        longitude=lon,
        description=complaint.citizen_report.description if complaint.citizen_report else None,
        media_path=complaint.citizen_report.media_path if complaint.citizen_report else None,
        assigned_to_user_id=complaint.assigned_to_user_id,
        rejection_reason=complaint.rejection_reason,
        created_at=complaint.created_at,
    )
