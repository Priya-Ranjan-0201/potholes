"""Analytics, municipal dashboards, and aggregation endpoints (Rule R1).

Every number returned is calculated directly from persistent database records.
No mock values, no fabricated metrics (Rule R1).
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from backend.app.db.session import get_db
from backend.app.models.complaint import Complaint
from backend.app.models.defect import Defect, DefectObservation, RoadHealthScore, SeverityAssessment
from backend.app.models.geo import Road, RoadSegment, Ward
from backend.app.models.maintenance import BudgetAllocation, Contractor, RepairRecord, WorkOrder
from backend.app.schemas.stats import (
    ContractorStatsResponse,
    DailyTrendItem,
    StatsOverviewResponse,
    TrendsResponse,
    WardStatsResponse,
)
from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.get(
    "/overview",
    response_model=StatsOverviewResponse,
    summary="City-wide road damage overview metrics",
    tags=["Analytics & Statistics"],
)
async def get_stats_overview(
    db: AsyncSession = Depends(get_db),
) -> StatsOverviewResponse:
    """Retrieve city-wide aggregates across defects, complaints, work orders, and road health."""
    # Defect status counts
    defect_status_stmt = select(Defect.status, func.count(Defect.id)).group_by(Defect.status)
    defect_status_res = (await db.execute(defect_status_stmt)).all()
    defects_by_status = dict(defect_status_res)

    total_defects = sum(defects_by_status.values())
    open_defects = sum(
        defects_by_status.get(s, 0) for s in ["ACTIVE", "TRIAGED", "IN_PROGRESS", "UNDER_REPAIR"]
    )
    repaired_defects = defects_by_status.get("REPAIRED", 0)

    # Defect class counts
    defect_class_stmt = select(Defect.class_code, func.count(Defect.id)).group_by(Defect.class_code)
    defect_class_res = (await db.execute(defect_class_stmt)).all()
    defects_by_class = dict(defect_class_res)

    # Defect severity counts
    severity_stmt = select(SeverityAssessment.level, func.count(SeverityAssessment.id)).group_by(
        SeverityAssessment.level
    )
    severity_res = (await db.execute(severity_stmt)).all()
    defects_by_severity = dict(severity_res)
    critical_defects = defects_by_severity.get("Critical", 0)

    # Complaints counts
    complaint_status_stmt = select(Complaint.status, func.count(Complaint.id)).group_by(
        Complaint.status
    )
    complaint_status_res = (await db.execute(complaint_status_stmt)).all()
    complaints_by_status = dict(complaint_status_res)
    total_complaints = sum(complaints_by_status.values())

    # Work orders counts
    wo_status_stmt = select(WorkOrder.status, func.count(WorkOrder.id)).group_by(WorkOrder.status)
    wo_status_res = (await db.execute(wo_status_stmt)).all()
    work_orders_by_status = dict(wo_status_res)
    total_work_orders = sum(work_orders_by_status.values())

    # Road segments count & health index average
    road_count_stmt = select(func.count(RoadSegment.id))
    total_roads = (await db.execute(road_count_stmt)).scalar() or 0

    avg_health_stmt = select(func.avg(RoadHealthScore.score))
    avg_health = (await db.execute(avg_health_stmt)).scalar()
    avg_health_float = round(float(avg_health), 1) if avg_health is not None else None

    return StatsOverviewResponse(
        total_defects=total_defects,
        open_defects=open_defects,
        repaired_defects=repaired_defects,
        critical_defects=critical_defects,
        defects_by_severity=defects_by_severity,
        defects_by_status=defects_by_status,
        defects_by_class=defects_by_class,
        total_complaints=total_complaints,
        complaints_by_status=complaints_by_status,
        total_work_orders=total_work_orders,
        work_orders_by_status=work_orders_by_status,
        total_roads_monitored=total_roads,
        average_road_health_index=avg_health_float,
    )


@router.get(
    "/wards",
    response_model=list[WardStatsResponse],
    summary="Ward-level road damage and budget statistics",
    tags=["Analytics & Statistics"],
)
async def get_ward_stats(
    db: AsyncSession = Depends(get_db),
) -> list[WardStatsResponse]:
    """Aggregate defect counts, critical severity, road health, and budget per municipal ward."""
    ward_stmt = select(Ward).order_by(Ward.ward_number)
    wards = (await db.execute(ward_stmt)).scalars().all()

    response: list[WardStatsResponse] = []
    for w in wards:
        # Defects belonging to roads in this ward
        def_stmt = (
            select(
                func.count(Defect.id),
                func.count(Defect.id).filter(Defect.status == "REPAIRED"),
            )
            .join(RoadSegment, Defect.road_segment_id == RoadSegment.id)
            .join(Road, RoadSegment.road_id == Road.id)
            .where(Road.ward_id == w.id)
        )
        total_def, repaired_def = (await db.execute(def_stmt)).one()

        # Critical defects in ward
        crit_stmt = (
            select(func.count(Defect.id))
            .join(RoadSegment, Defect.road_segment_id == RoadSegment.id)
            .join(Road, RoadSegment.road_id == Road.id)
            .join(SeverityAssessment, SeverityAssessment.defect_id == Defect.id)
            .where(Road.ward_id == w.id, SeverityAssessment.level == "Critical")
        )
        crit_def = (await db.execute(crit_stmt)).scalar() or 0

        # Ward budget
        budget_stmt = (
            select(BudgetAllocation)
            .where(BudgetAllocation.ward_id == w.id)
            .order_by(desc(BudgetAllocation.created_at))
        )
        budget = (await db.execute(budget_stmt)).scalars().first()

        response.append(
            WardStatsResponse(
                ward_id=w.id,
                ward_name=w.name,
                ward_code=f"W-{w.ward_number:02d}",
                total_defects=total_def or 0,
                critical_defects=crit_def or 0,
                repaired_defects=repaired_def or 0,
                allocated_budget=budget.allocated_amount if budget else 0.0,
                spent_budget=budget.spent_amount if budget else 0.0,
                average_road_health=None,
            )
        )

    return response


@router.get(
    "/contractors",
    response_model=list[ContractorStatsResponse],
    summary="Contractor workload and SLA compliance",
    tags=["Analytics & Statistics"],
)
async def get_contractor_stats(
    db: AsyncSession = Depends(get_db),
) -> list[ContractorStatsResponse]:
    """Retrieve performance and SLA delivery metrics for all contractors."""
    contractor_stmt = select(Contractor).order_by(Contractor.name)
    contractors = (await db.execute(contractor_stmt)).scalars().all()

    response: list[ContractorStatsResponse] = []
    for c in contractors:
        wo_stmt = select(
            func.count(WorkOrder.id),
            func.count(WorkOrder.id).filter(WorkOrder.status.in_(["COMPLETED", "VERIFIED"])),
            func.count(WorkOrder.id).filter(WorkOrder.status == "VERIFIED"),
        ).where(WorkOrder.contractor_id == c.id)

        assigned, completed, verified = (await db.execute(wo_stmt)).one()
        compliance_pct = (
            round((completed / assigned * 100.0), 1) if assigned and assigned > 0 else None
        )

        response.append(
            ContractorStatsResponse(
                contractor_id=c.id,
                contractor_name=c.name,
                total_assigned=assigned or 0,
                total_completed=completed or 0,
                total_verified=verified or 0,
                sla_compliance_rate_pct=compliance_pct,
            )
        )

    return response


@router.get(
    "/trends",
    response_model=TrendsResponse,
    summary="Daily observation, complaint, and repair trends",
    tags=["Analytics & Statistics"],
)
async def get_trends(
    days: int = Query(default=14, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
) -> TrendsResponse:
    """Time-series trends over the preceding N days."""
    today = datetime.now(UTC).date()
    start_date = today - timedelta(days=days - 1)

    items: list[DailyTrendItem] = []
    for d in range(days):
        current_day = start_date + timedelta(days=d)
        day_start = datetime(
            current_day.year, current_day.month, current_day.day, 0, 0, 0, tzinfo=UTC
        )
        day_end = day_start + timedelta(days=1)

        obs_stmt = select(func.count(DefectObservation.id)).where(
            DefectObservation.created_at >= day_start, DefectObservation.created_at < day_end
        )
        obs_count = (await db.execute(obs_stmt)).scalar() or 0

        comp_stmt = select(func.count(Complaint.id)).where(
            Complaint.created_at >= day_start, Complaint.created_at < day_end
        )
        comp_count = (await db.execute(comp_stmt)).scalar() or 0

        repair_stmt = select(func.count(RepairRecord.id)).where(
            RepairRecord.created_at >= day_start, RepairRecord.created_at < day_end
        )
        repair_count = (await db.execute(repair_stmt)).scalar() or 0

        items.append(
            DailyTrendItem(
                date=current_day.isoformat(),
                observations_count=obs_count,
                complaints_count=comp_count,
                repairs_count=repair_count,
            )
        )

    return TrendsResponse(days=days, trends=items)
