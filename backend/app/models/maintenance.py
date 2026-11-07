"""Contractor, work orders, repair records, and advisory AI verification models."""

import uuid
from datetime import datetime

from backend.app.models.base import Base, TimestampMixin, UUIDMixin
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column


class Contractor(Base, UUIDMixin, TimestampMixin):
    """External or municipal road repair contractors."""

    __tablename__ = "contractors"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class SlaPolicy(Base, UUIDMixin, TimestampMixin):
    """Service level agreements specifying resolution deadlines by damage severity."""

    __tablename__ = "sla_policies"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    severity_level: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # Minor | Moderate | Severe | Critical
    max_resolution_hours: Mapped[int] = mapped_column(Integer, nullable=False)


class WorkOrder(Base, UUIDMixin, TimestampMixin):
    """Maintenance work order dispatched for defect remediation."""

    __tablename__ = "work_orders"

    defect_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("defects.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    contractor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contractors.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    sla_policy_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sla_policies.id", ondelete="SET NULL"), nullable=True
    )
    priority: Mapped[str] = mapped_column(String(50), default="MEDIUM", nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="CREATED", nullable=False, index=True
    )  # CREATED | ASSIGNED | IN_PROGRESS | COMPLETED | VERIFIED | CANCELLED
    estimated_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    deadline: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class WorkOrderHistory(Base, UUIDMixin, TimestampMixin):
    """Timeline and status transitions for maintenance work orders."""

    __tablename__ = "work_order_history"

    work_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("work_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status: Mapped[str] = mapped_column(String(50), nullable=False)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(String(255), nullable=True)


class RepairRecord(Base, UUIDMixin, TimestampMixin):
    """Documented repair completion report submitted by contractors."""

    __tablename__ = "repair_records"

    work_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("work_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    repaired_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    materials_used: Mapped[str | None] = mapped_column(Text, nullable=True)
    actual_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    before_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )
    after_media_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("media.id", ondelete="SET NULL"), nullable=True
    )


class RepairVerification(Base, UUIDMixin, TimestampMixin):
    """Advisory AI verification and authoritative human sign-off (Rule R8)."""

    __tablename__ = "repair_verifications"

    repair_record_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("repair_records.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    ai_damage_reduction_pct: Mapped[float] = mapped_column(Float, nullable=False)
    ai_recommendation: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # PASS | FAIL | UNCERTAIN
    human_decision: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # APPROVED | REJECTED
    decision_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verified_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )


class BudgetAllocation(Base, UUIDMixin, TimestampMixin):
    """Municipal ward budget allocation for road maintenance."""

    __tablename__ = "budget_allocations"

    ward_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wards.id", ondelete="CASCADE"), nullable=False
    )
    fiscal_year: Mapped[str] = mapped_column(String(20), nullable=False)
    allocated_amount: Mapped[float] = mapped_column(Float, nullable=False)
    spent_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
