"""Unit tests for edge outbox staging and sync client."""

from pathlib import Path

import pytest

from edge.agent.geotag import GPSFix
from edge.agent.outbox import SQLiteOutbox
from edge.agent.sync import SyncClient
from edge.agent.track import DefectCandidate


@pytest.fixture
def temp_outbox(tmp_path: Path) -> SQLiteOutbox:
    """Create a temporary SQLite outbox."""
    db_file = tmp_path / "test_outbox.db"
    return SQLiteOutbox(db_path=db_file)


def test_stage_candidate_to_outbox(temp_outbox: SQLiteOutbox) -> None:
    """Verify defect candidate packaging matches schema contract and enters outbox."""
    client = SyncClient(outbox=temp_outbox, device_id="test-device-uuid")

    cand = DefectCandidate(
        candidate_id="cand-001",
        track_id=1,
        class_id=0,
        class_name="POTHOLE",
        best_frame_id=12,
        best_frame_img=None,
        best_bbox_xyxy=(100.0, 200.0, 300.0, 400.0),
        median_confidence=0.88,
        max_confidence=0.92,
        min_confidence=0.81,
        median_relative_area=0.035,
        frames_seen=5,
        first_seen_epoch=1700000000.0,
        last_seen_epoch=1700000001.0,
        calibrated=False,
    )

    gps = GPSFix(
        latitude=30.901,
        longitude=75.857,
        altitude_m=245.0,
        accuracy_m=4.2,
        speed_mps=8.5,
        heading_deg=180.0,
        timestamp_epoch=1700000001.0,
        has_fix=True,
    )

    event_id = client.stage_candidate_to_outbox(cand, gps)
    assert event_id is not None

    pending = temp_outbox.peek_pending(limit=5)
    assert len(pending) == 1
    ev = pending[0]
    assert ev["event_type"] == "DEFECT_OBSERVED"
    payload = ev["payload"]
    assert payload["idempotency_key"] == "obs-cand-001"
    assert payload["device_id"] == "test-device-uuid"
    assert payload["class_code"] == "POTHOLE"
    assert payload["confidence"] == 0.88
    assert payload["location"]["latitude"] == 30.901
    assert payload["measurement_summary"]["calibrated"] is False  # Rule R4


def test_sync_pending_events_dry_run(temp_outbox: SQLiteOutbox) -> None:
    """Verify dry-run sync marks events as completed."""
    client = SyncClient(outbox=temp_outbox)
    cand = DefectCandidate(
        candidate_id="cand-002",
        track_id=2,
        class_id=0,
        class_name="POTHOLE",
        best_frame_id=1,
        best_frame_img=None,
        best_bbox_xyxy=(50.0, 50.0, 100.0, 100.0),
        median_confidence=0.95,
        max_confidence=0.95,
        min_confidence=0.95,
        median_relative_area=0.01,
        frames_seen=3,
        first_seen_epoch=1700000000.0,
        last_seen_epoch=1700000000.5,
    )
    gps = GPSFix(30.0, 75.0, None, 5.0, None, None, 1700000000.0, True)
    client.stage_candidate_to_outbox(cand, gps)

    res = client.sync_pending_events(
        api_url="http://localhost:8000", max_batch_size=10, dry_run=True
    )
    assert res["status"] == "DRY_RUN_SUCCESS"
    assert res["synced_count"] == 1

    # Outbox should now have 0 pending events
    remaining = temp_outbox.peek_pending()
    assert len(remaining) == 0
