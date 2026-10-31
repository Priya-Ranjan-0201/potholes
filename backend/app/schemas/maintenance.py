"""Pydantic schemas for maintenance, contractors, SLA policies, and work orders."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# Contractor Schemas
class ContractorCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    contact_person: str | None = Field(default=None, max_length=100)
    phone: str = Field(..., min_length=5, max_length=50)
    email: str | None = Field(default=None, max_length=255)
    is_active: bool = True


class ContractorResponse(BaseModel):
    id: uuid.UUID
    name: str
    contact_person: str | None = None
    phone: str
    email: str | None = None
    is_active: bool
    created_at: datetime


# SLA Policy Schemas
class SlaPolicyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    severity_level: str = Field(..., pattern="^(Minor|Moderate|Severe|Critical)$")
    max_resolution_hours: int = Field(..., gt=0)


class SlaPolicyResponse(BaseModel):
    id: uuid.UUID
    name: str
    severity_level: str
    max_resolution_hours: int
    created_at: datetime


# Work Order Schemas
class WorkOrderCreate(BaseModel):
    defect_id: uuid.UUID
    contractor_id: uuid.UUID | None = None
    sla_policy_id: uuid.UUID | None = None
    priority: str = Field(default="MEDIUM", pattern="^(LOW|MEDIUM|HIGH|CRITICAL)$")
    estimated_cost: float | None = Field(default=None, ge=0.0)
    deadline: datetime | None = None


class WorkOrderStatusTransition(BaseModel):
    new_status: str = Field(
        ...,
        pattern="^(CREATED|ASSIGNED|IN_PROGRESS|COMPLETED|VERIFIED|CANCELLED)$",
    )
    notes: str | None = Field(default=None, max_length=255)
    contractor_id: uuid.UUID | None = None


class WorkOrderHistoryItem(BaseModel):
    id: uuid.UUID
    from_status: str
    to_status: str
    changed_by_user_id: uuid.UUID | None = None
    notes: str | None = None
    created_at: datetime


class RepairRecordCreate(BaseModel):
    repaired_at: datetime | None = None
    materials_used: str | None = None
    actual_cost: float | None = Field(default=None, ge=0.0)
    before_media_id: uuid.UUID | None = None
    after_media_id: uuid.UUID | None = None


class RepairRecordResponse(BaseModel):
    id: uuid.UUID
    work_order_id: uuid.UUID
    repaired_at: datetime
    materials_used: str | None = None
    actual_cost: float | None = None
    before_media_id: uuid.UUID | None = None
    after_media_id: uuid.UUID | None = None
    created_at: datetime


class RepairVerificationCreate(BaseModel):
    ai_damage_reduction_pct: float = Field(..., ge=0.0, le=100.0)
    ai_recommendation: str = Field(..., pattern="^(PASS|FAIL|UNCERTAIN)$")
    human_decision: str = Field(..., pattern="^(APPROVED|REJECTED)$")
    decision_reason: str = Field(..., min_length=3, max_length=255)


class RepairVerificationResponse(BaseModel):
    id: uuid.UUID
    repair_record_id: uuid.UUID
    ai_damage_reduction_pct: float
    ai_recommendation: str
    human_decision: str | None = None
    decision_reason: str | None = None
    verified_by_user_id: uuid.UUID | None = None
    created_at: datetime


class WorkOrderResponse(BaseModel):
    id: uuid.UUID
    defect_id: uuid.UUID
    contractor_id: uuid.UUID | None = None
    sla_policy_id: uuid.UUID | None = None
    priority: str
    status: str
    estimated_cost: float | None = None
    deadline: datetime | None = None
    created_at: datetime
    history: list[WorkOrderHistoryItem] = Field(default_factory=list)
    repair_record: RepairRecordResponse | None = None
    verification: RepairVerificationResponse | None = None


class WorkOrderListResponse(BaseModel):
    total: int
    items: list[WorkOrderResponse]
    limit: int
    offset: int

