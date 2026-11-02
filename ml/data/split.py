"""Sequence-aware, stratified train/val/test dataset splitting module.

Enforces Rule B3.3: Never split individual frames randomly. Group by sequence/drive
to prevent temporal autocorrelation and background feature leakage.
"""

import argparse
import math
import random
import re
import shutil
from collections import defaultdict
from pathlib import Path

import yaml


def extract_sequence_id(filename: str, sequence_length: int = 10) -> str:
    """Extract sequence identifier from filename.

    For RDD2022 format (e.g., India_001234.jpg), dashcam sequences (seq01_frame_0045.jpg),
    group contiguous frames by dividing the frame number into blocks of `sequence_length` frames.
    """
    stem = Path(filename).stem

    # Pattern match: <prefix>_<digits> or <prefix>_frame_<digits>
    m = re.match(r"^(.*?)(?:_frame)?_(\d+)$", stem, re.IGNORECASE)
    if m:
        prefix, digits_str = m.group(1), m.group(2)
        frame_idx = int(digits_str)
        seq_idx = frame_idx // sequence_length
        return f"{prefix}_seq_{seq_idx:05d}"

    parts = stem.split("_")
    if len(parts) >= 2 and parts[-1].isdigit():
        country_or_prefix = "_".join(parts[:-1])
        frame_idx = int(parts[-1])
        seq_idx = frame_idx // sequence_length
        return f"{country_or_prefix}_seq_{seq_idx:05d}"
    return stem


def group_files_by_sequence(
    image_files: list[Path], sequence_length: int = 10
) -> dict[str, list[Path]]:
    """Group image file paths by sequence identifier."""
    sequences = defaultdict(list)
    for img_path in image_files:
        seq_id = extract_sequence_id(img_path.name, sequence_length)
        sequences[seq_id].append(img_path)
    return sequences


def create_sequence_splits(
    image_dir: Path,
    label_dir: Path,
    output_dir: Path,
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    test_ratio: float = 0.15,
    seed: int = 42,
    sequence_length: int = 10,
    copy_files: bool = True,
) -> dict:
    """Split dataset into train, val, and test subsets by contiguous sequences."""
    random.seed(seed)
    image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    images = sorted([f for f in image_dir.rglob("*") if f.suffix.lower() in image_extensions])

    if not images:
        raise ValueError(f"No images found in {image_dir}")

    # Group by sequence
    seq_groups = group_files_by_sequence(images, sequence_length=sequence_length)
    sequence_keys = sorted(seq_groups.keys())
    random.shuffle(sequence_keys)

    total_seqs = len(sequence_keys)
    train_end = math.ceil(total_seqs * train_ratio)
    val_end = train_end + math.ceil(total_seqs * val_ratio)

    train_seqs = set(sequence_keys[:train_end])
    val_seqs = set(sequence_keys[train_end:val_end])
    test_seqs = set(sequence_keys[val_end:])

    splits: dict[str, list[Path]] = {"train": [], "val": [], "test": []}

    for seq_id, file_list in seq_groups.items():
        if seq_id in train_seqs:
            splits["train"].extend(file_list)
        elif seq_id in val_seqs:
            splits["val"].extend(file_list)
        else:
            splits["test"].extend(file_list)

    # Copy files into split directories
    for split_name, img_paths in splits.items():
        split_img_dir = output_dir / "images" / split_name
        split_lbl_dir = output_dir / "labels" / split_name
        split_img_dir.mkdir(parents=True, exist_ok=True)
        split_lbl_dir.mkdir(parents=True, exist_ok=True)

        for img_path in img_paths:
            lbl_path = label_dir / (img_path.stem + ".txt")
            if copy_files:
                shutil.copy2(img_path, split_img_dir / img_path.name)
                if lbl_path.exists():
                    shutil.copy2(lbl_path, split_lbl_dir / lbl_path.name)
                else:
                    # Write empty label file for negative samples (Rule B3.5)
                    (split_lbl_dir / (img_path.stem + ".txt")).touch()

    # Generate YOLO dataset config yaml
    dataset_yaml_path = output_dir / "dataset.yaml"
    yolo_config = {
        "path": str(output_dir.resolve()),
        "train": "images/train",
        "val": "images/val",
        "test": "images/test",
        "names": {
            0: "POTHOLE",
            1: "CRACK_LONG",
            2: "CRACK_TRANS",
            3: "CRACK_ALLIGATOR",
        },
    }
    with open(dataset_yaml_path, "w", encoding="utf-8") as f:
        yaml.safe_dump(yolo_config, f, sort_keys=False)

    return {
        "total_images": len(images),
        "total_sequences": total_seqs,
        "train_count": len(splits["train"]),
        "val_count": len(splits["val"]),
        "test_count": len(splits["test"]),
        "train_sequences": len(train_seqs),
        "val_sequences": len(val_seqs),
        "test_sequences": len(test_seqs),
        "dataset_yaml": str(dataset_yaml_path),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse splitting CLI arguments."""
    parser = argparse.ArgumentParser(description="Sequence-aware stratified train/val/test split.")
    parser.add_argument(
        "--image-dir",
        "--images-dir",
        dest="image_dir",
        type=Path,
        required=True,
        help="Input directory of images.",
    )
    parser.add_argument(
        "--label-dir",
        "--labels-dir",
        dest="label_dir",
        type=Path,
        required=True,
        help="Input directory of YOLO txt labels.",
    )
    parser.add_argument(
        "--output-dir",
        "--out-dir",
        dest="output_dir",
        type=Path,
        required=True,
        help="Output directory for processed splits.",
    )
    parser.add_argument("--train-ratio", type=float, default=0.70)
    parser.add_argument("--val-ratio", type=float, default=0.15)
    parser.add_argument("--test-ratio", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--seq-len", type=int, default=10, help="Frames per sequence group")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """CLI entrypoint."""
    args = parse_args(argv)
    result = create_sequence_splits(
        image_dir=args.image_dir,
        label_dir=args.label_dir,
        output_dir=args.output_dir,
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio,
        test_ratio=args.test_ratio,
        seed=args.seed,
        sequence_length=args.seq_len,
    )
    print(
        f"Splits generated successfully!\n"
        f"  Total Images: {result['total_images']} across {result['total_sequences']} sequences\n"
        f"  Train: {result['train_count']} ({result['train_sequences']} seqs)\n"
        f"  Val:   {result['val_count']} ({result['val_sequences']} seqs)\n"
        f"  Test:  {result['test_count']} ({result['test_sequences']} seqs)\n"
        f"  Config: {result['dataset_yaml']}"
    )


if __name__ == "__main__":
    main()
