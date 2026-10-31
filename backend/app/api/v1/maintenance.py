"""Maintenance, contractor management, SLA policies, and repair verification endpoints.

Strictly enforces Rule R8: AI repair verification is advisory; a human engineer/admin
must make the final verification decision.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from backend.app.api.deps import require_role
from backend.app.db.session import get_db
from backend.app.models.auth import User
from backend.app.models.defect import Defect
from backend.app.models.maintenance import (
    Contractor,
    RepairRecord,
    RepairVerification,
    SlaPolicy,
    WorkOrder,
    WorkOrderHistory,
)
from backend.app.schemas.maintenance import (
    ContractorCreate,
    ContractorResponse,
    RepairRecordCreate,
    RepairRecordResponse,
    RepairVerificationCreate,
    RepairVerificationResponse,
    SlaPolicyCreate,
    SlaPolicyResponse,
    WorkOrderCreate,
    WorkOrderHistoryItem,
    WorkOrderListResponse,
    WorkOrderResponse,
    WorkOrderStatusTransition,
)
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

WORK_ORDER_VALID_TRANSITIONS: dict[str, list[str]] = {
    "CREATED": ["ASSIGNED", "CANCELLED"],
    "ASSIGNED": ["IN_PROGRESS", "CREATED", "CANCELLED"],
    "IN_PROGRESS": ["COMPLETED", "ASSIGNED"],
    "COMPLETED": ["VERIFIED", "IN_PROGRESS"],
    "VERIFIED": [],
    "CANCELLED": [],
}


# ==========================================
# Contractors
# ==========================================
@router.get(
    "/contractors",
    response_model=list[ContractorResponse],
    summary="List registered contractors",
    tags=["Maintenance & Work Orders"],
)
async def list_contractors(
    active_only: bool = Query(default=True),
    db: AsyncSession = Depends(get_db),
) -> list[ContractorResponse]:
    """Retrieve list of road repair contractors."""
    stmt = select(Contractor).order_by(Contractor.name)
    if active_only:
        stmt = stmt.where(Contractor.is_active.is_(True))
    result = await db.execute(stmt)
    contractors = result.scalars().all()
    return [
        ContractorResponse(
            id=c.id,
            name=c.name,
            contact_person=c.contact_person,
            phone=c.phone,
            email=c.email,
            is_active=c.is_active,
            created_at=c.created_at,
        )
        for c in contractors
    ]


@router.post(
    "/contractors",
    response_model=ContractorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new contractor",
    tags=["Maintenance & Work Orders"],
)
async def create_contractor(
    req: ContractorCreate,
    current_user: User = Depends(require_role(["engineer", "admin"])),
    db: AsyncSession = Depends(get_db),
) -> ContractorResponse:
    """Register a road repair contractor."""
    contractor = Contractor(
        name=req.name,
        contact_person=req.contact_person,
        phone=req.phone,
        email=req.email,
        is_active=req.is_active,
    )
    db.add(contractor)
    await db.commit()
    await db.refresh(contractor)
    return ContractorResponse(
        id=contractor.id,
        name=contractor.name,
        contact_person=contractor.contact_person,
        phone=contractor.phone,
        email=contractor.email,
        is_active=contractor.is_active,
        created_at=contractor.created_at,
    )


# ==========================================
# SLA Policies
# ==========================================
@router.get(
    "/sla-policies",
    response_model=list[SlaPolicyResponse],
    summary="List SLA policies",
    tags=["Maintenance & Work Orders"],
)
async def list_sla_policies(
    db: AsyncSession = Depends(get_db),
) -> list[SlaPolicyResponse]:
    """List service level agreements specifying resolution timeframes."""
    stmt = select(SlaPolicy).order_by(SlaPolicy.severity_level)
    result = await db.execute(stmt)
    policies = result.scalars().all()
    return [
        SlaPolicyResponse(
            id=p.id,
            name=p.name,
            severity_level=p.severity_level,
            max_resolution_hours=p.max_resolution_hours,
            created_at=p.created_at,
        )
        for p in policies
    ]


@router.post(
    "/sla-policies",
    response_model=SlaPolicyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create an SLA policy",
    tags=["Maintenance & Work Orders"],
)
async def create_sla_policy(
    req: SlaPolicyCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
) -> SlaPolicyResponse:
    """Create SLA resolution timeframe policy."""
    policy = SlaPolicy(
        name=req.name,
        severity_level=req.severity_level,
        max_resolution_hours=req.max_resolution_hours,
    )
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return SlaPolicyResponse(
        id=policy.id,
        name=policy.name,
        severity_level=policy.severity_level,
        max_resolution_hours=policy.max_resolution_hours,
        created_at=policy.created_at,
    )


# ==========================================
# Work Orders
# ==========================================
@router.post(
    "/work-orders",
    response_model=WorkOrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new maintenance work order",
    tags=["Maintenance & Work Orders"],
)
async def create_work_order(
    req: WorkOrderCreate,
    current_user: User = Depends(require_role(["engineer", "admin"])),
    db: AsyncSession = Depends(get_db),
) -> WorkOrderResponse:
    """Dispatch a new work order for a verified defect."""
    # Verify defect exists
    defect_stmt = select(Defect).where(Defect.id == req.defect_id)
    defect = (await db.execute(defect_stmt)).scalar_one_or_none()
    if defect is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Defect not found")

    deadline = req.deadline
    if deadline is None and req.sla_policy_id:
        sla_stmt = select(SlaPolicy).where(SlaPolicy.id == req.sla_policy_id)
        sla = (await db.execute(sla_stmt)).scalar_one_or_none()
        if sla:
            deadline = datetime.now(UTC) + timedelta(hours=sla.max_resolution_hours)

    initial_status = "ASSIGNED" if req.contractor_id else "CREATED"

    work_order = WorkOrder(
        defect_id=req.defect_id,
        contractor_id=req.contractor_id,
        sla_policy_id=req.sla_policy_id,
        priority=req.priority,
        status=initial_status,
        estimated_cost=req.estimated_cost,
        deadline=deadline,
    )
    db.add(work_order)
    await db.flush()

    history = WorkOrderHistory(
        work_order_id=work_order.id,
        from_status="NONE",
        to_status=initial_status,
        changed_by_user_id=current_user.id,
        notes="Work order created",
    )
    db.add(history)

    # Update defect status to TRIAGED or IN_PROGRESS
    defect.status = "TRIAGED" if initial_status == "CREATED" else "IN_PROGRESS"

    await db.commit()
    await db.refresh(work_order)

    return WorkOrderResponse(
        id=work_order.id,
        defect_id=work_order.defect_id,
        contractor_id=work_order.contractor_id,
        sla_policy_id=work_order.sla_policy_id,
        priority=work_order.priority,
        status=work_order.status,
        estimated_cost=work_order.estimated_cost,
        deadline=work_order.deadline,
        created_at=work_order.created_at,
        history=[
            WorkOrderHistoryItem(
                id=history.id,
                from_status=history.from_status,
                to_status=history.to_status,
                changed_by_user_id=history.changed_by_user_id,
                notes=history.notes,
                created_at=history.created_at,
            )
        ],
    )


@router.get(
    "/work-orders",
    response_model=WorkOrderListResponse,
    summary="List work orders",
    tags=["Maintenance & Work Orders"],
)
async def list_work_orders(
    status_filter: str | None = Query(default=None, alias="status"),
    contractor_id: uuid.UUID | None = Query(default=None),
    priority: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> WorkOrderListResponse:
    """Paginated work orders listing with filtering."""
    stmt = select(WorkOrder).order_by(desc(WorkOrder.created_at))
    if status_filter:
        stmt = stmt.where(WorkOrder.status == status_filter.upper())
    if contractor_id:
        stmt = stmt.where(WorkOrder.contractor_id == contractor_id)
    if priority:
        stmt = stmt.where(WorkOrder.priority == priority.upper())

    all_orders = (await db.execute(stmt)).scalars().all()
    total = len(all_orders)
    paginated = all_orders[offset : offset + limit]

    items = [
        WorkOrderResponse(
            id=wo.id,
            defect_id=wo.defect_id,
            contractor_id=wo.contractor_id,
            sla_policy_id=wo.sla_policy_id,
            priority=wo.priority,
            status=wo.status,
            estimated_cost=wo.estimated_cost,
            deadline=wo.deadline,
            created_at=wo.created_at,
        )
        for wo in paginated
    ]

    return WorkOrderListResponse(total=total, items=items, limit=limit, offset=offset)


@router.get(
    "/work-orders/{work_order_id}",
    response_model=WorkOrderResponse,
    summary="Get work order details",
    tags=["Maintenance & Work Orders"],
)
async def get_work_order(
    work_order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> WorkOrderResponse:
    """Retrieve complete work order record with history, repair records, and verification."""
    stmt = select(WorkOrder).where(WorkOrder.id == work_order_id)
    wo = (await db.execute(stmt)).scalar_one_or_none()
    if wo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")

    hist_stmt = (
        select(WorkOrderHistory)
        .where(WorkOrderHistory.work_order_id == wo.id)
        .order_by(WorkOrderHistory.created_at)
    )
    history_rows = (await db.execute(hist_stmt)).scalars().all()

    repair_stmt = (
        select(RepairRecord)
        .where(RepairRecord.work_order_id == wo.id)
        .order_by(desc(RepairRecord.created_at))
    )
    repair = (await db.execute(repair_stmt)).scalars().first()

    verification: RepairVerification | None = None
    if repair:
        verif_stmt = (
            select(RepairVerification)
            .where(RepairVerification.repair_record_id == repair.id)
            .order_by(desc(RepairVerification.created_at))
        )
        verification = (await db.execute(verif_stmt)).scalars().first()

    return WorkOrderResponse(
        id=wo.id,
        defect_id=wo.defect_id,
        contractor_id=wo.contractor_id,
        sla_policy_id=wo.sla_policy_id,
        priority=wo.priority,
        status=wo.status,
        estimated_cost=wo.estimated_cost,
        deadline=wo.deadline,
        created_at=wo.created_at,
        history=[
            WorkOrderHistoryItem(
                id=h.id,
                from_status=h.from_status,
                to_status=h.to_status,
                changed_by_user_id=h.changed_by_user_id,
                notes=h.notes,
                created_at=h.created_at,
            )
            for h in history_rows
        ],
        repair_record=(
            RepairRecordResponse(
                id=repair.id,
                work_order_id=repair.work_order_id,
                repaired_at=repair.repaired_at,
                materials_used=repair.materials_used,
                actual_cost=repair.actual_cost,
                before_media_id=repair.before_media_id,
                after_media_id=repair.after_media_id,
                created_at=repair.created_at,
            )
            if repair
            else None
        ),
        verification=(
            RepairVerificationResponse(
                id=verification.id,
                repair_record_id=verification.repair_record_id,
                ai_damage_reduction_pct=verification.ai_damage_reduction_pct,
                ai_recommendation=verification.ai_recommendation,
                human_decision=verification.human_decision,
                decision_reason=verification.decision_reason,
                verified_by_user_id=verification.verified_by_user_id,
                created_at=verification.created_at,
            )
            if verification
            else None
        ),
    )


@router.patch(
    "/work-orders/{work_order_id}/status",
    response_model=WorkOrderResponse,
    summary="Transition work order status",
    tags=["Maintenance & Work Orders"],
)
async def transition_work_order_status(
    work_order_id: uuid.UUID,
    req: WorkOrderStatusTransition,
    current_user: User = Depends(require_role(["engineer", "contractor", "admin"])),
    db: AsyncSession = Depends(get_db),
) -> WorkOrderResponse:
    """Execute status transition on work order."""
    stmt = select(WorkOrder).where(WorkOrder.id == work_order_id)
    wo = (await db.execute(stmt)).scalar_one_or_none()
    if wo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")

    old_status = wo.status
    target_status = req.new_status.upper()

    allowed = WORK_ORDER_VALID_TRANSITIONS.get(old_status, [])
    if target_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Invalid transition from '{old_status}' to '{target_status}'. "
                f"Allowed: {allowed}"
            ),
        )

    # Note: Transition to VERIFIED cannot be done directly via status patch;
    # must use /verify endpoint (Rule R8)
    if target_status == "VERIFIED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Transition to VERIFIED requires human engineer sign-off "
                "via POST /api/v1/work-orders/{id}/verify (Rule R8)"
            ),
        )

    wo.status = target_status
    if req.contractor_id:
        wo.contractor_id = req.contractor_id

    # If in progress, update defect to IN_PROGRESS
    if target_status == "IN_PROGRESS":
        def_stmt = select(Defect).where(Defect.id == wo.defect_id)
        defect = (await db.execute(def_stmt)).scalar_one_or_none()
        if defect:
            defect.status = "IN_PROGRESS"

    history = WorkOrderHistory(
        work_order_id=wo.id,
        from_status=old_status,
        to_status=target_status,
        changed_by_user_id=current_user.id,
        notes=req.notes or f"Transitioned to {target_status}",
    )
    db.add(history)
    await db.commit()
    await db.refresh(wo)

    return await get_work_order(wo.id, db)


@router.post(
    "/work-orders/{work_order_id}/repair",
    response_model=RepairRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit repair completion report",
    tags=["Maintenance & Work Orders"],
)
async def submit_repair_record(
    work_order_id: uuid.UUID,
    req: RepairRecordCreate,
    current_user: User = Depends(require_role(["contractor", "engineer", "admin"])),
    db: AsyncSession = Depends(get_db),
) -> RepairRecordResponse:
    """Submit documented repair completion details by contractor."""
    stmt = select(WorkOrder).where(WorkOrder.id == work_order_id)
    wo = (await db.execute(stmt)).scalar_one_or_none()
    if wo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")

    repair_record = RepairRecord(
        work_order_id=wo.id,
        repaired_at=req.repaired_at or datetime.now(UTC),
        materials_used=req.materials_used,
        actual_cost=req.actual_cost,
        before_media_id=req.before_media_id,
        after_media_id=req.after_media_id,
    )
    db.add(repair_record)

    # Transition work order status to COMPLETED
    old_status = wo.status
    wo.status = "COMPLETED"

    history = WorkOrderHistory(
        work_order_id=wo.id,
        from_status=old_status,
        to_status="COMPLETED",
        changed_by_user_id=current_user.id,
        notes="Repair submitted by contractor. Pending municipal verification.",
    )
    db.add(history)
    await db.commit()
    await db.refresh(repair_record)

    return RepairRecordResponse(
        id=repair_record.id,
        work_order_id=repair_record.work_order_id,
        repaired_at=repair_record.repaired_at,
        materials_used=repair_record.materials_used,
        actual_cost=repair_record.actual_cost,
        before_media_id=repair_record.before_media_id,
        after_media_id=repair_record.after_media_id,
        created_at=repair_record.created_at,
    )


@router.post(
    "/work-orders/{work_order_id}/verify",
    response_model=RepairVerificationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Authoritative repair verification sign-off (Rule R8)",
    tags=["Maintenance & Work Orders"],
)
async def verify_repair(
    work_order_id: uuid.UUID,
    req: RepairVerificationCreate,
    current_user: User = Depends(require_role(["engineer", "admin"])),
    db: AsyncSession = Depends(get_db),
) -> RepairVerificationResponse:
    """Human engineer/admin authoritatively approves or rejects repair completion (Rule R8).

    AI recommendation is advisory; AI never closes work orders on its own.
    """
    stmt = select(WorkOrder).where(WorkOrder.id == work_order_id)
    wo = (await db.execute(stmt)).scalar_one_or_none()
    if wo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Work order not found")

    # Fetch latest repair record
    repair_stmt = (
        select(RepairRecord)
        .where(RepairRecord.work_order_id == wo.id)
        .order_by(desc(RepairRecord.created_at))
    )
    repair = (await db.execute(repair_stmt)).scalars().first()
    if repair is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot verify work order with no submitted repair record.",
        )

    verification = RepairVerification(
        repair_record_id=repair.id,
        ai_damage_reduction_pct=req.ai_damage_reduction_pct,
        ai_recommendation=req.ai_recommendation,
        human_decision=req.human_decision,
        decision_reason=req.decision_reason,
        verified_by_user_id=current_user.id,
    )
    db.add(verification)

    old_status = wo.status
    if req.human_decision == "APPROVED":
        wo.status = "VERIFIED"
        def_stmt = select(Defect).where(Defect.id == wo.defect_id)
        defect = (await db.execute(def_stmt)).scalar_one_or_none()
        if defect:
            defect.status = "REPAIRED"

        notes = f"Repair verified and approved by {current_user.full_name}: {req.decision_reason}"
    else:
        # Rejected: revert to IN_PROGRESS so contractor fixes deficiencies
        wo.status = "IN_PROGRESS"
        name = current_user.full_name
        notes = f"Repair rejected by {name}: {req.decision_reason}. Returned to contractor."

    history = WorkOrderHistory(
        work_order_id=wo.id,
        from_status=old_status,
        to_status=wo.status,
        changed_by_user_id=current_user.id,
        notes=notes,
    )
    db.add(history)
    await db.commit()
    await db.refresh(verification)

    return RepairVerificationResponse(
        id=verification.id,
        repair_record_id=verification.repair_record_id,
        ai_damage_reduction_pct=verification.ai_damage_reduction_pct,
        ai_recommendation=verification.ai_recommendation,
        human_decision=verification.human_decision,
        decision_reason=verification.decision_reason,
        verified_by_user_id=verification.verified_by_user_id,
        created_at=verification.created_at,
    )
