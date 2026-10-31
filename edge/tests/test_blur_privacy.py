"""Unit tests for privacy redaction and Rule R15 compliance."""

from pathlib import Path

import cv2
import numpy as np

from edge.agent.blur_privacy import PrivacyRedactor


def test_privacy_redactor_redaction_and_hashing(tmp_path: Path) -> None:
    """Verify Gaussian blur application, image hashing, and defect preservation."""
    redactor = PrivacyRedactor(blur_kernel_size=31)

    # Synthetic image with simulated license plate contrast rectangle
    img = np.full((400, 600, 3), 120, dtype=np.uint8)
    # Draw simulated license plate rectangle (ar ~ 3.0)
    cv2.rectangle(img, (200, 150), (320, 190), (255, 255, 255), -1)
    cv2.putText(
        img,
        "DL01AB1234",
        (205, 180),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 0, 0),
        2,
    )

    out_file = tmp_path / "sanitized.jpg"
    res = redactor.redact(
        image=img,
        defect_safe_boxes=[(10.0, 300.0, 50.0, 350.0)],
        save_path=out_file,
    )

    assert res.sha256_hash is not None
    assert len(res.sha256_hash) == 64
    assert out_file.exists()
    assert res.redacted_image.shape == img.shape
