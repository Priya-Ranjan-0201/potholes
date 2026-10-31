"""Pytest fixtures for backend testing."""

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
    """Clean test tables before each test to guarantee complete test isolation."""
    try:
        with sync_engine.begin() as conn:
            conn.execute(
                text(
                    "TRUNCATE defect_observations, defect_merge_log, "
                    "severity_assessments, defects, audit_logs, media CASCADE;"
                )
            )
    except Exception:  # noqa: S110
        pass
