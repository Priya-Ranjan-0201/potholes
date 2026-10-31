"""Integration tests for batch sync ingestion, spatial deduplication, and idempotency."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi.testclient import TestClient


def test_sync_batch_ingestion_creates_defects(client: TestClient) -> None:
    """Test valid sync batch ingestion creates canonical defects and observations."""
    batch_id = str(uuid.uuid4())
    device_id = str(uuid.uuid4())
    idemp_key = f"batch-test-{batch_id}"
    obs_id = str(uuid.uuid4())
    defect_id = str(uuid.uuid4())

    now_iso = datetime.now(UTC).isoformat()

    payload = {
        "batch_id": batch_id,
        "device_id": device_id,
        "idempotency_key": idemp_key,
        "model_version": "scamroad-yolov8n-v1.0",
        "observations": [
            {
                "observation_id": obs_id,
                "defect_id": defect_id,
                "device_id": device_id,
                "location": {
                    "latitude": 30.90100,
                    "longitude": 75.85730,
                    "accuracy_m": 4.5,
                    "speed_mps": 11.2,
                    "heading_deg": 182.0,
                    "altitude_m": 240.0,
                },
                "confidence": 0.88,
                "class_code": "POTHOLE",
                "measurement_summary": {
                    "relative_area": 4.25,
                    "bbox_width_px": 140.0,
                    "bbox_height_px": 90.0,
                    "unit": "px",
                    "calibrated": False,
                },
                "best_frame_path": "data/edge_media/frame_01.jpg",
                "track_length_frames": 5,
                "quality_score": 0.88,
                "observed_at": now_iso,
                "created_at": now_iso,
            }
        ],
        "media_manifest": [
            {
                "media_id": str(uuid.uuid4()),
                "filename": "frame_01.jpg",
                "sha256": "a" * 64,
                "mime_type": "image/jpeg",
                "size_bytes": 45000,
                "observation_ids": [obs_id],
            }
        ],
        "sent_at": now_iso,
        "retry_count": 0,
    }

    response = client.post("/api/v1/sync", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["status"] == "SYNCED"
    assert data["batch_id"] == batch_id
    assert data["synced_observations"] == 1
    assert data["new_defects"] == 1
    assert data["merged_defects"] == 0
    assert data["media_registered"] == 1


def test_sync_batch_idempotency_replay(client: TestClient) -> None:
    """Test Rule B4: Replaying identical batch with same idempotency_key returns cached receipt."""
    batch_id = str(uuid.uuid4())
    device_id = str(uuid.uuid4())
    idemp_key = f"batch-idemp-{batch_id}"
    obs_id = str(uuid.uuid4())
    defect_id = str(uuid.uuid4())

    now_iso = datetime.now(UTC).isoformat()

    payload = {
        "batch_id": batch_id,
        "device_id": device_id,
        "idempotency_key": idemp_key,
        "model_version": "scamroad-yolov8n-v1.0",
        "observations": [
            {
                "observation_id": obs_id,
                "defect_id": defect_id,
                "device_id": device_id,
                "location": {
                    "latitude": 30.90200,
                    "longitude": 75.85800,
                    "accuracy_m": 5.0,
                },
                "confidence": 0.91,
                "class_code": "POTHOLE",
                "observed_at": now_iso,
            }
        ],
        "sent_at": now_iso,
    }

    # First call: SYNCED
    resp1 = client.post("/api/v1/sync", json=payload)
    assert resp1.status_code == 201
    assert resp1.json()["status"] == "SYNCED"

    # Second call (replay): ALREADY_PROCESSED with identical receipt
    resp2 = client.post("/api/v1/sync", json=payload)
    assert resp2.status_code == 201
    data2 = resp2.json()
    assert data2["status"] == "ALREADY_PROCESSED"
    assert data2["idempotency_key"] == idemp_key
    assert "previously processed" in data2["message"].lower()


def test_spatial_deduplication_auto_merge(client: TestClient) -> None:
    """Test Rule B5: Second vehicle pass within dynamic radius merges into canonical defect."""
    device_id = str(uuid.uuid4())
    canonical_lat = 30.90500
    canonical_lon = 75.86000

    now_iso = datetime.now(UTC).isoformat()

    # Pass 1: First sighting establishes canonical defect
    batch1 = {
        "batch_id": str(uuid.uuid4()),
        "device_id": device_id,
        "idempotency_key": f"batch-pass-1-{uuid.uuid4()}",
        "observations": [
            {
                "observation_id": str(uuid.uuid4()),
                "defect_id": str(uuid.uuid4()),
                "device_id": device_id,
                "location": {
                    "latitude": canonical_lat,
                    "longitude": canonical_lon,
                    "accuracy_m": 5.0,
                },
                "confidence": 0.85,
                "class_code": "POTHOLE",
                "observed_at": now_iso,
            }
        ],
        "sent_at": now_iso,
    }
    r1 = client.post("/api/v1/sync", json=batch1)
    assert r1.status_code == 201
    assert r1.json()["new_defects"] == 1

    # Pass 2: Sighting offset by ~4 meters (0.000035 deg latitude ~ 3.9m)
    offset_lat = canonical_lat + 0.000035
    batch2 = {
        "batch_id": str(uuid.uuid4()),
        "device_id": device_id,
        "idempotency_key": f"batch-pass-2-{uuid.uuid4()}",
        "observations": [
            {
                "observation_id": str(uuid.uuid4()),
                "defect_id": str(uuid.uuid4()),
                "device_id": device_id,
                "location": {
                    "latitude": offset_lat,
                    "longitude": canonical_lon,
                    "accuracy_m": 5.0,
                },
                "confidence": 0.89,
                "class_code": "POTHOLE",
                "observed_at": now_iso,
            }
        ],
        "sent_at": now_iso,
    }
    r2 = client.post("/api/v1/sync", json=batch2)
    assert r2.status_code == 201
    d2 = r2.json()
    assert d2["status"] == "SYNCED"
    assert d2["merged_defects"] == 1
    assert d2["new_defects"] == 0
