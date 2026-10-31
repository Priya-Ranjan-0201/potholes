"""Integration tests for Forecast and Road Health Index endpoints."""

from __future__ import annotations

import uuid

from fastapi.testclient import TestClient


def test_forecast_endpoint_404_on_missing_segment(client: TestClient) -> None:
    """Non-existent segment returns 404."""
    fake_id = uuid.uuid4()
    resp = client.get(f"/api/v1/forecasts/{fake_id}")
    assert resp.status_code == 404


def test_forecast_and_health_index_endpoints(client: TestClient) -> None:
    """Validate health index and degradation forecast responses."""
    # First ingest a batch so roads/segments are seeded
    dev_id = str(uuid.uuid4())
    batch = {
        "batch_id": str(uuid.uuid4()),
        "device_id": dev_id,
        "idempotency_key": f"fc-sync-{uuid.uuid4()}",
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
                },
                "confidence": 0.91,
                "class_code": "POTHOLE",
                "observed_at": "2026-10-31T11:55:00Z",
            }
        ],
    }
    client.post("/api/v1/sync", json=batch)

    # Get a real defect to inspect its segment
    defects_resp = client.get("/api/v1/defects")
    items = defects_resp.json()["items"]
    assert len(items) > 0
    defect = items[0]
    segment_id = defect.get("road_segment_id")

    if segment_id:
        # Test Road Health Index
        rhi_resp = client.get(f"/api/v1/health-index/{segment_id}")
        assert rhi_resp.status_code == 200
        rhi_data = rhi_resp.json()
        assert rhi_data["segment_id"] == segment_id
        assert 0.0 <= rhi_data["score"] <= 100.0

        # Test Forecast (should return INSUFFICIENT_DATA because history < 2)
        fc_resp = client.get(f"/api/v1/forecasts/{segment_id}")
        assert fc_resp.status_code == 200
        fc_data = fc_resp.json()
        assert fc_data["status"] == "INSUFFICIENT_DATA"
