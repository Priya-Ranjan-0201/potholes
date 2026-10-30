"""Tests for system health check endpoints and core middleware."""

import uuid

from fastapi.testclient import TestClient


def test_health_root_endpoint(client: TestClient) -> None:
    """Test GET /health returns 200 OK and valid health schema."""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data
    assert "environment" in data
    assert "timestamp" in data
    assert "dependencies" in data
    assert data["dependencies"]["api"]["status"] == "ok"


def test_health_api_v1_endpoint(client: TestClient) -> None:
    """Test GET /api/v1/health returns 200 OK."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"


def test_correlation_id_generated(client: TestClient) -> None:
    """Test that requests receive an X-Request-ID header if none provided."""
    response = client.get("/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    request_id = response.headers["x-request-id"]
    parsed_uuid = uuid.UUID(request_id)
    assert str(parsed_uuid) == request_id


def test_correlation_id_preserved(client: TestClient) -> None:
    """Test that incoming X-Request-ID header is preserved in the response."""
    custom_id = "test-custom-request-id-12345"
    response = client.get("/health", headers={"X-Request-ID": custom_id})
    assert response.status_code == 200
    assert response.headers["x-request-id"] == custom_id
