"""Integration tests for Defect management, filtering, and human override endpoints."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi.testclient import TestClient


def test_list_defects_and_detail(client: TestClient) -> None:
    """Test listing defects and retrieving comprehensive defect lifecycle detail."""
    batch_id = str(uuid.uuid4())
    device_id = str(uuid.uuid4())
    obs_id = str(uuid.uuid4())
    defect_id = str(uuid.uuid4())
    now_iso = datetime.now(UTC).isoformat()

    # Ingest a defect first
    payload = {
        "batch_id": batch_id,
        "device_id": device_id,
        "idempotency_key": f"batch-defect-api-{batch_id}",
        "observations": [
            {
                "observation_id": obs_id,
                "defect_id": defect_id,
                "device_id": device_id,
                "location": {
                    "latitude": 30.90150,
                    "longitude": 75.85750,
                    "accuracy_m": 4.0,
                },
                "confidence": 0.92,
                "class_code": "POTHOLE",
                "measurement_summary": {
                    "relative_area": 5.5,
                    "bbox_width_px": 120.0,
                    "bbox_height_px": 85.0,
                },
                "observed_at": now_iso,
            }
        ],
        "sent_at": now_iso,
    }
    sync_resp = client.post("/api/v1/sync", json=payload)
    assert sync_resp.status_code == 201

    # 1. Test List Defects
    list_resp = client.get("/api/v1/defects?class_code=POTHOLE&limit=10")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] >= 1
    assert any(item["id"] == defect_id for item in list_data["items"])

    # 2. Test Get Defect Detail
    detail_resp = client.get(f"/api/v1/defects/{defect_id}")
    assert detail_resp.status_code == 200
    detail_data = detail_resp.json()
    assert detail_data["id"] == defect_id
    assert detail_data["class_code"] == "POTHOLE"
    assert len(detail_data["observations"]) >= 1
    assert len(detail_data["severity_history"]) >= 1


def test_defect_severity_human_override(client: TestClient) -> None:
    """Test Rule B6: Human override of severity creates audit record with source='human'."""
    batch_id = str(uuid.uuid4())
    device_id = str(uuid.uuid4())
    obs_id = str(uuid.uuid4())
    defect_id = str(uuid.uuid4())
    now_iso = datetime.now(UTC).isoformat()

    # Ingest defect
    payload = {
        "batch_id": batch_id,
        "device_id": device_id,
        "idempotency_key": f"batch-override-{batch_id}",
        "observations": [
            {
                "observation_id": obs_id,
                "defect_id": defect_id,
                "device_id": device_id,
                "location": {"latitude": 30.90350, "longitude": 75.85950},
                "confidence": 0.80,
                "class_code": "POTHOLE",
                "observed_at": now_iso,
            }
        ],
        "sent_at": now_iso,
    }
    client.post("/api/v1/sync", json=payload)

    # Post Human Override
    override_payload = {
        "normalized_score": 88.0,
        "level": "Critical",
        "reason": "Inspector verification: defect expanding rapidly due to heavy bus traffic.",
    }
    resp = client.post(
        f"/api/v1/defects/{defect_id}/override-severity",
        json=override_payload,
    )
    assert resp.status_code == 201
    res_data = resp.json()
    assert res_data["normalized_score"] == 88.0
    assert res_data["level"] == "Critical"
    assert res_data["source"] == "human"
    assert "expanding rapidly" in res_data["uncertainty_note"]
