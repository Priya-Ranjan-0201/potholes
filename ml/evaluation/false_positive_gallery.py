"""False positive detector and visual gallery generator for ScamRoad.

Identifies model false alarms (detections on road background or IoU < threshold
with ground truth annotations), crops the defect candidates, and compiles
a visual audit gallery in Markdown and JSON.
"""

from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import cv2
import yaml
from ultralytics import YOLO


def compute_iou(box1: list[float], box2: list[float]) -> float:
    """Compute Intersection over Union (IoU) of two xyxy boxes."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter_area = inter_w * inter_h

    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = area1 + area2 - inter_area

    return inter_area / union_area if union_area > 0 else 0.0


def load_ground_truth(label_path: Path, img_w: int, img_h: int) -> list[dict[str, Any]]:
    """Load YOLO format ground-truth labels and convert to xyxy pixel coordinates."""
    if not label_path.exists():
        return []

    boxes = []
    lines = label_path.read_text(encoding="utf-8").splitlines()
    for line in lines:
        parts = line.strip().split()
        if len(parts) >= 5:
            cls_id = int(parts[0])
            xc = float(parts[1]) * img_w
            yc = float(parts[2]) * img_h
            w = float(parts[3]) * img_w
            h = float(parts[4]) * img_h
            x1 = max(0.0, xc - w / 2.0)
            y1 = max(0.0, yc - h / 2.0)
            x2 = min(float(img_w), xc + w / 2.0)
            y2 = min(float(img_h), yc + h / 2.0)
            boxes.append({"class_id": cls_id, "xyxy": [x1, y1, x2, y2]})
    return boxes


def _extract_false_positive_box(
    img: Any,
    img_name: str,
    box_xyxy: list[float],
    conf: float,
    cls_name: str,
    max_iou: float,
    fp_id: int,
    crops_dir: Path,
) -> dict[str, Any]:
    """Crop and record a single false positive detection."""
    img_h, img_w = img.shape[:2]
    px1 = max(0, int(box_xyxy[0]))
    py1 = max(0, int(box_xyxy[1]))
    px2 = min(img_w, int(box_xyxy[2]))
    py2 = min(img_h, int(box_xyxy[3]))

    crop_fname = f"fp_{fp_id}_{Path(img_name).stem}.jpg"
    crop_path = crops_dir / crop_fname
    crop_img = img[py1:py2, px1:px2]
    if crop_img.size > 0:
        cv2.imwrite(str(crop_path), crop_img)

    return {
        "fp_id": fp_id,
        "source_image": img_name,
        "predicted_class": cls_name,
        "confidence": round(conf, 4),
        "max_gt_iou": round(max_iou, 4),
        "box_xyxy": [px1, py1, px2, py2],
        "crop_relative_path": f"crops/{crop_fname}",
    }


def _process_image_fps(
    img_p: Path,
    model: YOLO,
    class_names: dict[int, str],
    conf_thresh: float,
    iou_thresh: float,
    device: str,
    crops_dir: Path,
    annotated_dir: Path,
    current_fp_count: int,
    max_items: int,
) -> list[dict[str, Any]]:
    """Detect and save false positives for a single image."""
    img = cv2.imread(str(img_p))
    if img is None:
        return []

    img_h, img_w = img.shape[:2]
    label_p = Path(str(img_p).replace("images", "labels")).with_suffix(".txt")
    gt_boxes = load_ground_truth(label_p, img_w, img_h)

    preds = model.predict(img, conf=conf_thresh, device=device, verbose=False)
    if not preds or len(preds[0].boxes) == 0:
        return []

    new_fps: list[dict[str, Any]] = []
    annotated_img = img.copy()

    # Draw ground truth in green
    for gt in gt_boxes:
        gx1, gy1, gx2, gy2 = map(int, gt["xyxy"])
        cv2.rectangle(annotated_img, (gx1, gy1), (gx2, gy2), (0, 255, 0), 2)

    boxes = preds[0].boxes
    for b_idx in range(len(boxes)):
        if current_fp_count + len(new_fps) >= max_items:
            break

        xyxy = boxes.xyxy[b_idx].tolist()
        conf = float(boxes.conf[b_idx])
        cls_id = int(boxes.cls[b_idx])
        cls_name = str(class_names.get(cls_id, f"class_{cls_id}"))

        max_iou = 0.0
        for gt in gt_boxes:
            max_iou = max(max_iou, compute_iou(xyxy, gt["xyxy"]))

        if max_iou < iou_thresh:
            fp_id = current_fp_count + len(new_fps) + 1
            record = _extract_false_positive_box(
                img=img,
                img_name=img_p.name,
                box_xyxy=xyxy,
                conf=conf,
                cls_name=cls_name,
                max_iou=max_iou,
                fp_id=fp_id,
                crops_dir=crops_dir,
            )
            new_fps.append(record)

            px1, py1, px2, py2 = record["box_xyxy"]
            cv2.rectangle(annotated_img, (px1, py1), (px2, py2), (0, 0, 255), 2)
            cv2.putText(
                annotated_img,
                f"FP: {cls_name} {conf:.2f}",
                (px1, max(15, py1 - 5)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 255),
                1,
            )

    if new_fps:
        cv2.imwrite(str(annotated_dir / f"fp_annotated_{img_p.name}"), annotated_img)

    return new_fps


def _write_gallery_markdown(
    fp_records: list[dict[str, Any]],
    weights_path: Path,
    conf_thresh: float,
    iou_thresh: float,
    gallery_md: Path,
) -> None:
    """Format and write gallery markdown."""
    md_lines = [
        "# ScamRoad False-Positive Audit Gallery",
        "",
        f"**Generated At**: {datetime.now(UTC).isoformat()}  ",
        f"**Model**: `{weights_path}`  ",
        f"**Total False Positives Mined**: {len(fp_records)} "
        f"(Confidence >= {conf_thresh}, Max GT IoU < {iou_thresh})  ",
        "",
        "| ID | Source Image | Predicted Class | Confidence | Max GT IoU | Crop |",
        "|---|---|---|---|---|---|",
    ]
    for r in fp_records:
        img_crop = f"![{r['predicted_class']}]({r['crop_relative_path']})"
        line = (
            f"| {r['fp_id']} | `{r['source_image']}` | **{r['predicted_class']}** | "
            f"{r['confidence']} | {r['max_gt_iou']} | {img_crop} |"
        )
        md_lines.append(line)

    gallery_md.write_text("\n".join(md_lines) + "\n", encoding="utf-8")


def generate_false_positive_gallery(
    weights_path: Path,
    data_path: Path,
    split: str = "val",
    conf_thresh: float = 0.25,
    iou_thresh: float = 0.20,
    max_items: int = 50,
    device: str = "cpu",
    output_dir: Path | None = None,
) -> dict[str, Any]:
    """Mine false positives and produce visual gallery."""
    if not weights_path.exists():
        raise FileNotFoundError(f"Weights file not found: {weights_path}")
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset YAML not found: {data_path}")

    with data_path.open("r", encoding="utf-8") as f:
        data_cfg = yaml.safe_load(f)

    root_path = Path(data_cfg.get("path", data_path.parent))
    split_entry = data_cfg.get(split)
    if not split_entry:
        raise ValueError(f"Split '{split}' not specified in {data_path}")

    split_dir = (root_path / split_entry).resolve()
    valid_exts = {".jpg", ".jpeg", ".png", ".bmp"}

    if split_dir.is_dir():
        image_files = sorted(p for p in split_dir.iterdir() if p.suffix.lower() in valid_exts)
    elif split_dir.is_file():
        lines = split_dir.read_text(encoding="utf-8").splitlines()
        image_files = sorted(Path(line.strip()) for line in lines if line.strip())
    else:
        raise FileNotFoundError(f"Split directory or file not found: {split_dir}")

    gallery_dir = output_dir or Path("ml/runs/eval/false_positives")
    crops_dir = gallery_dir / "crops"
    annotated_dir = gallery_dir / "annotated"
    crops_dir.mkdir(parents=True, exist_ok=True)
    annotated_dir.mkdir(parents=True, exist_ok=True)

    model = YOLO(str(weights_path))
    raw_names = data_cfg.get("names", {})
    class_names = dict(enumerate(raw_names)) if isinstance(raw_names, list) else raw_names

    fp_records: list[dict[str, Any]] = []
    for img_p in image_files:
        if len(fp_records) >= max_items:
            break
        fps = _process_image_fps(
            img_p=img_p,
            model=model,
            class_names=class_names,
            conf_thresh=conf_thresh,
            iou_thresh=iou_thresh,
            device=device,
            crops_dir=crops_dir,
            annotated_dir=annotated_dir,
            current_fp_count=len(fp_records),
            max_items=max_items,
        )
        fp_records.extend(fps)

    _write_gallery_markdown(
        fp_records=fp_records,
        weights_path=weights_path,
        conf_thresh=conf_thresh,
        iou_thresh=iou_thresh,
        gallery_md=gallery_dir / "gallery.md",
    )

    summary = {
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "total_images_scanned": len(image_files),
        "total_false_positives": len(fp_records),
        "conf_threshold": conf_thresh,
        "iou_threshold": iou_thresh,
        "records": fp_records,
    }
    with (gallery_dir / "gallery.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mine false positives and build gallery.")
    parser.add_argument("--weights", type=Path, required=True, help="Model weights path (.pt)")
    parser.add_argument("--data", type=Path, default=Path("data/sample/splits/dataset.yaml"))
    parser.add_argument("--split", type=str, default="val", choices=["val", "test", "train"])
    parser.add_argument("--conf", type=float, default=0.25)
    parser.add_argument("--iou", type=float, default=0.20)
    parser.add_argument("--max-items", type=int, default=50)
    parser.add_argument("--device", type=str, default="cpu")
    parser.add_argument("--output-dir", type=Path, default=Path("ml/runs/eval/false_positives"))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    res = generate_false_positive_gallery(
        weights_path=args.weights,
        data_path=args.data,
        split=args.split,
        conf_thresh=args.conf,
        iou_thresh=args.iou,
        max_items=args.max_items,
        device=args.device,
        output_dir=args.output_dir,
    )
    count = res["total_false_positives"]
    scanned = res["total_images_scanned"]
    print(f"[GALLERY READY] Mined {count} false positives from {scanned} images.")


if __name__ == "__main__":
    main()
