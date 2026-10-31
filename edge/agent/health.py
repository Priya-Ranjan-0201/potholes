"""Edge device telemetry and health monitor.

Continuously tracks edge pipeline health:
- End-to-end processing FPS and inference latency
- Hardware load: CPU %, RAM RSS (MB), disk free GB, thermal sensors
- GPS fix validity and horizontal accuracy
- SQLite outbox queue depth (pending vs failed events)
Follows SPEC B4 (honest telemetry without fake/synthetic metrics).
"""

from __future__ import annotations

import argparse
import json
import platform
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import psutil


@dataclass
class EdgeHealthSnapshot:
    """Instantaneous telemetry snapshot of the edge device."""

    timestamp_utc: str
    uptime_seconds: float
    pipeline_fps: float
    avg_inference_ms: float
    frames_processed: int
    frames_dropped: int
    outbox_pending_count: int
    outbox_failed_count: int
    gps_has_fix: bool
    gps_accuracy_m: float | None
    cpu_percent: float
    ram_rss_mb: float
    disk_free_gb: float
    temperatures_c: dict[str, Any] | None


class EdgeHealthMonitor:
    """Samples and aggregates edge agent operational metrics."""

    def __init__(self, outbox_db_path: Path | None = None) -> None:
        self.outbox_db_path = outbox_db_path
        self.start_time = time.time()
        self.process = psutil.Process()
        self.frames_processed = 0
        self.frames_dropped = 0
        self.inference_latencies: list[float] = []
        self.last_frame_time = time.time()
        self._fps_window: list[float] = []

    def record_frame(self, inference_ms: float, dropped_in_buffer: int = 0) -> None:
        """Log completion of a single pipeline frame."""
        now = time.time()
        dt = now - self.last_frame_time
        self.last_frame_time = now

        self.frames_processed += 1
        self.frames_dropped = dropped_in_buffer
        self.inference_latencies.append(inference_ms)
        if len(self.inference_latencies) > 100:
            self.inference_latencies.pop(0)

        if dt > 0.001:
            self._fps_window.append(1.0 / dt)
            if len(self._fps_window) > 30:
                self._fps_window.pop(0)

    def get_snapshot(
        self, gps_has_fix: bool = False, gps_accuracy_m: float | None = None
    ) -> dict[str, Any]:
        """Generate full health snapshot dictionary."""
        uptime = round(time.time() - self.start_time, 1)
        fps = round(sum(self._fps_window) / len(self._fps_window), 1) if self._fps_window else 0.0
        avg_infer = (
            round(sum(self.inference_latencies) / len(self.inference_latencies), 2)
            if self.inference_latencies
            else 0.0
        )

        # Telemetry
        mem_rss = round(self.process.memory_info().rss / (1024 * 1024), 2)
        cpu_pct = psutil.cpu_percent(interval=None)

        disk_path = self.outbox_db_path.parent if self.outbox_db_path else Path(".")
        disk_free = round(psutil.disk_usage(str(disk_path)).free / (1024**3), 2)

        # Thermal sensors if supported
        temps: dict[str, Any] = {}
        if hasattr(psutil, "sensors_temperatures"):
            try:
                raw_t = psutil.sensors_temperatures()
                if raw_t:
                    for k, entries in raw_t.items():
                        temps[k] = [e.current for e in entries if hasattr(e, "current")]
            except Exception:
                temps = {}

        # Outbox depth
        pending_cnt = 0
        failed_cnt = 0
        if self.outbox_db_path and self.outbox_db_path.exists():
            try:
                with sqlite3.connect(str(self.outbox_db_path), timeout=2.0) as conn:
                    cur = conn.cursor()
                    cur.execute("SELECT status, COUNT(*) FROM outbox_events GROUP BY status")
                    counts = dict(cur.fetchall())
                    pending_cnt = counts.get("PENDING", 0)
                    failed_cnt = counts.get("FAILED", 0)
            except Exception:  # noqa: S110
                pass

        return {
            "uptime_seconds": uptime,
            "pipeline_fps": fps,
            "avg_inference_ms": avg_infer,
            "frames_processed": self.frames_processed,
            "frames_dropped": self.frames_dropped,
            "outbox": {
                "pending_events": pending_cnt,
                "failed_events": failed_cnt,
            },
            "gps": {
                "has_fix": gps_has_fix,
                "accuracy_m": gps_accuracy_m,
            },
            "system": {
                "platform": platform.platform(),
                "cpu_utilization_percent": cpu_pct,
                "ram_rss_mb": mem_rss,
                "disk_free_gb": disk_free,
                "temperatures": temps if temps else None,
            },
        }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Edge device health monitor.")
    parser.add_argument(
        "--outbox-db",
        type=Path,
        default=Path("data/edge_outbox.db"),
        help="Path to outbox SQLite DB.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the health monitor CLI."""
    args = parse_args(argv)
    monitor = EdgeHealthMonitor(outbox_db_path=args.outbox_db)
    snapshot = monitor.get_snapshot()
    print(json.dumps(snapshot, indent=2))


if __name__ == "__main__":
    main()
