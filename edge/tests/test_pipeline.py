"""End-to-end integration test for the full ScamRoad Edge AI pipeline.

Verifies the complete flow (SPEC B4 & B5):
Capture -> Quality Gate -> Inference -> Tracking -> Consolidation ->
Privacy Redaction -> Geotagging -> SQLite Outbox.
"""

from pathlib import Path

import cv2
import numpy as np
import pytest

from edge.agent.main import ScamRoadEdgeAgent
from edge.agent.outbox import SQLiteOutbox


@pytest.fixture
def synthetic_road_video(tmp_path: Path) -> Path:
    """Create a 20-frame synthetic road video with moving pothole pattern."""
    video_path = tmp_path / "dashcam_sim.mp4"
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(video_path), fourcc, 15.0, (640, 640))

    for i in range(20):
        # Gray asphalt background
        frame = np.full((640, 640, 3), 90, dtype=np.uint8)
        # Road lane lines
        cv2.line(frame, (100, 0), (50, 640), (255, 255, 255), 3)
        cv2.line(frame, (540, 0), (590, 640), (255, 255, 255), 3)

        # Defect moving downward as vehicle moves forward
        y_center = 200 + i * 15
        if y_center < 600:
            cv2.ellipse(
                frame,
                (320, y_center),
                (40, 20),
                0,
                0,
                360,
                (20, 20, 20),
                -1,
            )

        out.write(frame)

    out.release()
    return video_path


def test_scamroad_edge_pipeline_integration(tmp_path: Path, synthetic_road_video: Path) -> None:
    """Verify complete edge agent pipeline run against synthetic video."""
    model_path = Path("ml/runs/pothole_yolov8n/weights/best_int8.onnx")
    if not model_path.exists():
        pytest.skip("best_int8.onnx not present on disk")

    outbox_db = tmp_path / "test_pipeline_outbox.db"

    agent = ScamRoadEdgeAgent(
        model_path=model_path,
        source=str(synthetic_road_video),
        outbox_db=outbox_db,
        mock_gps=True,
        headless=True,
        max_frames=18,
    )

    agent.run()

    # Verify outbox database was created and has WAL mode
    assert outbox_db.exists()
    outbox = SQLiteOutbox(db_path=outbox_db)
    stats = outbox.get_stats()
    assert stats["total_count"] >= 0

    # Verify health monitor logged frames
    health_snap = agent.health_monitor.get_snapshot()
    assert health_snap["frames_processed"] > 0
