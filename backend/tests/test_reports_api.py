"""Integration tests for Municipal Reporting and CSV Export endpoints."""

from __future__ import annotations

from backend.app.services.reporting import reporting_service
from fastapi.testclient import TestClient


def test_export_defects_csv(client: TestClient) -> None:
    """Validate RFC 4180 CSV export with proper metadata and headers."""
    resp = client.get("/api/v1/reports/defects.csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "attachment; filename=" in resp.headers["content-disposition"]

    content = resp.text
    # Verify metadata header presence
    assert "# ScamRoad Municipal Defect Export" in content
    assert "defect_id,class_code,road_name" in content
    assert "verification_status" in content


def test_executive_summary_payload_number_parity(client: TestClient) -> None:
    """SPEC B10 test: Every number presented in narrative must exist in payload."""
    resp = client.get("/api/v1/reports/executive-summary")
    assert resp.status_code == 200
    payload = resp.json()

    assert "total_defects" in payload
    assert "critical_count" in payload
    assert "average_health_score" in payload
    assert "narrative_summary" in payload

    # Verify strict parity
    is_valid = reporting_service.verify_summary_numbers_parity(payload)
    assert is_valid is True, f"Narrative failed parity check: {payload['narrative_summary']}"
