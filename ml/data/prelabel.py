"""Model pre-labelling engine for CVAT and active learning frame selection.

Adheres to Stage 8 specification:
- Runs trained YOLO detector on unlabelled dashcam frames.
- Formats bounding boxes for CVAT export.
- Computes prediction uncertainty scores for active learning sampling.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ultralytics import YOLO


def generate_prelabels(
    model_path: Path,
    image_paths: list[Path],
    conf_thresh: float = 0.25,
    device: str = "cpu",
) -> list[dict[str, Any]]:
    """Generate pre-labelled bounding boxes and uncertainty scores for images."""
    model = YOLO(str(model_path))
    results = []

    for img_p in image_paths:
        res = model.predict(str(img_p), conf=conf_thresh, device=device, verbose=False)[0]
        boxes = []
        confs = []

        if res.boxes is not None and len(res.boxes) > 0:
            for b in res.boxes:
                cls_id = int(b.cls[0])
                c_score = float(b.conf[0])
                xyxy = b.xyxy[0].tolist()
                boxes.append({
                    "class_id": cls_id,
                    "confidence": round(c_score, 4),
                    "bbox_xyxy": [round(x, 1) for x in xyxy],
                })
                confs.append(c_score)

        # Uncertainty: margin from 0.5 decision boundary or inverse confidence
        uncertainty = round(1.0 - (sum(confs) / len(confs)), 4) if confs else 1.0

        results.append({
            "image": str(img_p),
            "filename": img_p.name,
            "box_count": len(boxes),
            "boxes": boxes,
            "uncertainty_score": uncertainty,
        })

    return results


def select_active_learning_batch(prelabeled_results: list[dict[str, Any]], top_k: int = 10) -> list[dict[str, Any]]:
    """Select the top_k most uncertain images to maximize annotation ROI."""
    sorted_candidates = sorted(
        prelabeled_results,
        key=lambda x: (x["box_count"] > 0, x["uncertainty_score"]),
        reverse=True,
    )
    return sorted_candidates[:top_k]

