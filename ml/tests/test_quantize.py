"""Unit tests for model quantization and calibration data reader."""

from pathlib import Path
from unittest.mock import patch

import pytest
from PIL import Image

from ml.quantization.quantize import (
    RoadCalibrationDataReader,
    quantize_model,
)


def test_quantize_model_missing_input(tmp_path: Path) -> None:
    """Verify FileNotFoundError when input ONNX is missing."""
    with pytest.raises(FileNotFoundError, match="Input model not found"):
        quantize_model(
            model_input=tmp_path / "missing.onnx",
            model_output=tmp_path / "out.onnx",
        )


def test_quantize_model_unsupported_precision(tmp_path: Path) -> None:
    """Verify ValueError when precision is not supported."""
    inp = tmp_path / "model.onnx"
    inp.write_bytes(b"DATA")

    with pytest.raises(ValueError, match="Unsupported precision"):
        quantize_model(
            model_input=inp,
            model_output=tmp_path / "out.onnx",
            precision="int4",
        )


def test_road_calibration_data_reader(tmp_path: Path) -> None:
    """Verify RoadCalibrationDataReader loads and yields preprocessed images."""
    calib_dir = tmp_path / "calibration"
    calib_dir.mkdir()

    # Create dummy images
    for i in range(3):
        img = Image.new("RGB", (100, 100), color=(100 + i * 20, 100, 100))
        img.save(calib_dir / f"calib_{i}.jpg")

    reader = RoadCalibrationDataReader(
        image_dir=calib_dir,
        input_name="images",
        imgsz=320,
        max_samples=10,
    )
    assert len(reader.enum_data) == 3

    batch = reader.get_next()
    assert batch is not None
    assert "images" in batch
    arr = batch["images"]
    assert arr.shape == (1, 3, 320, 320)
    assert arr.dtype.name == "float32"
    assert 0.0 <= arr.max() <= 1.0


def test_quantize_model_dynamic_mock(tmp_path: Path) -> None:
    """Verify quantize_model dynamic quantization flow."""
    inp = tmp_path / "model.onnx"
    inp.write_bytes(b"INPUT_MODEL_CONTENT")
    out = tmp_path / "quantized.onnx"

    def mock_quant_dynamic(model_input, model_output, weight_type):
        Path(model_output).write_bytes(b"QUANTIZED_INT8_MODEL")

    with patch("ml.quantization.quantize.quantize_dynamic", side_effect=mock_quant_dynamic):
        summary = quantize_model(
            model_input=inp,
            model_output=out,
            precision="int8",
        )

    assert summary["precision"] == "int8"
    assert summary["quantization_method"] == "dynamic"
    assert out.exists()
    assert summary["quantized_size_mb"] >= 0.0
