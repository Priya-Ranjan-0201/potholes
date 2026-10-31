"""Unit tests for ML evaluation reporting."""

from pathlib import Path

import pytest

from ml.evaluation.evaluate import (
    evaluate_model,
    generate_evaluation_markdown,
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
