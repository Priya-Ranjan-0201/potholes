"""SQLite WAL Outbox for edge offline-first synchronization.

Provides reliable, local, ACID-compliant persistence for road damage detections,
measurements, and media files when operating offline or with intermittent connectivity.
Uses SQLite WAL (Write-Ahead Logging) mode for concurrent read/write throughput and
implements exponential backoff retries, priority-based queuing, and quota-based eviction.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import sys
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any


class OutboxManager:
    """Manages local SQLite WAL outbox for edge offline-first storage and sync."""

    def __init__(self, db_path: Path | str) -> None:
        """Initialize the outbox manager with a SQLite database path.

        Args:
            db_path: Path to the SQLite database file.
        """
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        """Create and configure a SQLite connection with WAL mode and pragmas."""
        conn = sqlite3.connect(str(self.db_path), timeout=10.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        conn.execute("PRAGMA busy_timeout = 5000;")
        return conn

    def _init_db(self) -> None:
        """Initialize database tables, indexes, and triggers."""
        with self._get_connection() as conn:
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS outbox_events (
                    id TEXT PRIMARY KEY,
                    event_type TEXT NOT NULL,
                    payload TEXT NOT NULL,
                    priority INTEGER NOT NULL DEFAULT 1,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    attempts INTEGER NOT NULL DEFAULT 0,
                    max_attempts INTEGER NOT NULL DEFAULT 5,
                    next_retry_at TEXT,
                    last_error TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_outbox_events_status_priority
                    ON outbox_events (status, priority DESC, created_at ASC);

                CREATE TABLE IF NOT EXISTS outbox_media (
                    id TEXT PRIMARY KEY,
                    event_id TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    file_hash TEXT NOT NULL,
                    file_size INTEGER NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    uploaded_url TEXT,
                    attempts INTEGER NOT NULL DEFAULT 0,
                    last_error TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (event_id) REFERENCES outbox_events(id) ON DELETE CASCADE
                );

                CREATE INDEX IF NOT EXISTS idx_outbox_media_event_id
                    ON outbox_media (event_id);
                """)

    @staticmethod
    def _compute_sha256(path: Path) -> str:
        """Compute SHA-256 checksum of a file."""
        hasher = hashlib.sha256()
        with path.open("rb") as f:
            while chunk := f.read(65536):
                hasher.update(chunk)
        return hasher.hexdigest()

    def enqueue(
        self,
        event_type: str,
        payload: dict[str, Any],
        priority: int = 1,
        media_paths: list[str | Path] | None = None,
        max_attempts: int = 5,
    ) -> str:
        """Enqueue an event and optional associated media items into the outbox.

        Args:
            event_type: Type of event (e.g. 'observation', 'heartbeat').
            payload: Serializable dictionary containing event details.
            priority: Queue priority integer (higher = fetched first).
            media_paths: Optional list of local file paths to attach.
            max_attempts: Maximum retry attempts before marking failed.

        Returns:
            UUID string representing the enqueued event.
        """
        event_id = str(uuid.uuid4())
        now = datetime.now(UTC).isoformat()
        payload_str = json.dumps(payload, ensure_ascii=False)

        media_records: list[tuple[str, str, str, str, int, str]] = []
        if media_paths:
            for p in media_paths:
                fpath = Path(p)
                if not fpath.exists():
                    raise FileNotFoundError(f"Media file not found: {fpath}")
                fhash = self._compute_sha256(fpath)
                fsize = fpath.stat().st_size
                media_id = str(uuid.uuid4())
                media_records.append((media_id, event_id, str(fpath.resolve()), fhash, fsize, now))

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO outbox_events (
                    id, event_type, payload, priority, status, attempts,
                    max_attempts, next_retry_at, last_error, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 'PENDING', 0, ?, NULL, NULL, ?, ?)
                """,
                (event_id, event_type, payload_str, priority, max_attempts, now, now),
            )
            for m_id, e_id, path_str, m_hash, m_sz, m_now in media_records:
                conn.execute(
                    """
                    INSERT INTO outbox_media (
                        id, event_id, file_path, file_hash, file_size, status, attempts, created_at
                    ) VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?)
                    """,
                    (m_id, e_id, path_str, m_hash, m_sz, m_now),
                )
        return event_id

    def fetch_pending_batch(self, limit: int = 50) -> list[dict[str, Any]]:
        """Fetch a batch of pending events ready for upload.

        Filters out events scheduled for future retry and orders by priority DESC, created_at ASC.

        Args:
            limit: Maximum number of events to fetch.

        Returns:
            List of dictionary representations of ready events and their media.
        """
        now = datetime.now(UTC).isoformat()
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT id, event_type, payload, priority, status, attempts,
                       max_attempts, created_at, updated_at
                FROM outbox_events
                WHERE status = 'PENDING'
                  AND (next_retry_at IS NULL OR next_retry_at <= ?)
                ORDER BY priority DESC, created_at ASC
                LIMIT ?
                """,
                (now, limit),
            )
            rows = cursor.fetchall()
            results: list[dict[str, Any]] = []
            for row in rows:
                event_dict = dict(row)
                event_dict["payload"] = json.loads(event_dict["payload"])

                # Fetch associated media
                m_cursor = conn.execute(
                    """
                    SELECT id, file_path, file_hash, file_size, status, uploaded_url
                    FROM outbox_media
                    WHERE event_id = ?
                    """,
                    (event_dict["id"],),
                )
                event_dict["media"] = [dict(m) for m in m_cursor.fetchall()]
                results.append(event_dict)
            return results

    def mark_in_progress(self, event_ids: list[str]) -> None:
        """Mark events as IN_PROGRESS during active sync transmission.

        Args:
            event_ids: List of event IDs to transition.
        """
        if not event_ids:
            return
        now = datetime.now(UTC).isoformat()
        with self._get_connection() as conn:
            placeholders = ",".join("?" for _ in event_ids)
            query = f"""
                UPDATE outbox_events
                SET status = 'IN_PROGRESS', updated_at = ?
                WHERE id IN ({placeholders})
            """  # noqa: S608
            conn.execute(query, [now, *event_ids])

    def mark_completed(self, event_id: str) -> None:
        """Mark an event as successfully synced and COMPLETED.

        Args:
            event_id: Event ID to complete.
        """
        now = datetime.now(UTC).isoformat()
        with self._get_connection() as conn:
            conn.execute(
                """
                UPDATE outbox_events
                SET status = 'COMPLETED', updated_at = ?, last_error = NULL
                WHERE id = ?
                """,
                (now, event_id),
            )
            conn.execute(
                """
                UPDATE outbox_media
                SET status = 'UPLOADED'
                WHERE event_id = ?
                """,
                (event_id,),
            )

    def mark_failed(
        self,
        event_id: str,
        error_message: str,
        base_delay_seconds: int = 15,
    ) -> None:
        """Record sync failure, increment attempts, and calculate exponential backoff.

        If attempts reach max_attempts, status transitions to FAILED.
        Otherwise, status reverts to PENDING with next_retry_at set into the future.

        Args:
            event_id: Event ID that failed.
            error_message: Description of the error.
            base_delay_seconds: Base multiplier for exponential backoff.
        """
        now_dt = datetime.now(UTC)
        now = now_dt.isoformat()

        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT attempts, max_attempts FROM outbox_events WHERE id = ?",
                (event_id,),
            )
            row = cursor.fetchone()
            if not row:
                return

            current_attempts = row["attempts"] + 1
            max_attempts = row["max_attempts"]

            if current_attempts >= max_attempts:
                new_status = "FAILED"
                next_retry = None
            else:
                new_status = "PENDING"
                # Exponential backoff: base * 2^(attempts-1) with cap at 3600 seconds
                delay = min(base_delay_seconds * (2 ** (current_attempts - 1)), 3600)
                next_retry = (now_dt + timedelta(seconds=delay)).isoformat()

            conn.execute(
                """
                UPDATE outbox_events
                SET status = ?, attempts = ?, next_retry_at = ?,
                    last_error = ?, updated_at = ?
                WHERE id = ?
                """,
                (new_status, current_attempts, next_retry, error_message, now, event_id),
            )

    def check_quota_and_evict(self, max_database_bytes: int) -> int:
        """Evict oldest COMPLETED and FAILED events if database size exceeds threshold.

        Args:
            max_database_bytes: Maximum allowed size for the outbox DB in bytes.

        Returns:
            Number of evicted events.
        """
        if not self.db_path.exists():
            return 0

        current_size = self.db_path.stat().st_size
        if current_size <= max_database_bytes:
            return 0

        evicted_count = 0
        with self._get_connection() as conn:
            # 1. First evict COMPLETED events (oldest first)
            cursor = conn.execute("""
                SELECT id FROM outbox_events
                WHERE status = 'COMPLETED'
                ORDER BY created_at ASC
                """)
            completed_ids = [r["id"] for r in cursor.fetchall()]

            for e_id in completed_ids:
                conn.execute("DELETE FROM outbox_events WHERE id = ?", (e_id,))
                evicted_count += 1
                if self.db_path.stat().st_size <= max_database_bytes:
                    break

            # 2. If still over quota, evict FAILED events
            if self.db_path.stat().st_size > max_database_bytes:
                cursor = conn.execute("""
                    SELECT id FROM outbox_events
                    WHERE status = 'FAILED'
                    ORDER BY created_at ASC
                    """)
                failed_ids = [r["id"] for r in cursor.fetchall()]
                for e_id in failed_ids:
                    conn.execute("DELETE FROM outbox_events WHERE id = ?", (e_id,))
                    evicted_count += 1
                    if self.db_path.stat().st_size <= max_database_bytes:
                        break

        if evicted_count > 0:
            with sqlite3.connect(str(self.db_path), isolation_level=None) as autocommit_conn:
                autocommit_conn.execute("VACUUM;")

        return evicted_count

    def get_stats(self) -> dict[str, Any]:
        """Retrieve aggregated statistics on outbox queues and storage.

        Returns:
            Dictionary containing status counts and file sizes.
        """
        with self._get_connection() as conn:
            cursor = conn.execute("""
                SELECT
                    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
                    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS in_progress_count,
                    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed_count,
                    SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) AS failed_count,
                    COUNT(*) AS total_count
                FROM outbox_events
                """)
            stats = dict(cursor.fetchone() or {})

            m_cursor = conn.execute("""
                SELECT COUNT(*) AS total_media, COALESCE(SUM(file_size), 0) AS total_media_bytes
                FROM outbox_media
                """)
            media_stats = dict(m_cursor.fetchone() or {})

            stats["total_media"] = media_stats.get("total_media", 0)
            stats["total_media_bytes"] = media_stats.get("total_media_bytes", 0)
            stats["db_file_size_bytes"] = (
                self.db_path.stat().st_size if self.db_path.exists() else 0
            )

            # Ensure None values are formatted as 0
            for key in ["pending_count", "in_progress_count", "completed_count", "failed_count"]:
                if stats.get(key) is None:
                    stats[key] = 0

            return stats


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="SQLite outbox manager for edge device.")
    parser.add_argument(
        "--db-path",
        type=Path,
        default=Path("data/outbox.db"),
        help="Outbox database path.",
    )
    parser.add_argument(
        "--stats",
        action="store_true",
        help="Display outbox statistics and exit.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the outbox CLI."""
    args = parse_args(argv)
    manager = OutboxManager(args.db_path)

    if args.stats:
        stats = manager.get_stats()
        print(json.dumps(stats, indent=2))
        sys.exit(0)

    stats = manager.get_stats()
    p_cnt = stats["pending_count"]
    t_cnt = stats["total_count"]
    print(f"Outbox initialized at {args.db_path} | Pending: {p_cnt}, Total: {t_cnt}")


if __name__ == "__main__":
    main()
