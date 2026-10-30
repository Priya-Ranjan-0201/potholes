"""Unit tests for sequence-aware dataset splitting."""

from pathlib import Path

from ml.data.split import create_sequence_splits, extract_sequence_id


def test_extract_sequence_id() -> None:
    """Test grouping of contiguous frame indices into sequence blocks."""
    # India_000001 through India_000009 should map to the same sequence (length=10)
    seq1 = extract_sequence_id("India_000001.jpg", sequence_length=10)
    seq2 = extract_sequence_id("India_000008.jpg", sequence_length=10)
    seq3 = extract_sequence_id("India_000015.jpg", sequence_length=10)

    assert seq1 == seq2
    assert seq1 != seq3
    assert "seq_00000" in seq1
    assert "seq_00001" in seq3


def test_create_sequence_splits(tmp_path: Path) -> None:
    """Test dataset splitting creates train/val/test with zero sequence overlap."""
    img_dir = tmp_path / "images"
    lbl_dir = tmp_path / "labels"
    out_dir = tmp_path / "processed"
    img_dir.mkdir()
    lbl_dir.mkdir()

    # Create 30 dummy images spanning 3 distinct sequences (10 frames each)
    for i in range(30):
        fname = f"India_{i:06d}.jpg"
        (img_dir / fname).touch()
        (lbl_dir / f"India_{i:06d}.txt").touch()

    result = create_sequence_splits(
        image_dir=img_dir,
        label_dir=lbl_dir,
        output_dir=out_dir,
        train_ratio=0.60,
        val_ratio=0.20,
        test_ratio=0.20,
        sequence_length=10,
    )

    assert result["total_images"] == 30
    assert result["total_sequences"] == 3

    # Check that directories exist
    assert (out_dir / "images" / "train").exists()
    assert (out_dir / "images" / "val").exists()
    assert (out_dir / "images" / "test").exists()
    assert (out_dir / "dataset.yaml").exists()

    # Verify no file overlap across splits
    train_files = {f.name for f in (out_dir / "images" / "train").glob("*.jpg")}
    val_files = {f.name for f in (out_dir / "images" / "val").glob("*.jpg")}
    test_files = {f.name for f in (out_dir / "images" / "test").glob("*.jpg")}

    assert not (train_files & val_files), "Train and Val share files!"
    assert not (train_files & test_files), "Train and Test share files!"
    assert not (val_files & test_files), "Val and Test share files!"
    assert len(train_files) + len(val_files) + len(test_files) == 30
