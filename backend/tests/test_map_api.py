"""Integration tests for Map GeoJSON endpoints."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi.testclient import TestClient


def test_map_geojson_format(client: TestClient) -> None:
    """Test GET /api/v1/map/geojson returns valid GeoJSON FeatureCollection."""
    batch_id = str(uuid.uuid4())
    device_id = str(uuid.uuid4())
    obs_id = str(uuid.uuid4())
    defect_id = str(uuid.uuid4())
    now_iso = datetime.now(UTC).isoformat()

    # Ingest a defect first
    payload = {
        "batch_id": batch_id,
        "device_id": device_id,
        "idempotency_key": f"batch-map-{batch_id}",
        "observations": [
            {
                "observation_id": obs_id,
                "defect_id": defect_id,
                "device_id": device_id,
                "location": {
                    "latitude": 30.90120,
                    "longitude": 75.85720,
                    "accuracy_m": 3.0,
                },
                "confidence": 0.94,
                "class_code": "POTHOLE",
                "observed_at": now_iso,
            }
        ],
        "sent_at": now_iso,
    }
    client.post("/api/v1/sync", json=payload)

    # Fetch GeoJSON
    resp = client.get("/api/v1/map/geojson?class_code=POTHOLE")
    assert resp.status_code == 200

    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert isinstance(data["features"], list)
    assert len(data["features"]) >= 1

    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "Point"
    assert len(feature["geometry"]["coordinates"]) == 2  # [lon, lat]
    assert "class_code" in feature["properties"]
    assert "severity_score" in feature["properties"]
    assert "status" in feature["properties"]
