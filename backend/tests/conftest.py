"""Pytest fixtures for backend testing."""

import os
import pytest
from backend.app.db.session import sync_engine
from backend.app.main import app
from fastapi.testclient import TestClient
from sqlalchemy import text


@pytest.fixture
def client() -> TestClient:
    """Synchronous test client fixture for FastAPI app."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clean_database() -> None:
    """Clean test tables before each test if not explicitly skipped."""
    if os.getenv("SKIP_CLEAN_DB") == "1":
        return
    try:
        with sync_engine.begin() as conn:
            conn.execute(
                text(
                    "TRUNCATE defect_observations, defect_merge_log, "
                    "severity_assessments, defects, audit_logs, media, "
                    "work_order_history, repair_verifications, repair_records, "
                    "work_orders, complaint_status_history, complaints, "
                    "citizen_reports, user_roles, users, sla_policies, "
                    "contractors, budget_allocations, notifications, "
                    "forecasts, road_health_scores, weather_records CASCADE;"
                )
            )
    except Exception:  # noqa: S110
        pass
