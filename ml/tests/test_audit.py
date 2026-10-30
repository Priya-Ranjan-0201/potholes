"""Unit tests for dataset auditing, duplicate detection, and leakage checks."""

from pathlib import Path

import numpy as np
from PIL import Image

from ml.data.audit import audit_images, audit_yolo_labels, check_split_leakage


def create_dummy_image(path: Path, color: tuple[int, int, int] = (100, 100, 100)) -> None:
    """Helper to create dummy RGB image."""
    arr = np.full((100, 100, 3), color, dtype=np.uint8)
    im = Image.fromarray(arr)
    im.save(path)


def test_audit_images_detects_corrupt(tmp_path: Path) -> None:
    """Test that corrupt image files are detected and counted."""
    img_dir = tmp_path / "images"
    img_dir.mkdir()

    # Valid image
    create_dummy_image(img_dir / "valid.jpg")

    # Corrupt image (random garbage bytes)
    corrupt_file = img_dir / "corrupt.jpg"
    with open(corrupt_file, "wb") as f:
        f.write(b"NOT_AN_IMAGE_DATA_12345")

    result = audit_images(img_dir)
    assert result["total_images"] == 2
    assert result["valid_images"] == 1
    assert result["corrupt_count"] == 1
    assert result["corrupt_files"][0]["file"] == str(corrupt_file)


def test_audit_images_detects_duplicates(tmp_path: Path) -> None:
    """Test that exact duplicate images are detected via SHA-256."""
    img_dir = tmp_path / "images"
    img_dir.mkdir()

    # Create original and identical copy
    img1 = img_dir / "img1.png"
    img2 = img_dir / "img2.png"
    create_dummy_image(img1, (200, 50, 50))
    create_dummy_image(img2, (200, 50, 50))

    result = audit_images(img_dir)
    assert result["exact_duplicate_groups"] == 1
    assert len(result["exact_duplicates"][0]["files"]) == 2


def test_audit_yolo_labels(tmp_path: Path) -> None:
    """Test parsing and categorization of YOLO format labels."""
    lbl_dir = tmp_path / "labels"
    lbl_dir.mkdir()

    # Valid label with two annotations (1 small, 1 large)
    with open(lbl_dir / "sample1.txt", "w", encoding="utf-8") as f:
        f.write("0 0.5 0.5 0.02 0.02\n")  # small area = 0.0004
        f.write("1 0.5 0.5 0.5 0.5\n")  # large area = 0.25

    # Invalid line label
    with open(lbl_dir / "sample2.txt", "w", encoding="utf-8") as f:
        f.write("0 0.5 0.5\n")  # Missing w, h

    result = audit_yolo_labels(lbl_dir)
    assert result["total_label_files"] == 2
    assert result["total_boxes"] == 2
    assert result["class_distribution"]["POTHOLE"] == 1
    assert result["class_distribution"]["CRACK_LONG"] == 1
    assert result["invalid_lines_count"] == 1


def test_check_split_leakage(tmp_path: Path) -> None:
    """Test that split leakage detector identifies overlapping samples."""
    train_dir = tmp_path / "train"
    val_dir = tmp_path / "val"
    train_dir.mkdir()
    val_dir.mkdir()

    (train_dir / "India_001.jpg").touch()
    (train_dir / "India_002.jpg").touch()
    (val_dir / "India_003.jpg").touch()

    # Clean split
    clean_result = check_split_leakage(train_dir, val_dir)
    assert not clean_result["has_leakage"]
    assert clean_result["train_val_overlap_count"] == 0

    # Introduce leak
    (val_dir / "India_001.jpg").touch()
    leaked_result = check_split_leakage(train_dir, val_dir)
    assert leaked_result["has_leakage"]
    assert leaked_result["train_val_overlap_count"] == 1
    assert "India_001" in leaked_result["leaked_files"]
