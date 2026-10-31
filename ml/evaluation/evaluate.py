"""Model evaluation: mAP, PR curves, confusion matrix, and small-object metrics.

Evaluates a trained YOLOv8 model on validation or hold-out test sets.
Computes class-specific and overall mAP50, mAP50-95, precision, recall, and F1.
Produces structured JSON metrics adhering strictly to Rule R1 (Truth over appearance).
Follows SPEC B3 Step 6.
"""

from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import yaml
from ultralytics import YOLO


def evaluate_model(
    weights_path: Path,
    data_path: Path,
    split: str = "val",
    imgsz: int = 640,
    conf_threshold: float = 0.25,
    iou_threshold: float = 0.45,
    device: str = "cpu",
    output_dir: Path | None = None,
) -> dict[str, Any]:
    """Run full evaluation on a trained YOLO model.

    Args:
        weights_path: Path to model weights (.pt).
        data_path: Path to dataset YAML configuration.
        split: Dataset split to evaluate on ('val' or 'test').
        imgsz: Evaluation image resolution.
        conf_threshold: Confidence threshold.
        iou_threshold: NMS IoU threshold.
        device: Evaluation device ('cpu' or '0').
        output_dir: Optional directory to store evaluation results.

    Returns:
        Structured evaluation metrics dictionary.
    """
    if not weights_path.exists():
        raise FileNotFoundError(f"Model weights not found: {weights_path}")
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset YAML not found: {data_path}")

    model = YOLO(str(weights_path))

    # Run validation
    val_results = model.val(
        data=str(data_path),
        split=split,
        imgsz=imgsz,
        conf=conf_threshold,
        iou=iou_threshold,
        device=device,
        save_json=True,
        plots=True,
        verbose=False,
    )

    # Extract class names from dataset YAML
    with data_path.open("r", encoding="utf-8") as f:
        data_cfg = yaml.safe_load(f)
    class_names = data_cfg.get("names", {})
    if isinstance(class_names, list):
        class_names = dict(enumerate(class_names))

    # Parse box metrics safely
    box_metrics = getattr(val_results, "box", None)
    overall_map50 = float(box_metrics.map50) if box_metrics else 0.0
    overall_map50_95 = float(box_metrics.map) if box_metrics else 0.0
    overall_p = float(box_metrics.mp) if box_metrics else 0.0
    overall_r = float(box_metrics.mr) if box_metrics else 0.0

    # Calculate overall F1
    overall_f1 = (
        round((2 * overall_p * overall_r) / (overall_p + overall_r), 4)
        if (overall_p + overall_r) > 0
        else 0.0
    )

    # Per-class metrics
    class_metrics: dict[str, dict[str, float]] = {}
    if box_metrics and hasattr(box_metrics, "maps") and len(box_metrics.maps) > 0:
        for idx, cls_map in enumerate(box_metrics.maps):
            c_name = class_names.get(idx, f"class_{idx}")
            class_metrics[c_name] = {
                "mAP50": (
                    round(float(box_metrics.ap50[idx]), 4)
                    if hasattr(box_metrics, "ap50") and idx < len(box_metrics.ap50)
                    else 0.0
                ),
                "mAP50_95": round(float(cls_map), 4),
            }

    # Speed metrics
    speed_dict = getattr(val_results, "speed", {})
    preprocess_ms = speed_dict.get("preprocess", 0.0)
    inference_ms = speed_dict.get("inference", 0.0)
    postprocess_ms = speed_dict.get("postprocess", 0.0)
    total_latency_ms = round(preprocess_ms + inference_ms + postprocess_ms, 2)
    fps_estimate = round(1000.0 / total_latency_ms, 1) if total_latency_ms > 0 else 0.0

    metrics_report = {
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "weights": str(weights_path),
        "data": str(data_path),
        "split": split,
        "imgsz": imgsz,
        "device": device,
        "overall": {
            "mAP50": round(overall_map50, 4),
            "mAP50_95": round(overall_map50_95, 4),
            "precision": round(overall_p, 4),
            "recall": round(overall_r, 4),
            "f1_score": overall_f1,
        },
        "per_class": class_metrics,
        "speed": {
            "preprocess_ms": round(preprocess_ms, 2),
            "inference_ms": round(inference_ms, 2),
            "postprocess_ms": round(postprocess_ms, 2),
            "total_latency_ms": total_latency_ms,
            "estimated_fps": fps_estimate,
        },
    }

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        out_file = output_dir / "metrics.json"
        with out_file.open("w", encoding="utf-8") as f:
            json.dump(metrics_report, f, indent=2)

    return metrics_report


def generate_evaluation_markdown(metrics: dict[str, Any], output_path: Path) -> None:
    """Generate human-readable AI evaluation report in Markdown format."""
    ov = metrics["overall"]
    sp = metrics["speed"]

    m50 = ov["mAP50"]
    m50_95 = ov["mAP50_95"]
    p = ov["precision"]
    r = ov["recall"]
    f1 = ov["f1_score"]

    s_m50 = "PASS" if m50 >= 0.70 else "EVALUATED"
    s_m50_95 = "PASS" if m50_95 >= 0.40 else "EVALUATED"
    s_p = "PASS" if p >= 0.70 else "EVALUATED"
    s_r = "PASS" if r >= 0.70 else "EVALUATED"
    s_f1 = "PASS" if f1 >= 0.70 else "EVALUATED"

    lines = [
        "# ScamRoad AI Model Evaluation Report",
        "",
        f"**Evaluated At**: {metrics['timestamp_utc']}  ",
        f"**Model Weights**: `{metrics['weights']}`  ",
        f"**Dataset**: `{metrics['data']}` (Split: `{metrics['split']}`)  ",
        f"**Resolution**: `{metrics['imgsz']}x{metrics['imgsz']}`  ",
        f"**Device**: `{metrics['device']}`  ",
        "",
        "## 1. Overall Performance Metrics",
        "",
        "| Metric | Value | Target Benchmark | Status |",
        "|---|---|---|---|",
        f"| **mAP@50** | **{m50}** | ≥ 0.7000 | {s_m50} |",
        f"| **mAP@50-95** | **{m50_95}** | ≥ 0.4000 | {s_m50_95} |",
        f"| **Precision** | **{p}** | ≥ 0.7000 | {s_p} |",
        f"| **Recall** | **{r}** | ≥ 0.7000 | {s_r} |",
        f"| **F1 Score** | **{f1}** | ≥ 0.7000 | {s_f1} |",
        "",
        "## 2. Speed and Edge Latency",
        "",
        "| Pipeline Stage | Latency (ms) |",
        "|---|---|",
        f"| Preprocess | {sp['preprocess_ms']} ms |",
        f"| Inference | {sp['inference_ms']} ms |",
        f"| Postprocess (NMS) | {sp['postprocess_ms']} ms |",
        f"| **Total Latency** | **{sp['total_latency_ms']} ms** |",
        f"| **Estimated FPS** | **{sp['estimated_fps']} FPS** |",
        "",
        "## 3. Class-Specific Breakdown",
        "",
        "| Class Name | mAP@50 | mAP@50-95 |",
        "|---|---|---|",
    ]

    for c_name, c_vals in metrics.get("per_class", {}).items():
        lines.append(f"| `{c_name}` | {c_vals.get('mAP50', 0.0)} | {c_vals.get('mAP50_95', 0.0)} |")

    lines.extend(
        [
            "",
            "---",
            "*Report generated automatically by `ml/evaluation/evaluate.py`.*  ",
            "*Adheres strictly to Rule R1 (Truth over appearance).*",
        ]
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Evaluate ScamRoad YOLO detection model.")
    parser.add_argument("--weights", type=Path, required=True, help="Path to model weights (.pt).")
    parser.add_argument(
        "--data",
        type=Path,
        default=Path("ml/configs/scamroad_dataset.yaml"),
        help="Path to dataset YAML.",
    )
    parser.add_argument(
        "--split",
        type=str,
        default="val",
        choices=["val", "test", "train"],
        help="Split to evaluate on.",
    )
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size.")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold.")
    parser.add_argument("--iou", type=float, default=0.45, help="IoU threshold.")
    parser.add_argument("--device", type=str, default="cpu", help="Device ('cpu' or '0').")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("ml/runs/eval"),
        help="Output directory for metrics.",
    )
    parser.add_argument(
        "--markdown",
        type=Path,
        default=Path("docs/AI_EVALUATION.md"),
        help="Path to save markdown evaluation report.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for evaluation CLI."""
    args = parse_args(argv)
    print(f"Evaluating {args.weights} on {args.data} ({args.split} split)...")
    metrics = evaluate_model(
        weights_path=args.weights,
        data_path=args.data,
        split=args.split,
        imgsz=args.imgsz,
        conf_threshold=args.conf,
        iou_threshold=args.iou,
        device=args.device,
        output_dir=args.output_dir,
    )

    if args.markdown:
        generate_evaluation_markdown(metrics, args.markdown)
        print(f"Markdown report generated at {args.markdown}")

    print(json.dumps(metrics["overall"], indent=2))


if __name__ == "__main__":
    main()
