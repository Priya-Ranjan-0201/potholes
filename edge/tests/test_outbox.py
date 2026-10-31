"""Unit tests for the Edge SQLite WAL Outbox manager."""

import sqlite3
import time
from pathlib import Path

from edge.agent.outbox import OutboxManager


def test_outbox_init_and_wal_mode(tmp_path: Path) -> None:
    """Verify that OutboxManager initializes database in WAL mode with correct tables."""
    db_file = tmp_path / "test_outbox.db"
    manager = OutboxManager(db_file)
    assert manager is not None
    assert db_file.exists()

    with sqlite3.connect(str(db_file)) as conn:
        cursor = conn.execute("PRAGMA journal_mode;")
        journal_mode = cursor.fetchone()[0]
        assert journal_mode.lower() == "wal"

        cursor = conn.execute("""
            SELECT name FROM sqlite_master
            WHERE type='table' AND name IN ('outbox_events', 'outbox_media');
            """)
        tables = [row[0] for row in cursor.fetchall()]
        assert "outbox_events" in tables
        assert "outbox_media" in tables


def test_enqueue_and_priority_ordering(tmp_path: Path) -> None:
    """Verify events are queued and fetched by priority DESC, created_at ASC."""
    db_file = tmp_path / "test_outbox.db"
    manager = OutboxManager(db_file)

    id_low = manager.enqueue("observation", {"id": "low"}, priority=1)
    time.sleep(0.01)  # Ensure distinct timestamps
    id_high = manager.enqueue("observation", {"id": "high"}, priority=10)
    time.sleep(0.01)
    id_med = manager.enqueue("observation", {"id": "med"}, priority=5)

    batch = manager.fetch_pending_batch(limit=10)
    assert len(batch) == 3
    assert batch[0]["id"] == id_high
    assert batch[0]["priority"] == 10
    assert batch[0]["payload"] == {"id": "high"}

    assert batch[1]["id"] == id_med
    assert batch[1]["priority"] == 5

    assert batch[2]["id"] == id_low
    assert batch[2]["priority"] == 1


def test_enqueue_with_media_sha256(tmp_path: Path) -> None:
    """Verify media attachment computes sha256 checksum and associates correctly."""
    db_file = tmp_path / "test_outbox.db"
    manager = OutboxManager(db_file)

    sample_media = tmp_path / "frame_001.jpg"
    sample_media.write_bytes(b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100)

    event_id = manager.enqueue(
        "observation",
        {"class": "pothole"},
        priority=2,
        media_paths=[sample_media],
    )

    batch = manager.fetch_pending_batch(limit=10)
    assert len(batch) == 1
    event = batch[0]
    assert event["id"] == event_id
    assert len(event["media"]) == 1
    media = event["media"][0]
    assert media["file_size"] == len(sample_media.read_bytes())
    assert len(media["file_hash"]) == 64  # SHA-256 hex string
    assert media["status"] == "PENDING"


def test_state_transitions_and_completion(tmp_path: Path) -> None:
    """Verify state transitions: PENDING -> IN_PROGRESS -> COMPLETED."""
    db_file = tmp_path / "test_outbox.db"
    manager = OutboxManager(db_file)

    event_id = manager.enqueue("observation", {"data": 123})

    # Mark IN_PROGRESS
    manager.mark_in_progress([event_id])
    batch_after_progress = manager.fetch_pending_batch(limit=10)
    assert len(batch_after_progress) == 0  # In-progress not returned in pending batch

    # Mark COMPLETED
    manager.mark_completed(event_id)
    stats = manager.get_stats()
    assert stats["completed_count"] == 1
    assert stats["pending_count"] == 0
    assert stats["in_progress_count"] == 0


def test_retry_and_exponential_backoff(tmp_path: Path) -> None:
    """Verify failure retries increment attempts and schedule exponential backoff."""
    db_file = tmp_path / "test_outbox.db"
    manager = OutboxManager(db_file)

    event_id = manager.enqueue("observation", {"fail": True}, max_attempts=3)

    # First failure -> retry scheduled in future
    manager.mark_failed(event_id, error_message="Network timeout", base_delay_seconds=100)

    # Fetching pending batch should NOT return it yet because next_retry_at is in the future
    pending = manager.fetch_pending_batch(limit=10)
    assert len(pending) == 0

    # Simulate subsequent failures until max_attempts reached
    manager.mark_failed(event_id, error_message="Connection refused", base_delay_seconds=100)
    manager.mark_failed(event_id, error_message="Permanent failure", base_delay_seconds=100)

    stats = manager.get_stats()
    assert stats["failed_count"] == 1
    assert stats["pending_count"] == 0


def test_quota_eviction(tmp_path: Path) -> None:
    """Verify quota-based eviction removes completed and failed items when size exceeds limit."""
    db_file = tmp_path / "test_outbox.db"
    manager = OutboxManager(db_file)

    # Enqueue and complete several events with large payloads
    for _ in range(10):
        eid = manager.enqueue("observation", {"filler": "X" * 1000})
        manager.mark_completed(eid)

    initial_size = db_file.stat().st_size
    assert initial_size > 0

    # Evict with quota smaller than current size
    evicted = manager.check_quota_and_evict(max_database_bytes=512)
    assert evicted > 0
    stats = manager.get_stats()
    assert stats["completed_count"] < 10
