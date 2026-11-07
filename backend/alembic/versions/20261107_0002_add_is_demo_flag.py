"""Add is_demo flag to citizen_reports, complaints, work_orders, and defects.

Revision ID: 0002_add_is_demo_flag
Revises: 0001_initial_schema
Create Date: 2026-11-07 16:51:00.000000 UTC
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002_add_is_demo_flag"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLES = ["citizen_reports", "complaints", "work_orders", "defects"]


def upgrade() -> None:
    """Add is_demo boolean column with default False across entities."""
    for table in TABLES:
        op.add_column(
            table,
            sa.Column("is_demo", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        )


def downgrade() -> None:
    """Remove is_demo column from entities."""
    for table in TABLES:
        op.drop_column(table, "is_demo")

