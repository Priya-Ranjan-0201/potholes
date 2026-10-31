"""Unit tests for model export to ONNX and edge formats."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

from ml.export.export_onnx import (
    compute_file_hash,
    export_model,
    validate_onnx_graph,
)


def test_export_model_missing_weights(tmp_path: Path) -> None:
    """Verify FileNotFoundError when weights file does not exist."""
    with pytest.raises(FileNotFoundError, match="Model weights file not found"):
        export_model(weights_path=tmp_path / "nonexistent.pt")


def test_compute_file_hash(tmp_path: Path) -> None:
    """Verify SHA-256 calculation."""
    f = tmp_path / "model.bin"
    f.write_bytes(b"TEST_MODEL_DATA")
    h = compute_file_hash(f)
    assert len(h) == 64


def test_validate_onnx_graph_invalid_file(tmp_path: Path) -> None:
    """Verify validate_onnx_graph reports invalid on non-ONNX files."""
    dummy = tmp_path / "corrupt.onnx"
    dummy.write_text("not-an-onnx-file", encoding="utf-8")
    val = validate_onnx_graph(dummy)
    assert val["valid"] is False
    assert "error" in val


def test_export_model_mock_flow(tmp_path: Path) -> None:
    """Verify export_model orchestration with mock YOLO instance."""
    weights = tmp_path / "best.pt"
    weights.write_bytes(b"WEIGHTS")

    exported_onnx = tmp_path / "best.onnx"
    exported_onnx.write_bytes(b"ONNX_CONTENT")

    mock_model = MagicMock()
    mock_model.export.return_value = str(exported_onnx)

    with patch("ml.export.export_onnx.YOLO", return_value=mock_model):
        summary = export_model(
            weights_path=weights,
            output_format="onnx",
            imgsz=640,
            opset=17,
            dynamic=False,
            output_dir=tmp_path / "summary",
        )

    assert summary["format"] == "onnx"
    assert summary["imgsz"] == 640
    assert summary["opset"] == 17
    assert summary["file_size_bytes"] == len(b"ONNX_CONTENT")
    assert len(summary["sha256"]) == 64
    assert (tmp_path / "summary" / "export_onnx_summary.json").exists()
