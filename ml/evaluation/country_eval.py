"""Per-country evaluation for ScamRoad road damage detection.

Evaluates trained YOLO models broken down by country (e.g., India, Japan, Czech,
United_States, Norway, China). Supports RDD2022 multi-national benchmarks.
"""

from __future__ import annotations

import argparse
import json
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import yaml
from ultralytics import YOLO


def extract_country_name(image_path: Path) -> str:
    """Extract country prefix from RDD2022 image filename."""
    stem = image_path.stem
    known_prefixes = [
        "United_States",
        "China_Drone",
        "China_MotorBike",
        "India",
        "Japan",
        "Czech",
        "Norway",
    ]
    for prefix in known_prefixes:
        if stem.startswith(prefix):
            return prefix
    parts = stem.split("_")
    return parts[0] if parts else "Unknown"


def _collect_split_images(data_path: Path, split: str) -> tuple[dict[str, Any], list[Path]]:
    """Load split image file paths from dataset descriptor."""
    with data_path.open("r", encoding="utf-8") as f:
        data_cfg = yaml.safe_load(f)

    root_path = Path(data_cfg.get("path", data_path.parent))
    split_entry = data_cfg.get(split)
    if not split_entry:
        raise ValueError(f"Split '{split}' not specified in {data_path}")

    split_dir = (root_path / split_entry).resolve()
    valid_exts = {".jpg", ".jpeg", ".png", ".bmp"}

    if split_dir.is_dir():
        image_files = [p for p in split_dir.iterdir() if p.suffix.lower() in valid_exts]
    elif split_dir.is_file():
        lines = split_dir.read_text(encoding="utf-8").splitlines()
        image_files = [Path(line.strip()) for line in lines if line.strip()]
    else:
        raise FileNotFoundError(f"Split directory or file not found: {split_dir}")

    return data_cfg, image_files


def _eval_single_country(
    model: YOLO,
    country: str,
    paths: list[Path],
    names: dict[int, str] | list[str],
    imgsz: int,
    device: str,
    tmp_path: Path,
) -> dict[str, Any]:
    """Evaluate YOLO on a single country's image collection."""
    list_file = tmp_path / f"{country}.txt"
    with list_file.open("w", encoding="utf-8") as f:
        for p in paths:
            f.write(f"{p.as_posix()}\n")

    sub_yaml = tmp_path / f"dataset_{country}.yaml"
    with sub_yaml.open("w", encoding="utf-8") as f:
        yaml.dump({"names": names, "val": str(list_file)}, f)

    try:
        res = model.val(
            data=str(sub_yaml),
            split="val",
            imgsz=imgsz,
            device=device,
            plots=False,
            verbose=False,
        )
        box = getattr(res, "box", None)
        mp = round(float(box.mp), 4) if box else 0.0
        mr = round(float(box.mr), 4) if box else 0.0
        map50 = round(float(box.map50), 4) if box else 0.0
        map50_95 = round(float(box.map), 4) if box else 0.0
        f1 = round((2 * mp * mr) / (mp + mr), 4) if (mp + mr) > 0 else 0.0

        class_dict = dict(enumerate(names)) if isinstance(names, list) else names
        per_class_map = {}
        if box and hasattr(box, "maps") and len(box.maps) > 0:
            for idx, ap in enumerate(box.maps):
                c_str = class_dict.get(idx, f"class_{idx}")
                per_class_map[c_str] = round(float(ap), 4)

        return {
            "image_count": len(paths),
            "precision": mp,
            "recall": mr,
            "f1": f1,
            "map50": map50,
            "map50_95": map50_95,
            "per_class_map50_95": per_class_map,
        }
    except Exception as err:
        return {"image_count": len(paths), "error": str(err)}


def evaluate_per_country(
    weights_path: Path,
    data_path: Path,
    split: str = "val",
    imgsz: int = 640,
    device: str = "cpu",
    output_dir: Path | None = None,
) -> dict[str, Any]:
    """Run evaluation segmented by country."""
    if not weights_path.exists():
        raise FileNotFoundError(f"Model weights not found: {weights_path}")
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset YAML not found: {data_path}")

    data_cfg, image_files = _collect_split_images(data_path, split)

    country_images: dict[str, list[Path]] = {}
    for img_p in image_files:
        c_name = extract_country_name(img_p)
        country_images.setdefault(c_name, []).append(img_p)

    model = YOLO(str(weights_path))
    names = data_cfg.get("names", {})
    country_results: dict[str, Any] = {}

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_path = Path(tmp_dir)
        for country, paths in sorted(country_images.items()):
            country_results[country] = _eval_single_country(
                model=model,
                country=country,
                paths=paths,
                names=names,
                imgsz=imgsz,
                device=device,
                tmp_path=tmp_path,
            )

    report = {
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "weights": str(weights_path),
        "split": split,
        "total_countries": len(country_images),
        "per_country": country_results,
    }

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        with (output_dir / "country_metrics.json").open("w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

    return report


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate ScamRoad detector per country.")
    parser.add_argument("--weights", type=Path, required=True, help="Model weights path (.pt)")
    parser.add_argument("--data", type=Path, default=Path("data/sample/splits/dataset.yaml"))
    parser.add_argument("--split", type=str, default="val", choices=["val", "test", "train"])
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", type=str, default="cpu")
    parser.add_argument("--output-dir", type=Path, default=Path("ml/runs/eval"))
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    res = evaluate_per_country(
        weights_path=args.weights,
        data_path=args.data,
        split=args.split,
        imgsz=args.imgsz,
        device=args.device,
        output_dir=args.output_dir,
    )
    print(json.dumps(res, indent=2))


if __name__ == "__main__":
    main()
