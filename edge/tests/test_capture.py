"""Unit tests for edge capture, ring buffer, and quality gating."""

from unittest.mock import MagicMock

import cv2
import numpy as np

from edge.agent.capture import FrameCapture, QualityGate


def test_quality_gate_blur_and_brightness() -> None:
    """Verify Laplacian variance and brightness assessment."""
    q_gate = QualityGate(blur_threshold=50.0, min_brightness=30.0, max_brightness=220.0)

    # Sharp image with high frequency edges
    sharp_img = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.rectangle(sharp_img, (50, 50), (150, 150), (255, 255, 255), -1)

    meta_sharp = q_gate.assess_frame(sharp_img, frame_id=1)
    assert not meta_sharp.is_blurred
    assert meta_sharp.blur_score > 50.0
    assert meta_sharp.exposure_ok

    # Smooth blurred image
    blurred_img = cv2.GaussianBlur(sharp_img, (25, 25), 0)
    meta_blurred = q_gate.assess_frame(blurred_img, frame_id=2)
    assert meta_blurred.is_blurred


def test_quality_gate_roi_crop() -> None:
    """Verify road Region of Interest cropping."""
    q_gate = QualityGate(roi_top_ratio=0.40, roi_bottom_ratio=1.0)
    frame = np.zeros((1000, 800, 3), dtype=np.uint8)

    roi, (_x, y, w, h) = q_gate.extract_road_roi(frame)
    assert y == 400
    assert h == 600
    assert w == 800
    assert roi.shape == (600, 800, 3)


def test_frame_capture_ring_buffer_drop() -> None:
    """Verify non-blocking ring buffer drops oldest frames when backpressured."""
    q_gate = QualityGate()
    cap = FrameCapture(source=0, buffer_size=4, quality_gate=q_gate)

    # Mock video capture
    mock_cv_cap = MagicMock()
    dummy_frame = np.zeros((100, 100, 3), dtype=np.uint8)
    mock_cv_cap.read.return_value = (True, dummy_frame)
    mock_cv_cap.isOpened.return_value = True

    cap._cap = mock_cv_cap  # noqa: SLF001

    # Push 6 frames into capacity 4 buffer
    for i in range(6):
        meta = q_gate.assess_frame(dummy_frame, frame_id=i + 1)
        if cap._frame_queue.full():  # noqa: SLF001
            cap._frame_queue.get_nowait()  # noqa: SLF001
            cap._dropped_frames += 1  # noqa: SLF001
        cap._frame_queue.put_nowait((dummy_frame, meta))  # noqa: SLF001

    assert cap._frame_queue.qsize() == 4  # noqa: SLF001
    assert cap.dropped_frames == 2

    # Verify oldest remaining is frame #3
    first_out = cap.get_frame(timeout=0.1)
    assert first_out is not None
    assert first_out[1].frame_id == 3
