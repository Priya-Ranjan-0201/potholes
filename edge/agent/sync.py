"""Sync client and SQLite WAL outbox integration.

Reads consolidated defect observations, formats payloads conforming strictly to
shared JSON schemas (`sync-batch.schema.json` and `observation.schema.json`),
stores them in the transactional SQLite outbox with media SHA-256 hashes,
and manages idempotent, resumable synchronization to the backend API.
Follows SPEC B4 (offline-first, idempotency keys, exponential backoff).
"""

from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.request
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING, Any

from edge.agent.outbox import SQLiteOutbox

if TYPE_CHECKING:
    from edge.agent.geotag import GPSFix
    from edge.agent.track import DefectCandidate


class SyncClient:
    """Manages packaging defect candidates into outbox events and syncing them to backend."""

    def __init__(
        self,
        outbox: SQLiteOutbox,
        device_id: str | None = None,
        model_version: str = "scamroad-yolov8n-v1.0",
    ) -> None:
        self.outbox = outbox
        self.device_id = device_id or str(uuid.uuid4())
        self.model_version = model_version

    def stage_candidate_to_outbox(
        self,
        candidate: DefectCandidate,
        gps_fix: GPSFix,
        media_path: Path | None = None,
        media_sha256: str | None = None,
    ) -> str:
        """Format DefectCandidate into an Observation payload and enqueue into SQLite outbox."""
        obs_id = str(uuid.uuid4())
        defect_id = str(uuid.uuid4())  # Server dedup maps this to canonical defect

        now_iso = datetime.now(UTC).isoformat()

        bbox = candidate.best_bbox_xyxy
        bw = round(float(bbox[2] - bbox[0]), 2)
        bh = round(float(bbox[3] - bbox[1]), 2)

        observation_payload: dict[str, Any] = {
            "observation_id": obs_id,
            "defect_id": defect_id,
            "device_id": self.device_id,
            "inspection_id": None,
            "detection_id": candidate.candidate_id,
            "location": {
                "latitude": gps_fix.latitude,
                "longitude": gps_fix.longitude,
                "accuracy_m": (
                    round(gps_fix.accuracy_m, 2) if gps_fix.accuracy_m is not None else None
                ),
                "speed_mps": gps_fix.speed_mps,
                "heading_deg": gps_fix.heading_deg,
                "altitude_m": gps_fix.altitude_m,
            },
            "confidence": candidate.median_confidence,
            "class_code": candidate.class_name,
            "measurement_summary": {
                "relative_area": candidate.median_relative_area,
                "bbox_width_px": bw,
                "bbox_height_px": bh,
                "unit": candidate.unit,
                "calibrated": candidate.calibrated,
            },
            "best_frame_path": str(media_path) if media_path else None,
            "track_length_frames": candidate.frames_seen,
            "quality_score": round(
                candidate.median_confidence * min(1.0, candidate.frames_seen / 5.0),
                4,
            ),
            "observed_at": datetime.fromtimestamp(candidate.first_seen_epoch, tz=UTC).isoformat(),
            "created_at": now_iso,
        }

        idempotency_key = f"obs-{candidate.candidate_id}"

        return self.outbox.enqueue(
            event_type="DEFECT_OBSERVED",
            payload=observation_payload,
            idempotency_key=idempotency_key,
            media_path=media_path,
            media_sha256=media_sha256,
            priority=10,
        )

    def sync_pending_events(
        self,
        api_url: str,
        device_token: str | None = None,
        max_batch_size: int = 20,
        dry_run: bool = False,
    ) -> dict[str, Any]:
        """Fetch pending outbox records, bundle into a SyncBatch, and sync to backend API."""
        pending_events = self.outbox.peek_pending(limit=max_batch_size)
        if not pending_events:
            return {
                "synced_count": 0,
                "failed_count": 0,
                "status": "IDLE",
                "message": "No pending events in outbox",
            }

        batch_id = str(uuid.uuid4())
        idempotency_key = f"batch-{batch_id}"
        sent_at_iso = datetime.now(UTC).isoformat()

        observations = [e["payload"] for e in pending_events]
        event_ids = [e.get("id") or e.get("event_id", "") for e in pending_events]

        media_manifest = []
        for e in pending_events:
            media_items = e.get("media", [])
            for m in media_items:
                p = Path(m.get("file_path", ""))
                size = m.get("file_size") or (p.stat().st_size if p.exists() else 1024)
                media_manifest.append(
                    {
                        "media_id": m.get("id", str(uuid.uuid4())),
                        "filename": p.name,
                        "sha256": m.get("file_hash", "0" * 64),
                        "mime_type": "image/jpeg",
                        "size_bytes": size,
                        "observation_ids": [e["payload"].get("observation_id")],
                    }
                )

        sync_batch_payload = {
            "batch_id": batch_id,
            "device_id": self.device_id,
            "idempotency_key": idempotency_key,
            "model_version": self.model_version,
            "observations": observations,
            "media_manifest": media_manifest,
            "sent_at": sent_at_iso,
            "retry_count": 0,
        }

        if dry_run:
            # Mark all as completed in dry-run mode
            for eid in event_ids:
                self.outbox.mark_completed(eid)
            return {
                "synced_count": len(event_ids),
                "failed_count": 0,
                "status": "DRY_RUN_SUCCESS",
                "batch_id": batch_id,
            }

        target_url = f"{api_url.rstrip('/')}/api/v1/sync"
        req_data = json.dumps(sync_batch_payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "X-Idempotency-Key": idempotency_key,
            "X-Device-ID": self.device_id,
        }
        if device_token:
            headers["Authorization"] = f"Bearer {device_token}"

        req = urllib.request.Request(  # noqa: S310
            target_url, data=req_data, headers=headers, method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=10.0) as resp:  # noqa: S310
                if resp.status in (200, 201):
                    for eid in event_ids:
                        self.outbox.mark_completed(eid)
                    return {
                        "synced_count": len(event_ids),
                        "failed_count": 0,
                        "status": "SYNCED",
                        "batch_id": batch_id,
                    }
                for eid in event_ids:
                    self.outbox.mark_failed(eid, f"HTTP status {resp.status}")
                return {
                    "synced_count": 0,
                    "failed_count": len(event_ids),
                    "status": "SERVER_ERROR",
                }
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as e:
            err_msg = str(e)
            for eid in event_ids:
                self.outbox.mark_failed(eid, err_msg)
            return {
                "synced_count": 0,
                "failed_count": len(event_ids),
                "status": "OFFLINE_BACKOFF",
                "error": err_msg,
            }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Sync service for edge-to-cloud upload.")
    parser.add_argument(
        "--api-url",
        type=str,
        default="http://localhost:8000",
        help="Backend API base URL.",
    )
    parser.add_argument(
        "--outbox-db",
        type=Path,
        default=Path("data/edge_outbox.db"),
        help="SQLite outbox database path.",
    )
    parser.add_argument("--batch-size", type=int, default=10, help="Maximum events per batch.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Simulate sync without network requests.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the sync CLI."""
    args = parse_args(argv)
    outbox = SQLiteOutbox(db_path=args.outbox_db)
    client = SyncClient(outbox=outbox)

    print(f"Initiating edge sync to {args.api_url} (Outbox: {args.outbox_db})...")
    stats = client.sync_pending_events(
        api_url=args.api_url,
        max_batch_size=args.batch_size,
        dry_run=args.dry_run,
    )
    st = stats["status"]
    sc = stats["synced_count"]
    fc = stats["failed_count"]
    print(f"Sync finished: Status={st} | Synced={sc} | Failed={fc}")


if __name__ == "__main__":
    main()
