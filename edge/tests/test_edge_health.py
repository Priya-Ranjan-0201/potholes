"""Unit tests for edge device operational health monitoring."""

from pathlib import Path

from edge.agent.health import EdgeHealthMonitor


def test_edge_health_monitor_snapshot(tmp_path: Path) -> None:
    """Verify health monitor telemetry generation."""
    db_file = tmp_path / "outbox.db"
    monitor = EdgeHealthMonitor(outbox_db_path=db_file)

    # Record some frame activity
    monitor.record_frame(inference_ms=18.5, dropped_in_buffer=0)
    monitor.record_frame(inference_ms=21.2, dropped_in_buffer=1)

    snap = monitor.get_snapshot(gps_has_fix=True, gps_accuracy_m=4.5)

    assert snap["frames_processed"] == 2
    assert snap["frames_dropped"] == 1
    assert snap["avg_inference_ms"] > 0.0
    assert snap["gps"]["has_fix"] is True
    assert snap["gps"]["accuracy_m"] == 4.5
    assert "system" in snap
    assert snap["system"]["ram_rss_mb"] > 0.0
    assert snap["system"]["cpu_utilization_percent"] >= 0.0
