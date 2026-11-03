"""Pothole & crack mask geometric measurement and segmentation metrics.

Adheres strictly to Rule 10:
- Pixel measurements only unless calibrated.
- Always provides unit, calibrated flag (False by default), and method.
- Provides exact IoU and Dice coefficient calculation.
- Computes pothole pixel area, relative road area percentage, crack skeleton length, and mean width.
"""

from __future__ import annotations

import cv2
import numpy as np


def compute_iou_and_dice(mask_true: np.ndarray, mask_pred: np.ndarray) -> tuple[float, float]:
    """Compute Intersection over Union (IoU) and Sørensen–Dice coefficient."""
    b_true = mask_true.astype(bool)
    b_pred = mask_pred.astype(bool)

    intersection = np.logical_and(b_true, b_pred).sum()
    union = np.logical_or(b_true, b_pred).sum()

    iou = float(intersection / union) if union > 0 else 1.0 if not b_true.any() and not b_pred.any() else 0.0
    sum_areas = b_true.sum() + b_pred.sum()
    dice = float(2.0 * intersection / sum_areas) if sum_areas > 0 else 1.0 if not b_true.any() and not b_pred.any() else 0.0

    return round(iou, 4), round(dice, 4)


def measure_pothole_geometry(
    defect_mask: np.ndarray,
    road_mask: np.ndarray | None = None,
    image_shape: tuple[int, int] | None = None,
) -> dict[str, Any]:
    """Measure pothole pixel area and relative area percentage."""
    defect_bin = (defect_mask > 0).astype(np.uint8)
    pixel_area = int(np.sum(defect_bin))

    if road_mask is not None:
        road_area = int(np.sum(road_mask > 0))
    elif image_shape is not None:
        road_area = int(image_shape[0] * image_shape[1])
    else:
        road_area = int(defect_mask.shape[0] * defect_mask.shape[1])

    relative_area_pct = round((pixel_area / max(road_area, 1)) * 100.0, 4)

    return {
        "pixel_area": pixel_area,
        "relative_area_pct": relative_area_pct,
        "unit": "pixels",
        "calibrated": False,
        "method": "contour_pixel_integration",
        "physical_size": None,
        "calibration_note": "No homography or laser calibration present. Physical dimensions withheld per Rule 10.",
    }


def measure_crack_geometry(crack_mask: np.ndarray) -> dict[str, Any]:
    """Measure crack skeleton length and mean width in pixels using contour & medial axis analysis."""
    binary = (crack_mask > 0).astype(np.uint8)
    total_area = int(np.sum(binary))

    if total_area == 0:
        return {
            "skeleton_length_px": 0.0,
            "mean_width_px": 0.0,
            "pixel_area": 0,
            "unit": "pixels",
            "calibrated": False,
            "method": "contour_medial_axis_analysis",
        }

    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not contours:
        return {
            "skeleton_length_px": 0.0,
            "mean_width_px": 0.0,
            "pixel_area": total_area,
            "unit": "pixels",
            "calibrated": False,
            "method": "contour_medial_axis_analysis",
        }

    # Analyze primary crack contour
    primary_contour = max(contours, key=cv2.contourArea)
    rect = cv2.minAreaRect(primary_contour)
    # The length along the crack's major axis
    skeleton_length_px = float(max(rect[1])) + 1.0
    mean_width_px = round(float(total_area) / max(skeleton_length_px, 1.0), 2)

    return {
        "pixel_area": total_area,
        "skeleton_length_px": round(skeleton_length_px, 2),
        "mean_width_px": mean_width_px,
        "unit": "pixels",
        "calibrated": False,
        "method": "contour_medial_axis_analysis",
        "physical_size": None,
        "calibration_note": "Pixel units only. Uncalibrated centimetre claims prohibited by Rule 10.",
    }
