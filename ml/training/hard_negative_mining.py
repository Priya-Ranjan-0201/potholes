"""Hard Negative Mining for ScamRoad YOLO models.

Finds false positive detections in background scenes (shadows, manholes,
water puddles, paint markings, patches) and creates zero-defect background samples
to retrain and regularize the detector against spurious alerts.
Follows SPEC B3 Step 5.
"""

from __future__ import annotations

import argparse
import json
import shutil
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from ultralytics import YOLO


def mine_hard_negatives(
    model_path: Path,
    negative_images_dir: Path,
    output_images_dir: Path,
    output_labels_dir: Path,
    confidence_threshold: float = 0.25,
    max_samples: int = 500,
    iou_threshold: float = 0.45,
) -> dict[str, Any]:
    """Run model on candidate negative images and save false positives as background samples.

    Args:
        model_path: Path to trained YOLO weights (.pt).
        negative_images_dir: Directory containing negative road imagery (no defects).
        output_images_dir: Target directory to store mined images.
        output_labels_dir: Target directory to store empty label files.
        confidence_threshold: Confidence above which false positives are flagged.
        max_samples: Maximum hard negative samples to mine.
        iou_threshold: NMS IoU threshold.

    Returns:
        Dictionary report of mined hard negatives.
    """
    if not model_path.exists():
        raise FileNotFoundError(f"Model checkpoint not found: {model_path}")
    if not negative_images_dir.exists():
        raise FileNotFoundError(f"Negative images directory not found: {negative_images_dir}")

    output_images_dir.mkdir(parents=True, exist_ok=True)
    output_labels_dir.mkdir(parents=True, exist_ok=True)

    model = YOLO(str(model_path))

    # Collect valid images
    valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    candidate_images = [
        p for p in negative_images_dir.rglob("*") if p.is_file() and p.suffix.lower() in valid_exts
    ]

    mined_count = 0
    total_false_positives = 0
    mined_details: list[dict[str, Any]] = []

    for img_path in candidate_images:
        if mined_count >= max_samples:
            break

        results = model.predict(
            source=str(img_path),
            conf=confidence_threshold,
            iou=iou_threshold,
            verbose=False,
        )

        boxes = results[0].boxes
        if len(boxes) > 0:
            # False positive detected in negative background image!
            fp_count = len(boxes)
            confs = [float(c) for c in boxes.conf.tolist()]
            classes = [int(cls) for cls in boxes.cls.tolist()]
            max_conf = max(confs)

            # Copy image to target images dir
            dest_img = output_images_dir / img_path.name
            shutil.copy2(img_path, dest_img)

            # Create EMPTY label file (YOLO standard for background images)
            dest_label = output_labels_dir / f"{img_path.stem}.txt"
            dest_label.write_text("", encoding="utf-8")

            mined_count += 1
            total_false_positives += fp_count
            mined_details.append(
                {
                    "image": img_path.name,
                    "false_positive_count": fp_count,
                    "max_confidence": round(max_conf, 4),
                    "classes_triggered": classes,
                }
            )

    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "model_weights": str(model_path),
        "confidence_threshold": confidence_threshold,
        "scanned_images": len(candidate_images),
        "mined_hard_negatives": mined_count,
        "total_false_positives_flagged": total_false_positives,
        "samples": mined_details,
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments for hard negative mining."""
    parser = argparse.ArgumentParser(description="Mine hard negative background samples.")
    parser.add_argument("--weights", type=Path, required=True, help="Trained YOLO weights path.")
    parser.add_argument(
        "--source",
        type=Path,
        required=True,
        help="Directory containing negative road images.",
    )
    parser.add_argument(
        "--output-images",
        type=Path,
        default=Path("data/backgrounds/images"),
        help="Output images directory.",
    )
    parser.add_argument(
        "--output-labels",
        type=Path,
        default=Path("data/backgrounds/labels"),
        help="Output labels directory.",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.25,
        help="Confidence threshold for false positive triggers.",
    )
    parser.add_argument(
        "--max-samples",
        type=int,
        default=500,
        help="Maximum hard negatives to harvest.",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("ml/runs/hard_negatives/summary.json"),
        help="Path to save mining JSON report.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for hard negative mining CLI."""
    args = parse_args(argv)
    report = mine_hard_negatives(
        model_path=args.weights,
        negative_images_dir=args.source,
        output_images_dir=args.output_images,
        output_labels_dir=args.output_labels,
        confidence_threshold=args.conf,
        max_samples=args.max_samples,
    )

    args.report.parent.mkdir(parents=True, exist_ok=True)
    with args.report.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    cnt = report["mined_hard_negatives"]
    fp = report["total_false_positives_flagged"]
    print(f"Mined {cnt} hard negatives ({fp} false positives). Saved to {args.report}")


if __name__ == "__main__":
    main()
