"""Geospatial administrative and road network models."""

import uuid

from backend.app.models.base import Base, TimestampMixin, UUIDMixin
from geoalchemy2 import Geometry
from sqlalchemy import Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Department(Base, UUIDMixin, TimestampMixin):
    """Municipal engineering and maintenance departments."""

    __tablename__ = "departments"

    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)


class District(Base, UUIDMixin, TimestampMixin):
    """Administrative district boundaries."""

    __tablename__ = "districts"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), default="Punjab", nullable=False)

    wards: Mapped[list["Ward"]] = relationship(
        "Ward", back_populates="district", cascade="all, delete-orphan"
    )


class Ward(Base, UUIDMixin, TimestampMixin):
    """Electoral / municipal ward divisions within a district."""

    __tablename__ = "wards"

    district_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("districts.id", ondelete="CASCADE"), nullable=False
    )
    ward_number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    district: Mapped["District"] = relationship("District", back_populates="wards")
    roads: Mapped[list["Road"]] = relationship("Road", back_populates="ward")

    __table_args__ = (Index("ix_wards_district_number", "district_id", "ward_number", unique=True),)


class Road(Base, UUIDMixin, TimestampMixin):
    """Named roads and arterial streets."""

    __tablename__ = "roads"

    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    road_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ward_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("wards.id", ondelete="SET NULL"), nullable=True
    )
    geometry: Mapped[str | None] = mapped_column(
        Geometry(geometry_type="LINESTRING", srid=4326), nullable=True
    )

    ward: Mapped["Ward"] = relationship("Ward", back_populates="roads")
    segments: Mapped[list["RoadSegment"]] = relationship(
        "RoadSegment", back_populates="road", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_roads_geometry", "geometry", postgresql_using="gist"),)


class RoadSegment(Base, UUIDMixin, TimestampMixin):
    """Sub-divided segments of roads for granular damage aggregation and health indexing."""

    __tablename__ = "road_segments"

    road_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("roads.id", ondelete="CASCADE"), nullable=False
    )
    segment_index: Mapped[int] = mapped_column(Integer, nullable=False)
    length_meters: Mapped[float] = mapped_column(Float, nullable=False)
    geometry: Mapped[str] = mapped_column(
        Geometry(geometry_type="LINESTRING", srid=4326), nullable=False
    )

    road: Mapped["Road"] = relationship("Road", back_populates="segments")

    __table_args__ = (
        Index("ix_road_segments_road_idx", "road_id", "segment_index", unique=True),
        Index("ix_road_segments_geometry", "geometry", postgresql_using="gist"),
    )
