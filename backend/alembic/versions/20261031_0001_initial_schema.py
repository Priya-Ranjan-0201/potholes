"""Initial schema creation for all 39 ScamRoad tables.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-10-31 00:00:00.000000 UTC
"""

from collections.abc import Sequence

from alembic import op
from backend.app.models import Base

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create PostGIS extension and all 39 application database tables."""
    bind = op.get_bind()

    # Enable PostGIS on PostgreSQL engines
    if bind.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")

    # Create all tables registered on Base.metadata
    Base.metadata.create_all(bind)


def downgrade() -> None:
    """Drop all application tables and PostGIS extension."""
    bind = op.get_bind()

    # Drop all tables in dependency order
    Base.metadata.drop_all(bind)

    if bind.dialect.name == "postgresql":
        op.execute("DROP EXTENSION IF EXISTS postgis CASCADE;")
