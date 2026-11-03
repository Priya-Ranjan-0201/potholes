"""Unit tests for ML evaluation reporting."""

from pathlib import Path

import pytest

from ml.evaluation.country_eval import (
    extract_country_name,
)
from ml.evaluation.evaluate import (
    evaluate_model,
    generate_evaluation_markdown,
)
from ml.evaluation.false_positive_gallery import (
    compute_iou,
    load_ground_truth,
)
from ml.export.quantize import (
    quantize_model,
)


def test_evaluate_model_missing_files(tmp_path: Path) -> None:
    """Verify FileNotFoundError on missing weights or dataset config."""
    with pytest.raises(FileNotFoundError, match="Model weights not found"):
        evaluate_model(
            weights_path=tmp_path / "missing.pt",
            data_path=tmp_path / "data.yaml",
        )

    weights = tmp_path / "best.pt"
    weights.touch()

    with pytest.raises(FileNotFoundError, match="Dataset YAML not found"):
        evaluate_model(
            weights_path=weights,
            data_path=tmp_path / "nonexistent.yaml",
        )


def test_generate_evaluation_markdown(tmp_path: Path) -> None:
    """Verify markdown evaluation report formatting."""
    mock_metrics = {
        "timestamp_utc": "2026-10-31T00:00:00Z",
        "weights": "best.pt",
        "data": "data.yaml",
        "split": "val",
        "imgsz": 640,
        "device": "cpu",
        "overall": {
            "mAP50": 0.7850,
            "mAP50_95": 0.4620,
            "precision": 0.8120,
            "recall": 0.7450,
            "f1_score": 0.7771,
        },
        "per_class": {
            "pothole": {"mAP50": 0.8200, "mAP50_95": 0.5100},
            "crack_longitudinal": {"mAP50": 0.7500, "mAP50_95": 0.4140},
        },
        "speed": {
            "preprocess_ms": 1.2,
            "inference_ms": 22.4,
            "postprocess_ms": 1.5,
            "total_latency_ms": 25.1,
            "estimated_fps": 39.8,
        },
    }

    out_md = tmp_path / "docs" / "AI_EVALUATION.md"
    generate_evaluation_markdown(mock_metrics, out_md)

    assert out_md.exists()
    content = out_md.read_text(encoding="utf-8")
    assert "# ScamRoad AI Model Evaluation Report" in content
    assert "0.785" in content
    assert "0.82" in content
    assert "39.8 FPS" in content
    assert "pothole" in content


def test_extract_country_name() -> None:
    """Verify country prefix extraction logic."""
    assert extract_country_name(Path("India_000123.jpg")) == "India"
    assert extract_country_name(Path("Japan_00456.jpg")) == "Japan"
    assert extract_country_name(Path("United_States_001.jpg")) == "United_States"
    assert extract_country_name(Path("China_Drone_0002.jpg")) == "China_Drone"
    assert extract_country_name(Path("Norway_0099.jpg")) == "Norway"
    assert extract_country_name(Path("customroad.jpg")) == "customroad"


def test_compute_iou_and_ground_truth(tmp_path: Path) -> None:
    """Verify IoU calculation and label loading."""
    # Box IoU
    b1 = [0.0, 0.0, 10.0, 10.0]
    b2 = [5.0, 0.0, 15.0, 10.0]
    iou = compute_iou(b1, b2)
    # intersection: 5*10 = 50, union: 100+100-50 = 150 -> 50/150 = 0.3333...
    assert round(iou, 3) == 0.333

    # Disjoint boxes
    b3 = [20.0, 20.0, 30.0, 30.0]
    assert compute_iou(b1, b3) == 0.0

    # Label reading
    label_file = tmp_path / "img1.txt"
    # Format: cls, xc, yc, w, h
    label_file.write_text("0 0.5 0.5 0.2 0.2\n1 0.2 0.2 0.1 0.1\n", encoding="utf-8")
    gt = load_ground_truth(label_file, img_w=100, img_h=100)
    assert len(gt) == 2
    assert gt[0]["class_id"] == 0
    # xc=50, yc=50, w=20, h=20 -> [40, 40, 60, 60]
    assert gt[0]["xyxy"] == [40.0, 40.0, 60.0, 60.0]


def test_markdown_with_country_and_quantization(tmp_path: Path) -> None:
    """Verify markdown output with country breakdown, false positives, and INT8 accuracy drop."""
    mock_metrics = {
        "timestamp_utc": "2026-11-03T00:00:00Z",
        "weights": "best.pt",
        "data": "data.yaml",
        "split": "val",
        "imgsz": 640,
        "device": "cpu",
        "overall": {
            "mAP50": 0.85,
            "mAP50_95": 0.55,
            "precision": 0.88,
            "recall": 0.82,
            "f1_score": 0.849,
        },
        "per_class": {"POTHOLE": {"mAP50": 0.89, "mAP50_95": 0.60}},
        "speed": {
            "preprocess_ms": 1.0,
            "inference_ms": 15.0,
            "postprocess_ms": 1.0,
            "total_latency_ms": 17.0,
            "estimated_fps": 58.8,
        },
        "country_breakdown": {
            "India": {
                "image_count": 50,
                "precision": 0.86,
                "recall": 0.80,
                "f1": 0.829,
                "map50": 0.84,
                "map50_95": 0.52,
            },
            "Japan": {
                "image_count": 40,
                "precision": 0.90,
                "recall": 0.85,
                "f1": 0.874,
                "map50": 0.88,
                "map50_95": 0.58,
            },
        },
        "false_positives": {
            "total_false_positives": 5,
            "total_images_scanned": 90,
            "conf_threshold": 0.25,
            "iou_threshold": 0.20,
        },
        "quantization": {
            "input_size_mb": 6.2,
            "output_size_mb": 3.1,
            "compression_ratio_pct": 50.0,
            "accuracy_drift": {
                "mean_cosine_similarity": 0.9985,
                "fidelity_status": "EXCELLENT",
                "mean_squared_error": 0.00012,
                "max_absolute_error": 0.015,
            },
        },
    }

    out_md = tmp_path / "docs" / "AI_EVALUATION.md"
    generate_evaluation_markdown(mock_metrics, out_md)
    content = out_md.read_text(encoding="utf-8")

    assert "Multi-National Per-Country Breakdown" in content
    assert "India" in content
    assert "Japan" in content
    assert "False-Positive Gallery Analysis" in content
    assert "Edge INT8 Quantization Accuracy Drop" in content
    assert "0.9985" in content
    assert "50.0%" in content


def test_quantize_export_import() -> None:
    """Verify quantize_model is callable from ml.export.quantize."""
    assert callable(quantize_model)

