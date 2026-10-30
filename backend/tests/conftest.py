"""Pytest fixtures for backend testing."""

import pytest
from backend.app.main import app
from fastapi.testclient import TestClient


@pytest.fixture
def client() -> TestClient:
    """Synchronous test client fixture for FastAPI app."""
    return TestClient(app)
