"""Pydantic schemas for municipal dashboard analytics and reporting."""

from __future__ import annotations

import uuid

from pydantic import BaseModel


class StatsOverviewResponse(BaseModel):
    """City-wide operational metrics."""

    total_defects: int
    open_defects: int
    repaired_defects: int
    critical_defects: int
    defects_by_severity: dict[str, int]
    defects_by_status: dict[str, int]
    defects_by_class: dict[str, int]
    total_complaints: int
    complaints_by_status: dict[str, int]
    total_work_orders: int
    work_orders_by_status: dict[str, int]
    total_roads_monitored: int
    average_road_health_index: float | None = None


class WardStatsResponse(BaseModel):
    """Ward-level health, defects, and budget allocation metrics."""

    ward_id: uuid.UUID
    ward_name: str
    ward_code: str | None = None
    total_defects: int
    critical_defects: int
    repaired_defects: int
    allocated_budget: float = 0.0
    spent_budget: float = 0.0
    average_road_health: float | None = None


class ContractorStatsResponse(BaseModel):
    """Contractor SLA compliance and workload metrics."""

    contractor_id: uuid.UUID
    contractor_name: str
    total_assigned: int
    total_completed: int
    total_verified: int
    sla_compliance_rate_pct: float | None = None


class DailyTrendItem(BaseModel):
    """Daily time-series observation and repair record count."""

    date: str
    observations_count: int
    complaints_count: int
    repairs_count: int


class TrendsResponse(BaseModel):
    """Time-series trends."""

    days: int
    trends: list[DailyTrendItem]
