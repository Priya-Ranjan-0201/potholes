"""Unit tests for dataset auditing, duplicate detection, and leakage checks."""

from pathlib import Path

import numpy as np
from PIL import Image

from ml.data.audit import audit_images, audit_yolo_labels, check_split_leakage
from ml.data.download import record_to_dataset_docs


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


def test_record_to_dataset_docs(tmp_path: Path) -> None:
    """Verify appending dataset provenance records to docs/DATASETS.md."""
    doc_file = tmp_path / "DATASETS.md"
    hdr = (
        "| Source | Licence | URL / Handle | Version / Date | "
        "Classes | Class Mapping | Split Policy | Notes |\n"
    )
    doc_file.write_text(
        f"# Dataset Registry\n\n{hdr}|---|---|---|---|---|---|---|---|\n"
        "| **Old Set** | CC0 | `http://ex.com` | 2024 | D40 | D40->0 | Stratified | Init |\n",
        encoding="utf-8",
    )

    record_to_dataset_docs(
        dataset_name="RDD2022 - India",
        license_str="CC BY-SA 4.0",
        url_or_handle="https://figshare.com/articles/dataset/RDD2022/21431547",
        date_str="2026-11",
        sha256_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        notes="Automated provenance entry",
        docs_path=doc_file,
    )

    updated_text = doc_file.read_text(encoding="utf-8")
    assert "RDD2022 - India" in updated_text
    assert "CC BY-SA 4.0" in updated_text
    assert "e3b0c44298fc1c14" in updated_text

