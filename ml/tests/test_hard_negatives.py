"""Unit tests for hard negative mining logic."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from ml.training.hard_negative_mining import mine_hard_negatives


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
