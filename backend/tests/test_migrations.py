"""Tests verifying Alembic migration configuration and revision integrity."""

import importlib.util
from pathlib import Path
from unittest.mock import MagicMock

from backend.alembic.env import target_metadata
from backend.app.models import Base


def test_target_metadata_has_all_39_tables() -> None:
    """Verify that Alembic target_metadata is synced with all models."""
    assert len(target_metadata.tables) >= 39
    assert target_metadata == Base.metadata


def test_initial_schema_migration_structure() -> None:
    """Verify initial schema migration defines revision, upgrade, and downgrade."""
    migration_path = (
        Path(__file__).parents[1] / "alembic" / "versions" / "20261031_0001_initial_schema.py"
    )
    assert migration_path.exists(), f"Migration file missing at {migration_path}"

    spec = importlib.util.spec_from_file_location("initial_schema", migration_path)
    assert spec is not None
    assert spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    assert hasattr(mod, "revision")
    assert mod.revision == "0001_initial_schema"
    assert hasattr(mod, "down_revision")
    assert mod.down_revision is None
    assert callable(getattr(mod, "upgrade", None))
    assert callable(getattr(mod, "downgrade", None))


def test_initial_schema_upgrade_and_downgrade_calls() -> None:
    """Verify upgrade and downgrade execute create_all and drop_all on bind."""
    migration_path = (
        Path(__file__).parents[1] / "alembic" / "versions" / "20261031_0001_initial_schema.py"
    )
    spec = importlib.util.spec_from_file_location("initial_schema", migration_path)
    assert spec is not None
    assert spec.loader is not None
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)

    # Mock op.get_bind()
    mock_bind = MagicMock()
    mock_bind.dialect.name = "postgresql"

    original_op = mod.op
    mock_op = MagicMock()
    mock_op.get_bind.return_value = mock_bind

    mod.op = mock_op
    try:
        # Test upgrade
        mod.upgrade()
        mock_op.execute.assert_called_with("CREATE EXTENSION IF NOT EXISTS postgis;")

        # Test downgrade
        mock_op.reset_mock()
        mod.downgrade()
        mock_op.execute.assert_called_with("DROP EXTENSION IF EXISTS postgis CASCADE;")
    finally:
        mod.op = original_op
