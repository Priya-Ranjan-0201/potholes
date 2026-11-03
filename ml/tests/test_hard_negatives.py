"""Unit tests for hard negative mining logic."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from ml.training.hard_negative_mining import mine_hard_negatives
from ml.training.hard_negative_workflow import (
    create_mock_background_candidates,
    execute_hard_negative_cycle,
)


def test_mine_hard_negatives_file_not_found(tmp_path: Path) -> None:
    """Verify FileNotFoundError when model or negative directory is missing."""
    with pytest.raises(FileNotFoundError, match="Model checkpoint not found"):
        mine_hard_negatives(
            model_path=tmp_path / "missing.pt",
            negative_images_dir=tmp_path / "images",
            output_images_dir=tmp_path / "out_img",
            output_labels_dir=tmp_path / "out_lbl",
        )

    weights = tmp_path / "model.pt"
    weights.touch()

    with pytest.raises(FileNotFoundError, match="Negative images directory not found"):
        mine_hard_negatives(
            model_path=weights,
            negative_images_dir=tmp_path / "nonexistent_dir",
            output_images_dir=tmp_path / "out_img",
            output_labels_dir=tmp_path / "out_lbl",
        )


def test_mine_hard_negatives_harvests_samples(tmp_path: Path) -> None:
    """Verify hard negative samples create empty label files when false positives occur."""
    weights = tmp_path / "best.pt"
    weights.touch()

    neg_dir = tmp_path / "negatives"
    neg_dir.mkdir()
    sample_img = neg_dir / "shadow_001.jpg"
    sample_img.write_bytes(b"\xff\xd8\xff" + b"\x00" * 50)

    out_img = tmp_path / "out_images"
    out_lbl = tmp_path / "out_labels"

    # Mock ultralytics YOLO model
    mock_box = MagicMock()
    mock_box.conf = [0.85]
    mock_box.cls = [0]
    mock_boxes = MagicMock()
    mock_boxes.__len__.return_value = 1
    mock_boxes.conf.tolist.return_value = [0.85]
    mock_boxes.cls.tolist.return_value = [0]

    mock_res = MagicMock()
    mock_res.boxes = mock_boxes

    mock_model_instance = MagicMock()
    mock_model_instance.predict.return_value = [mock_res]

    with patch("ml.training.hard_negative_mining.YOLO", return_value=mock_model_instance):
        report = mine_hard_negatives(
            model_path=weights,
            negative_images_dir=neg_dir,
            output_images_dir=out_img,
            output_labels_dir=out_lbl,
            confidence_threshold=0.25,
        )

    assert report["mined_hard_negatives"] == 1
    assert report["total_false_positives_flagged"] == 1
    assert (out_img / "shadow_001.jpg").exists()

    label_file = out_lbl / "shadow_001.txt"
    assert label_file.exists()
    # Must be 0 bytes (empty background label)
    assert label_file.stat().st_size == 0


def test_create_mock_background_candidates(tmp_path: Path) -> None:
    """Verify background candidate generation creates expected JPEG images."""
    cand_dir = tmp_path / "candidates"
    paths = create_mock_background_candidates(cand_dir, count=5)
    assert len(paths) == 5
    for p in paths:
        assert p.exists()
        assert p.suffix.lower() == ".jpg"
        assert p.stat().st_size > 0


def test_execute_hard_negative_cycle_dry_run(tmp_path: Path) -> None:
    """Verify hard negative cycle execution in dry-run mode."""
    weights = tmp_path / "yolo.pt"
    weights.touch()

    # Create dummy dataset structure
    splits_dir = tmp_path / "splits"
    train_img = splits_dir / "images" / "train"
    train_lbl = splits_dir / "labels" / "train"
    train_img.mkdir(parents=True, exist_ok=True)
    train_lbl.mkdir(parents=True, exist_ok=True)

    data_yaml = splits_dir / "dataset.yaml"
    data_yaml.write_text(
        f"path: {splits_dir.as_posix()}\ntrain: images/train\n"
        "val: images/train\nnames: [POTHOLE]\n",
        encoding="utf-8",
    )

    cand_dir = tmp_path / "candidates"
    create_mock_background_candidates(cand_dir, count=3)

    # Mock YOLO in mine_hard_negatives to produce 1 detection on candidate
    mock_box = MagicMock()
    mock_box.conf = [0.75]
    mock_box.cls = [0]
    mock_boxes = MagicMock()
    mock_boxes.__len__.return_value = 1
    mock_boxes.conf.tolist.return_value = [0.75]
    mock_boxes.cls.tolist.return_value = [0]
    mock_res = MagicMock()
    mock_res.boxes = mock_boxes

    mock_model_instance = MagicMock()
    mock_model_instance.predict.return_value = [mock_res]

    with patch("ml.training.hard_negative_mining.YOLO", return_value=mock_model_instance):
        summary = execute_hard_negative_cycle(
            model_weights=weights,
            data_yaml=data_yaml,
            negative_candidates_dir=cand_dir,
            output_dir=tmp_path / "runs_hn",
            dry_run=True,
            doc_output_path=tmp_path / "HARD_NEGATIVES.md",
        )

    assert summary["mined_samples_count"] > 0
    assert "precision_delta" in summary
    assert (tmp_path / "runs_hn" / "summary.json").exists()
    assert (tmp_path / "HARD_NEGATIVES.md").exists()

