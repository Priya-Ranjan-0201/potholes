"""Unit tests for edge inference, letterboxing, NMS, and Rule R2/R4 compliance."""

from pathlib import Path

import numpy as np
import pytest

from edge.agent.infer import (
    EdgeInferenceEngine,
    ModelNotReadyError,
    letterbox_image,
    nms_boxes,
)


def test_letterbox_image() -> None:
    """Verify aspect ratio preservation and padding math."""
    img = np.zeros((400, 800, 3), dtype=np.uint8)
    padded, scale, (pad_left, pad_top) = letterbox_image(img, target_shape=(640, 640))

    assert padded.shape == (640, 640, 3)
    # Scale: 640 / 800 = 0.8
    assert pytest.approx(scale, 0.01) == 0.8
    # New height: 400 * 0.8 = 320 -> pad_top: (640 - 320) / 2 = 160
    assert pad_top == 160
    assert pad_left == 0


def test_nms_boxes() -> None:
    """Verify Non-Maximum Suppression suppresses overlapping redundant boxes."""
    boxes = [
        (100.0, 100.0, 200.0, 200.0),
        (105.0, 105.0, 205.0, 205.0),  # High overlap with box 0
        (400.0, 400.0, 500.0, 500.0),  # Disjoint box
    ]
    scores = [0.90, 0.70, 0.85]

    keep = nms_boxes(boxes, scores, iou_threshold=0.45)
    assert 0 in keep  # Best score of first cluster
    assert 1 not in keep  # Suppressed
    assert 2 in keep  # Separate cluster


def test_infer_engine_missing_model_raises_r2(tmp_path: Path) -> None:
    """Verify Rule R2: Missing model must raise ModelNotReadyError (no fake AI)."""
    fake_model_path = tmp_path / "non_existent_model.onnx"
    with pytest.raises(ModelNotReadyError):
        EdgeInferenceEngine(model_path=fake_model_path)


def test_infer_engine_predict_real_onnx() -> None:
    """Verify inference execution against the trained INT8 ONNX model."""
    model_path = Path("ml/runs/pothole_yolov8n/weights/best_int8.onnx")
    if not model_path.exists():
        pytest.skip("best_int8.onnx not present on disk")

    engine = EdgeInferenceEngine(model_path=model_path, conf_threshold=0.1)

    # Synthetic test image
    test_img = np.zeros((640, 640, 3), dtype=np.uint8)
    detections = engine.predict(test_img)

    assert isinstance(detections, list)
    for d in detections:
        assert d.calibrated is False  # Rule R4
        assert 0.0 <= d.confidence <= 1.0
        assert 0.0 <= d.relative_area <= 1.0
        assert len(d.bbox_xyxy) == 4
