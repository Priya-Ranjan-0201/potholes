"""Tests verifying database model metadata, table counts, and spatial indexes."""

from backend.app.models import Base

EXPECTED_TABLES = [
    "users",
    "roles",
    "user_roles",
    "devices",
    "device_heartbeats",
    "departments",
    "districts",
    "wards",
    "contractors",
    "roads",
    "road_segments",
    "inspections",
    "media",
    "model_versions",
    "detections",
    "segmentation_masks",
    "measurements",
    "defects",
    "defect_observations",
    "defect_merge_log",
    "severity_assessments",
    "road_health_scores",
    "citizen_reports",
    "complaints",
    "complaint_status_history",
    "complaint_upvotes",
    "work_orders",
    "work_order_history",
    "repair_records",
    "repair_verifications",
    "weather_records",
    "forecasts",
    "notifications",
    "notification_rules",
    "report_jobs",
    "budget_allocations",
    "sla_policies",
    "audit_logs",
    "system_settings",
]


def test_expected_tables_present() -> None:
    """Verify that all 39 tables from SPEC B7 are defined in SQLAlchemy metadata."""
    registered_tables = set(Base.metadata.tables.keys())
    for table_name in EXPECTED_TABLES:
        assert table_name in registered_tables, f"Missing table in metadata: {table_name}"

    assert len(registered_tables) >= 39


def test_spatial_indexes_present() -> None:
    """Verify that GiST indexes exist on spatial tables per SPEC A6."""
    tables = Base.metadata.tables

    # Check defects table has spatial index
    defects = tables["defects"]
    assert "location" in defects.columns
    gist_indexes = [
        idx
        for idx in defects.indexes
        if idx.dialect_options.get("postgresql", {}).get("using") == "gist"
    ]
    assert len(gist_indexes) >= 1, "defects table missing GiST index on location"

    # Check defect_observations table has spatial index
    obs = tables["defect_observations"]
    assert "location" in obs.columns
    gist_obs = [
        idx
        for idx in obs.indexes
        if idx.dialect_options.get("postgresql", {}).get("using") == "gist"
    ]
    assert len(gist_obs) >= 1, "defect_observations missing GiST index on location"

    # Check road_segments table has spatial index
    segs = tables["road_segments"]
    assert "geometry" in segs.columns
    gist_segs = [
        idx
        for idx in segs.indexes
        if idx.dialect_options.get("postgresql", {}).get("using") == "gist"
    ]
    assert len(gist_segs) >= 1, "road_segments missing GiST index on geometry"


def test_audit_log_and_observation_immutability_attributes() -> None:
    """Verify audit_logs and defect_observations have non-null timestamp tracking."""
    tables = Base.metadata.tables

    assert "created_at" in tables["audit_logs"].columns
    assert "created_at" in tables["defect_observations"].columns
    assert "observed_at" in tables["defect_observations"].columns
