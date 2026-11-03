"""Label unification and conversion module.

Converts Pascal VOC XML and COCO JSON annotations to normalized YOLO format.
Supports remapping existing YOLO annotations to ScamRoad taxonomy.
Maps all source classes to canonical codes defined in shared/taxonomy.yaml.
Clamps and validates all bounding boxes and logs invalid/dropped entries.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import defusedxml.ElementTree as ET  # noqa: N817
import yaml
from PIL import Image

# Default class mapping from RDD2022 raw codes to YOLO class indices
# Indexed strictly to match Tier 1 and Tier 2 taxonomy classes
DEFAULT_CLASS_MAPPING: dict[str, dict[str, Any]] = {
    # RDD2022 codes
    "D40": {"code": "POTHOLE", "index": 0},
    "D00": {"code": "CRACK_LONG", "index": 1},
    "D10": {"code": "CRACK_TRANS", "index": 2},
    "D20": {"code": "CRACK_ALLIGATOR", "index": 3},
    # Common variations / Kaggle pothole datasets
    "pothole": {"code": "POTHOLE", "index": 0},
    "Pothole": {"code": "POTHOLE", "index": 0},
    "potholes": {"code": "POTHOLE", "index": 0},
    "longitudinal crack": {"code": "CRACK_LONG", "index": 1},
    "transverse crack": {"code": "CRACK_TRANS", "index": 2},
    "alligator crack": {"code": "CRACK_ALLIGATOR", "index": 3},
}


def load_taxonomy_mapping(taxonomy_path: Path) -> dict[str, dict[str, Any]]:
    """Load taxonomy and build dynamic class name to YOLO index mapping."""
    if not taxonomy_path.exists():
        return dict(DEFAULT_CLASS_MAPPING)

    with open(taxonomy_path, encoding="utf-8") as f:
        tax = yaml.safe_load(f)

    mapping = dict(DEFAULT_CLASS_MAPPING)
    for idx, item in enumerate(tax.get("classes", [])):
        code = item.get("code")
        if code:
            mapping[code] = {"code": code, "index": idx}
            mapping[code.lower()] = {"code": code, "index": idx}
        rdd_class = item.get("rdd_class")
        if rdd_class:
            mapping[rdd_class] = {"code": code, "index": idx}

    return mapping


def parse_voc_xml(xml_file: Path) -> dict[str, Any]:
    """Parse a single Pascal VOC XML file into structured dictionary."""
    tree = ET.parse(xml_file)
    root = tree.getroot()

    filename = root.findtext("filename", default=xml_file.stem + ".jpg")
    size_elem = root.find("size")

    if size_elem is not None:
        width = float(size_elem.findtext("width", default="0"))
        height = float(size_elem.findtext("height", default="0"))
    else:
        width, height = 0.0, 0.0

    objects = []
    for obj in root.findall("object"):
        name = obj.findtext("name", default="").strip()
        bndbox = obj.find("bndbox")
        if bndbox is not None:
            xmin = float(bndbox.findtext("xmin", default="0"))
            ymin = float(bndbox.findtext("ymin", default="0"))
            xmax = float(bndbox.findtext("xmax", default="0"))
            ymax = float(bndbox.findtext("ymax", default="0"))
            objects.append(
                {
                    "name": name,
                    "bndbox": (xmin, ymin, xmax, ymax),
                }
            )

    return {
        "filename": filename,
        "width": width,
        "height": height,
        "objects": objects,
    }


def convert_box_to_yolo(
    box: tuple[float, float, float, float],
    img_width: float,
    img_height: float,
    min_box_size_px: float = 2.0,
) -> tuple[float, float, float, float] | None:
    """Validate, clamp, and convert VOC (xmin, ymin, xmax, ymax) to YOLO (x, y, w, h).

    Returns None if box is degraded or invalid.
    """
    xmin, ymin, xmax, ymax = box

    # Clamping
    xmin = max(0.0, min(xmin, img_width))
    ymin = max(0.0, min(ymin, img_height))
    xmax = max(0.0, min(xmax, img_width))
    ymax = max(0.0, min(ymax, img_height))

    box_w = xmax - xmin
    box_h = ymax - ymin

    if box_w < min_box_size_px or box_h < min_box_size_px:
        return None

    x_center = (xmin + xmax) / (2.0 * img_width)
    y_center = (ymin + ymax) / (2.0 * img_height)
    norm_w = box_w / img_width
    norm_h = box_h / img_height

    # Clamping normalized values to [0.0, 1.0]
    x_center = max(0.0, min(1.0, x_center))
    y_center = max(0.0, min(1.0, y_center))
    norm_w = max(0.0, min(1.0, norm_w))
    norm_h = max(0.0, min(1.0, norm_h))

    return (x_center, y_center, norm_w, norm_h)


def convert_annotations_directory(  # noqa: PLR0912, PLR0915
    xml_dir: Path,
    output_labels_dir: Path,
    taxonomy_path: Path | None = None,
    image_dir: Path | None = None,
) -> dict[str, Any]:
    """Convert all VOC XML annotations in a directory to YOLO txt format."""
    if taxonomy_path is None:
        taxonomy_path = Path("shared/taxonomy.yaml")

    class_map = load_taxonomy_mapping(taxonomy_path)
    output_labels_dir.mkdir(parents=True, exist_ok=True)

    summary: dict[str, Any] = {
        "format": "voc",
        "total_xml_files": 0,
        "total_objects_parsed": 0,
        "total_objects_converted": 0,
        "total_objects_dropped": 0,
        "dropped_reasons": {
            "unmapped_class": 0,
            "invalid_dimensions": 0,
            "degenerated_box": 0,
        },
        "per_class_counts": {},
        "dropped_details": [],
    }

    xml_files = sorted(xml_dir.glob("*.xml"))
    if not xml_files:
        xml_files = sorted(xml_dir.rglob("*.xml"))
    summary["total_xml_files"] = len(xml_files)

    for xml_file in xml_files:
        parsed = parse_voc_xml(xml_file)
        img_w = parsed["width"]
        img_h = parsed["height"]

        # If width/height missing in XML, attempt to inspect image if image_dir given
        if (img_w <= 0 or img_h <= 0) and image_dir is not None:
            img_file = image_dir / (xml_file.stem + ".jpg")
            if not img_file.exists():
                img_file = image_dir / (xml_file.stem + ".png")
            if img_file.exists():
                with Image.open(img_file) as im:
                    img_w, img_h = float(im.width), float(im.height)

        yolo_lines = []

        for obj in parsed["objects"]:
            summary["total_objects_parsed"] += 1
            raw_name = obj["name"]

            if raw_name not in class_map:
                summary["total_objects_dropped"] += 1
                summary["dropped_reasons"]["unmapped_class"] += 1
                summary["dropped_details"].append(
                    {
                        "file": xml_file.name,
                        "reason": f"Unmapped class: {raw_name}",
                    }
                )
                continue

            if img_w <= 0 or img_h <= 0:
                summary["total_objects_dropped"] += 1
                summary["dropped_reasons"]["invalid_dimensions"] += 1
                summary["dropped_details"].append(
                    {
                        "file": xml_file.name,
                        "reason": f"Invalid image dimensions: {img_w}x{img_h}",
                    }
                )
                continue

            yolo_box = convert_box_to_yolo(obj["bndbox"], img_w, img_h)
            if yolo_box is None:
                summary["total_objects_dropped"] += 1
                summary["dropped_reasons"]["degenerated_box"] += 1
                summary["dropped_details"].append(
                    {
                        "file": xml_file.name,
                        "box": obj["bndbox"],
                        "reason": "Degenerated or sub-pixel box",
                    }
                )
                continue

            cls_info = class_map[raw_name]
            cls_idx = cls_info["index"]
            cls_code = cls_info["code"]

            yolo_lines.append(
                f"{cls_idx} {yolo_box[0]:.6f} {yolo_box[1]:.6f} {yolo_box[2]:.6f} {yolo_box[3]:.6f}"
            )
            summary["total_objects_converted"] += 1
            summary["per_class_counts"][cls_code] = summary["per_class_counts"].get(cls_code, 0) + 1

        # Write output YOLO label file
        out_txt = output_labels_dir / (xml_file.stem + ".txt")
        with open(out_txt, "w", encoding="utf-8") as f:
            if yolo_lines:
                f.write("\n".join(yolo_lines) + "\n")

    # Generate empty label files for unannotated images in image_dir (background samples)
    if image_dir is not None and image_dir.exists():
        valid_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
        xml_stems = {f.stem for f in xml_files}
        bg_count = 0
        for img_p in image_dir.rglob("*"):
            if (
                img_p.is_file()
                and img_p.suffix.lower() in valid_exts
                and img_p.stem not in xml_stems
            ):
                bg_txt = output_labels_dir / (img_p.stem + ".txt")
                if not bg_txt.exists():
                    bg_txt.write_text("", encoding="utf-8")
                    bg_count += 1
        summary["background_images_created"] = bg_count

    return summary


def convert_coco_json(  # noqa: PLR0915
    coco_json_path: Path,
    output_labels_dir: Path,
    taxonomy_path: Path | None = None,
    custom_category_map: dict[str | int, str] | None = None,
) -> dict[str, Any]:
    """Convert COCO JSON annotations (e.g. from Kaggle/Roboflow) to YOLO txt format.

    Args:
        coco_json_path: Path to COCO instances JSON file.
        output_labels_dir: Output directory to store .txt labels.
        taxonomy_path: Path to shared/taxonomy.yaml.
        custom_category_map: Optional mapping from COCO category_id or name to taxonomy code.
    """
    if taxonomy_path is None:
        taxonomy_path = Path("shared/taxonomy.yaml")

    class_map = load_taxonomy_mapping(taxonomy_path)
    output_labels_dir.mkdir(parents=True, exist_ok=True)

    with open(coco_json_path, encoding="utf-8") as f:
        coco = json.load(f)

    # Build image map: id -> {file_name, width, height}
    images_map: dict[int, dict[str, Any]] = {
        img["id"]: {
            "file_name": img["file_name"],
            "width": float(img.get("width", 0)),
            "height": float(img.get("height", 0)),
            "stem": Path(img["file_name"]).stem,
        }
        for img in coco.get("images", [])
    }

    # Build category map: id -> category_name
    coco_cat_map: dict[int, str] = {cat["id"]: cat["name"] for cat in coco.get("categories", [])}

    summary: dict[str, Any] = {
        "format": "coco",
        "total_images": len(images_map),
        "total_annotations": len(coco.get("annotations", [])),
        "total_objects_converted": 0,
        "total_objects_dropped": 0,
        "dropped_reasons": {
            "unmapped_class": 0,
            "invalid_dimensions": 0,
            "degenerated_box": 0,
        },
        "per_class_counts": {},
    }

    annotations_by_img: dict[int, list[dict[str, Any]]] = {}
    for ann in coco.get("annotations", []):
        img_id = ann["image_id"]
        annotations_by_img.setdefault(img_id, []).append(ann)

    for img_id, img_info in images_map.items():
        w = img_info["width"]
        h = img_info["height"]
        stem = img_info["stem"]
        anns = annotations_by_img.get(img_id, [])

        yolo_lines = []
        for ann in anns:
            cat_id = ann.get("category_id")
            raw_cat_name = coco_cat_map.get(cat_id, str(cat_id))

            # Resolve canonical taxonomy target
            target_code = None
            if custom_category_map and (
                cat_id in custom_category_map or raw_cat_name in custom_category_map
            ):
                target_code = custom_category_map.get(cat_id) or custom_category_map.get(
                    raw_cat_name
                )
            elif raw_cat_name in class_map:
                target_code = class_map[raw_cat_name]["code"]
            elif str(cat_id) in class_map:
                target_code = class_map[str(cat_id)]["code"]

            if not target_code or target_code not in class_map:
                summary["total_objects_dropped"] += 1
                summary["dropped_reasons"]["unmapped_class"] += 1
                continue

            if w <= 0 or h <= 0:
                summary["total_objects_dropped"] += 1
                summary["dropped_reasons"]["invalid_dimensions"] += 1
                continue

            # COCO bbox format: [xmin, ymin, width, height]
            bbox = ann.get("bbox", [])
            if len(bbox) != 4:
                summary["total_objects_dropped"] += 1
                summary["dropped_reasons"]["degenerated_box"] += 1
                continue

            xmin, ymin, bw, bh = bbox
            xmax = xmin + bw
            ymax = ymin + bh

            yolo_box = convert_box_to_yolo((xmin, ymin, xmax, ymax), w, h)
            if yolo_box is None:
                summary["total_objects_dropped"] += 1
                summary["dropped_reasons"]["degenerated_box"] += 1
                continue

            cls_info = class_map[target_code]
            cls_idx = cls_info["index"]

            yolo_lines.append(
                f"{cls_idx} {yolo_box[0]:.6f} {yolo_box[1]:.6f} {yolo_box[2]:.6f} {yolo_box[3]:.6f}"
            )
            summary["total_objects_converted"] += 1
            summary["per_class_counts"][target_code] = (
                summary["per_class_counts"].get(target_code, 0) + 1
            )

        out_txt = output_labels_dir / f"{stem}.txt"
        with open(out_txt, "w", encoding="utf-8") as f:
            if yolo_lines:
                f.write("\n".join(yolo_lines) + "\n")

    return summary


def remap_yolo_labels(
    input_labels_dir: Path,
    output_labels_dir: Path,
    class_mapping: dict[int, int],
) -> dict[str, Any]:
    """Remap class IDs in existing YOLO txt labels.

    Args:
        input_labels_dir: Source directory of YOLO txt files.
        output_labels_dir: Target directory for remapped YOLO txt files.
        class_mapping: Dict mapping source class_id -> new class_id.
                       If mapped to -1, the annotation is dropped.
    """
    output_labels_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "format": "yolo_remap",
        "total_files": 0,
        "total_boxes_processed": 0,
        "total_boxes_kept": 0,
        "total_boxes_dropped": 0,
    }

    for txt_file in input_labels_dir.glob("*.txt"):
        summary["total_files"] += 1
        lines_out = []
        with open(txt_file, encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split()
                if not parts:
                    continue
                summary["total_boxes_processed"] += 1
                old_cls = int(parts[0])
                if old_cls in class_mapping and class_mapping[old_cls] >= 0:
                    new_cls = class_mapping[old_cls]
                    parts[0] = str(new_cls)
                    lines_out.append(" ".join(parts))
                    summary["total_boxes_kept"] += 1
                else:
                    summary["total_boxes_dropped"] += 1

        out_file = output_labels_dir / txt_file.name
        with open(out_file, "w", encoding="utf-8") as f:
            if lines_out:
                f.write("\n".join(lines_out) + "\n")

    return summary


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Convert Pascal VOC XML, COCO JSON, or remap YOLO annotations."
    )
    parser.add_argument(
        "--format",
        choices=["voc", "coco", "yolo-remap"],
        default="voc",
        help="Input annotation format.",
    )
    parser.add_argument(
        "--xml-dir",
        "--input-dir",
        dest="xml_dir",
        type=Path,
        default=None,
        help="Directory containing VOC XML files.",
    )
    parser.add_argument(
        "--coco-json", type=Path, default=None, help="Path to COCO instances JSON file."
    )
    parser.add_argument(
        "--input-labels-dir",
        type=Path,
        default=None,
        help="Source directory for YOLO remapping.",
    )
    parser.add_argument(
        "--output-dir",
        "--out-dir",
        dest="output_dir",
        type=Path,
        required=True,
        help="Directory to save YOLO .txt labels.",
    )
    parser.add_argument(
        "--image-dir",
        "--images-dir",
        dest="image_dir",
        type=Path,
        default=None,
        help="Directory containing images.",
    )
    tax_default = (
        Path("configs/taxonomy.yaml")
        if Path("configs/taxonomy.yaml").exists()
        else Path("shared/taxonomy.yaml")
    )
    parser.add_argument(
        "--taxonomy",
        type=Path,
        default=tax_default,
        help="Path to taxonomy.yaml (default: configs/taxonomy.yaml).",
    )
    parser.add_argument(
        "--report",
        type=Path,
        default=Path("ml/runs/audit/conversion_summary.json"),
        help="Output JSON report path.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """CLI entrypoint."""
    args = parse_args(argv)

    if args.format == "voc":
        if not args.xml_dir:
            raise ValueError("--xml-dir is required when --format is voc")
        print(f"Converting VOC annotations from {args.xml_dir} to {args.output_dir}...")
        summary = convert_annotations_directory(
            xml_dir=args.xml_dir,
            output_labels_dir=args.output_dir,
            taxonomy_path=args.taxonomy,
            image_dir=args.image_dir,
        )
    elif args.format == "coco":
        if not args.coco_json:
            raise ValueError("--coco-json is required when --format is coco")
        print(f"Converting COCO annotations from {args.coco_json} to {args.output_dir}...")
        summary = convert_coco_json(
            coco_json_path=args.coco_json,
            output_labels_dir=args.output_dir,
            taxonomy_path=args.taxonomy,
        )
    elif args.format == "yolo-remap":
        if not args.input_labels_dir:
            raise ValueError("--input-labels-dir is required when --format is yolo-remap")
        # Default remap: identity
        summary = remap_yolo_labels(
            input_labels_dir=args.input_labels_dir,
            output_labels_dir=args.output_dir,
            class_mapping={0: 0, 1: 1, 2: 2, 3: 3},
        )
    else:
        raise ValueError(f"Unknown format: {args.format}")

    args.report.parent.mkdir(parents=True, exist_ok=True)
    with open(args.report, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(f"Conversion complete! Report saved to {args.report}")


if __name__ == "__main__":
    main()
