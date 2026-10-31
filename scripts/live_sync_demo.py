"""Live demonstration script for Phase 6 edge-to-cloud sync and spatial processing."""

from __future__ import annotations

import hashlib
import json
import sqlite3
import sys
import urllib.request
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from edge.agent.outbox import SQLiteOutbox
from edge.agent.sync import SyncClient

DB_PATH = "data/edge_outbox.db"
API_URL = "http://127.0.0.1:8000"


def _reset_outbox() -> SQLiteOutbox:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE outbox_events SET status = 'PENDING', attempts = 0;")
    conn.commit()
    conn.close()
    return SQLiteOutbox(DB_PATH)


def _upload_sample_media() -> None:
    media_dir = Path("data/edge_media")
    media_files = list(media_dir.glob("*.jpg"))
    if not media_files:
        return

    test_file = media_files[0]
    content = test_file.read_bytes()
    sha256 = hashlib.sha256(content).hexdigest()
    print(f"\n[Media Upload] Uploading frame: {test_file.name} ({len(content)} bytes)...")

    boundary = "----WebKitFormBoundaryScamRoadTest"
    body = bytearray()
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(
        f'Content-Disposition: form-data; name="file"; filename="{test_file.name}"\r\n'.encode()
    )
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
    body.extend(content)
    body.extend(b"\r\n")

    media_uuid = str(uuid.uuid4())
    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="media_id"\r\n\r\n')
    body.extend(f"{media_uuid}\r\n".encode())

    body.extend(f"--{boundary}\r\n".encode())
    body.extend(b'Content-Disposition: form-data; name="sha256_hash"\r\n\r\n')
    body.extend(f"{sha256}\r\n".encode())
    body.extend(f"--{boundary}--\r\n".encode())

    upload_req = urllib.request.Request(  # noqa: S310
        f"{API_URL}/api/v1/media/upload",
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(upload_req, timeout=5.0) as upload_resp:  # noqa: S310
        upload_res = json.loads(upload_resp.read().decode("utf-8"))
        print(
            f"[Media Upload Result] Status: {upload_res.get('status')} | "
            f"Media ID: {upload_res.get('media_id')} | "
            f"Privacy Blurred: {upload_res.get('is_privacy_blurred')}"
        )


def main() -> None:
    """Run live edge-to-backend sync demo."""
    print("=== SCAMROAD PHASE 6: LIVE EDGE-TO-CLOUD SYNC VERIFICATION ===")

    outbox = _reset_outbox()
    stats_before = outbox.get_stats()
    print(
        f"[Outbox Before Sync] Pending: {stats_before['pending_count']} | "
        f"Total: {stats_before['total_count']}"
    )

    sync_client = SyncClient(
        outbox=outbox,
        device_id="4a9b6c0e-7d12-4f38-9e11-123456789abc",
        model_version="scamroad-yolov8n-v1.0",
    )

    print(f"\n[Edge Sync] Initiating HTTP POST /api/v1/sync to {API_URL}...")
    result = sync_client.sync_pending_events(api_url=API_URL, max_batch_size=20, dry_run=False)
    print(
        f"[Edge Sync Result] Status: {result.get('status')} | "
        f"Synced: {result.get('synced_count')} | Failed: {result.get('failed_count')}"
    )

    stats_after = outbox.get_stats()
    print(
        f"[Outbox After Sync] Pending: {stats_after['pending_count']} | "
        f"Completed: {stats_after['completed_count']}"
    )

    print(f"\n[Backend Verification] Fetching canonical defects from {API_URL}/api/v1/defects...")
    req = urllib.request.Request(f"{API_URL}/api/v1/defects?limit=10", method="GET")  # noqa: S310
    with urllib.request.urlopen(req, timeout=5.0) as resp:  # noqa: S310
        defects_data = json.loads(resp.read().decode("utf-8"))
        print(f"[Backend Defects] Total Canonical Defects: {defects_data['total']}")
        for d in defects_data["items"][:5]:
            print(
                f"  - [{d['class_code']}] Seen={d['times_seen']}x | "
                f"Severity={d['latest_severity_score']}% ({d['latest_severity_level']}) | "
                f"Coords=({d['latitude']:.5f}, {d['longitude']:.5f})"
            )

    print(f"\n[Map Verification] Fetching GeoJSON from {API_URL}/api/v1/map/geojson...")
    map_req = urllib.request.Request(f"{API_URL}/api/v1/map/geojson", method="GET")  # noqa: S310
    with urllib.request.urlopen(map_req, timeout=5.0) as resp:  # noqa: S310
        geojson_data = json.loads(resp.read().decode("utf-8"))
        print(f"[GeoJSON Map] Total Features={len(geojson_data['features'])}")

    _upload_sample_media()

    print("\n=== LIVE SYNC VERIFICATION COMPLETED SUCCESSFULLY ===")


if __name__ == "__main__":
    main()
