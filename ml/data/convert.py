"""Label unification and conversion module.

Converts Pascal VOC XML annotations to normalized YOLO format.
Maps all source classes to canonical codes defined in shared/taxonomy.yaml.
Clamps and validates all bounding boxes and logs invalid/dropped entries.
"""

import argparse
import json
from pathlib import Path

import defusedxml.ElementTree as ET  # noqa: N817
import yaml
from PIL import Image

# Default class mapping from RDD2022 raw codes to YOLO class indices
# Indexed strictly to match Tier 1 and Tier 2 taxonomy classes
DEFAULT_CLASS_MAPPING = {
    # RDD2022 codes
    "D40": {"code": "POTHOLE", "index": 0},
    "D00": {"code": "CRACK_LONG", "index": 1},
    "D10": {"code": "CRACK_TRANS", "index": 2},
    "D20": {"code": "CRACK_ALLIGATOR", "index": 3},
    # Common variations / Kaggle pothole datasets
    "pothole": {"code": "POTHOLE", "index": 0},
    "Pothole": {"code": "POTHOLE", "index": 0},
    "longitudinal crack": {"code": "CRACK_LONG", "index": 1},
    "transverse crack": {"code": "CRACK_TRANS", "index": 2},
    "alligator crack": {"code": "CRACK_ALLIGATOR", "index": 3},
}


def load_taxonomy_mapping(taxonomy_path: Path) -> dict:
    """Load taxonomy and build dynamic class name to YOLO index mapping."""
    if not taxonomy_path.exists():
        return DEFAULT_CLASS_MAPPING

    with open(taxonomy_path, encoding="utf-8") as f:
        tax = yaml.safe_load(f)

    mapping = dict(DEFAULT_CLASS_MAPPING)
    for idx, item in enumerate(tax.get("classes", [])):
        code = item.get("code")
        mapping[code] = {"code": code, "index": idx}
        rdd_class = item.get("rdd_class")
        if rdd_class:
            mapping[rdd_class] = {"code": code, "index": idx}

    return mapping


def parse_voc_xml(xml_file: Path) -> dict:
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


def convert_annotations_directory(
    xml_dir: Path,
    output_labels_dir: Path,
    taxonomy_path: Path | None = None,
    image_dir: Path | None = None,
) -> dict:
    """Convert all VOC XML annotations in a directory to YOLO txt format."""
    if taxonomy_path is None:
        taxonomy_path = Path("shared/taxonomy.yaml")

    class_map = load_taxonomy_mapping(taxonomy_path)
    output_labels_dir.mkdir(parents=True, exist_ok=True)

    summary = {
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

    return summary


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Convert Pascal VOC XML annotations to YOLO format."
    )
    parser.add_argument(
        "--xml-dir", type=Path, required=True, help="Directory containing VOC XML files."
    )
    parser.add_argument(
        "--output-dir", type=Path, required=True, help="Directory to save YOLO .txt labels."
    )
    parser.add_argument("--image-dir", type=Path, default=None, help="Directory containing images.")
    parser.add_argument(
        "--taxonomy", type=Path, default=Path("shared/taxonomy.yaml"), help="Path to taxonomy.yaml."
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
    print(f"Converting annotations from {args.xml_dir} to {args.output_dir}...")
    summary = convert_annotations_directory(
        xml_dir=args.xml_dir,
        output_labels_dir=args.output_dir,
        taxonomy_path=args.taxonomy,
        image_dir=args.image_dir,
    )
    args.report.parent.mkdir(parents=True, exist_ok=True)
    with open(args.report, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(
        f"Conversion complete! Converted: {summary['total_objects_converted']}, "
        f"Dropped: {summary['total_objects_dropped']}. Report saved to {args.report}"
    )


if __name__ == "__main__":
    main()
