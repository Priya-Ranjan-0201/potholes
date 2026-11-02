"""Declarative base class and common mixins for SQLAlchemy models."""

import os
import uuid
from datetime import UTC, datetime

from geoalchemy2 import Geography, Geometry
from sqlalchemy import DateTime, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


# Compiler hooks ensuring seamless portability across environments
@compiles(Geography, "sqlite")
@compiles(Geometry, "sqlite")
def compile_geo_sqlite(type_, compiler, **kw):  # type: ignore[no-untyped-def]
    return "TEXT"


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):  # type: ignore[no-untyped-def]
    return "JSON"


if os.getenv("POSTGIS_COMPAT_MODE", "1") == "1":
    Geometry.as_binary = "ST_AsBinary"
    from geoalchemy2.functions import (
        ST_AsBinary,
        ST_AsEWKB,
        ST_GeogFromText,
        ST_GeomFromEWKT,
        ST_GeomFromText,
        ST_GeomFromWKB,
    )

    @compiles(Geography, "postgresql")
    @compiles(Geometry, "postgresql")
    def compile_geo_pg(type_, compiler, **kw):  # type: ignore[no-untyped-def]
        return "TEXT"

    @compiles(ST_AsBinary, "postgresql")
    @compiles(ST_AsEWKB, "postgresql")
    @compiles(ST_GeogFromText, "postgresql")
    @compiles(ST_GeomFromText, "postgresql")
    @compiles(ST_GeomFromEWKT, "postgresql")
    @compiles(ST_GeomFromWKB, "postgresql")
    def compile_st_spatial(element, compiler, **kw):  # type: ignore[no-untyped-def]
        return compiler.process(element.clauses.clauses[0], **kw)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models."""


class TimestampMixin:
    """Mixin adding created_at and updated_at UTC timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
        server_default=text("CURRENT_TIMESTAMP"),
        nullable=False,
    )


class UUIDMixin:
    """Mixin providing UUID v4 primary key."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
        nullable=False,
    )
