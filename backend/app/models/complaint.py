"""Citizen reports and complaint management state machine models."""

import uuid

from backend.app.models.base import Base, TimestampMixin, UUIDMixin
from geoalchemy2 import Geography
from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class CitizenReport(Base, UUIDMixin, TimestampMixin):
    """Initial damage submission from a citizen mobile app or web portal."""

    __tablename__ = "citizen_reports"

    reporter_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    location: Mapped[str] = mapped_column(
        Geography(geometry_type="POINT", srid=4326), nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    media_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    complaints: Mapped[list["Complaint"]] = relationship(
        "Complaint", back_populates="citizen_report"
    )

    __table_args__ = (Index("ix_citizen_reports_location", "location", postgresql_using="gist"),)


class Complaint(Base, UUIDMixin, TimestampMixin):
    """Citizen complaint lifecycle governed by strict state machine (Rule B7)."""

    __tablename__ = "complaints"

    citizen_report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("citizen_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    defect_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("defects.id", ondelete="SET NULL"), nullable=True, index=True
    )
    status: Mapped[str] = mapped_column(
        String(50), default="SUBMITTED", nullable=False, index=True
    )  # SUBMITTED -> UNDER_REVIEW -> VERIFIED -> ASSIGNED -> IN_PROGRESS -> RESOLVED | REJECTED
    assigned_to_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    citizen_report: Mapped["CitizenReport"] = relationship(
        "CitizenReport", back_populates="complaints"
    )
    history: Mapped[list["ComplaintStatusHistory"]] = relationship(
        "ComplaintStatusHistory", back_populates="complaint", cascade="all, delete-orphan"
    )
    upvotes: Mapped[list["ComplaintUpvote"]] = relationship(
        "ComplaintUpvote", back_populates="complaint", cascade="all, delete-orphan"
    )


class ComplaintStatusHistory(Base, UUIDMixin, TimestampMixin):
    """Audit log of state transitions for citizen complaints."""

    __tablename__ = "complaint_status_history"

    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("complaints.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status: Mapped[str] = mapped_column(String(50), nullable=False)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    changed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    comment: Mapped[str | None] = mapped_column(String(255), nullable=True)

    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="history")


class ComplaintUpvote(Base, UUIDMixin, TimestampMixin):
    """Citizen upvotes endorsing public complaints."""

    __tablename__ = "complaint_upvotes"

    complaint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    complaint: Mapped["Complaint"] = relationship("Complaint", back_populates="upvotes")

    __table_args__ = (Index("ix_complaint_upvotes_unique", "complaint_id", "user_id", unique=True),)
