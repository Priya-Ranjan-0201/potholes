"""Integration tests for analytics and statistics aggregation endpoints (Rule R1)."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def _get_token(client: TestClient, email: str, role: str) -> str:
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": f"{role.capitalize()} User",
            "role": role,
        },
    )
    return str(resp.json()["access_token"])


def test_stats_overview_and_trends(client: TestClient) -> None:
    """Validate aggregate counts and trends accurately reflect ingested data (Rule R1)."""
    citizen_token = _get_token(client, "stat_citizen@example.com", "citizen")

    # Ingest 1 observation
    dev_id = str(uuid.uuid4())
    batch = {
        "batch_id": str(uuid.uuid4()),
        "device_id": dev_id,
        "idempotency_key": f"stats-sync-{uuid.uuid4()}",
        "sent_at": "2026-10-31T12:00:00Z",
        "observations": [
            {
                "observation_id": str(uuid.uuid4()),
                "defect_id": str(uuid.uuid4()),
                "device_id": dev_id,
                "location": {
                    "latitude": 30.7333,
                    "longitude": 76.7794,
                    "accuracy_m": 4.0,
                    "speed_mps": 12.0,
                    "heading_deg": 90.0,
                    "altitude_m": 250.0,
                },
                "confidence": 0.92,
                "class_code": "POTHOLE",
                "observed_at": "2026-10-31T11:55:00Z",
            }
        ],
    }
    sync_resp = client.post("/api/v1/sync", json=batch)
    assert sync_resp.status_code == 201, sync_resp.text

    # Ingest 1 complaint
    client.post(
        "/api/v1/reports",
        json={"latitude": 30.7333, "longitude": 76.7794, "description": "Big crater"},
        headers={"Authorization": f"Bearer {citizen_token}"},
    )

    # Fetch stats overview
    resp = client.get("/api/v1/stats/overview")
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["total_defects"] >= 1
    assert data["total_complaints"] >= 1
    assert "POTHOLE" in data["defects_by_class"] or "pothole" in data["defects_by_class"]
    assert "ACTIVE" in data["defects_by_status"]

    # Fetch trends
    trend_resp = client.get("/api/v1/stats/trends?days=7")
    assert trend_resp.status_code == 200
    trends_data = trend_resp.json()
    assert trends_data["days"] == 7
    assert len(trends_data["trends"]) == 7
    # Today's trend has at least 1 observation and 1 complaint
    today_item = trends_data["trends"][-1]
    assert today_item["observations_count"] >= 1
    assert today_item["complaints_count"] >= 1


def test_contractor_and_ward_stats(client: TestClient) -> None:
    """Validate contractor and ward aggregate endpoints."""
    admin_token = _get_token(client, "admin_stats@example.com", "admin")

    # Create contractor
    c_resp = client.post(
        "/api/v1/contractors",
        json={"name": "Universal Roads Corp", "phone": "+919999900000"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    c_id = c_resp.json()["id"]

    # Contractor stats
    c_stats_resp = client.get("/api/v1/stats/contractors")
    assert c_stats_resp.status_code == 200
    c_stats = c_stats_resp.json()
    assert any(c["contractor_id"] == c_id for c in c_stats)

    # Ward stats
    ward_stats_resp = client.get("/api/v1/stats/wards")
    assert ward_stats_resp.status_code == 200
    assert isinstance(ward_stats_resp.json(), list)
