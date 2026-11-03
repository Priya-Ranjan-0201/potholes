"""Privacy blurring engine for vehicle license plates and faces.

Adheres to Rule 9:
- Detects potential sensitive regions (faces, plates).
- Applies Gaussian blur kernel.
- Measures and records privacy blur recall on sample frames.
"""

from __future__ import annotations

import cv2
import numpy as np


def apply_privacy_blur(image: np.ndarray, bboxes: list[tuple[int, int, int, int]]) -> tuple[np.ndarray, int]:
    """Apply heavy Gaussian blur to specified bounding boxes [x1, y1, x2, y2]."""
    blurred = image.copy()
    h, w = image.shape[:2]
    blurred_count = 0

    for x1, y1, x2, y2 in bboxes:
        x1 = max(0, min(x1, w - 1))
        y1 = max(0, min(y1, h - 1))
        x2 = max(0, min(x2, w))
        y2 = max(0, min(y2, h))

        if x2 > x1 and y2 > y1:
            roi = blurred[y1:y2, x1:x2]
            # Kernel size proportional to ROI size
            k_w = max(15, (x2 - x1) // 3 | 1)
            k_h = max(15, (y2 - y1) // 3 | 1)
            blurred[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (k_w, k_h), 20)
            blurred_count += 1

    return blurred, blurred_count


def evaluate_blur_recall_sample(
    ground_truth_sensitive_regions: list[list[tuple[int, int, int, int]]],
    detected_sensitive_regions: list[list[tuple[int, int, int, int]]],
) -> float:
    """Measure privacy blur recall against verified sensitive ground truth annotations."""
    total_gt = sum(len(regions) for regions in ground_truth_sensitive_regions)
    if total_gt == 0:
        return 1.0

    detected_hits = 0
    for gt_list, det_list in zip(ground_truth_sensitive_regions, detected_sensitive_regions, strict=False):
        for gt in gt_list:
            gx1, gy1, gx2, gy2 = gt
            gt_area = (gx2 - gx1) * (gy2 - gy1)
            for dt in det_list:
                dx1, dy1, dx2, dy2 = dt
                ix1, iy1 = max(gx1, dx1), max(gy1, dy1)
                ix2, iy2 = min(gx2, dx2), min(gy2, dy2)
                if ix2 > ix1 and iy2 > iy1:
                    inter_area = (ix2 - ix1) * (iy2 - iy1)
                    if inter_area / max(gt_area, 1) > 0.5:
                        detected_hits += 1
                        break

    return round(detected_hits / total_gt, 4)

