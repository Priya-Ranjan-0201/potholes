"""Unit tests for edge inference benchmarking suite."""

from pathlib import Path
from unittest.mock import MagicMock, patch

from edge.benchmarks.run_benchmark import (
    benchmark_onnx_model,
    detect_system_telemetry,
)


def test_detect_system_telemetry() -> None:
    """Verify hardware telemetry metrics retrieval."""
    tel = detect_system_telemetry()
    assert "platform" in tel
    assert "cpu_count_logical" in tel
    assert tel["cpu_count_logical"] is not None
    assert tel["cpu_count_logical"] > 0
    assert "process_ram_rss_mb" in tel
    assert tel["process_ram_rss_mb"] > 0.0


def test_benchmark_onnx_model_mock_session(tmp_path: Path) -> None:
    """Verify benchmark latency aggregation and percentiles using mock InferenceSession."""
    model_file = tmp_path / "detector.onnx"
    model_file.write_bytes(b"ONNX_DUMMY_MODEL_BYTES")

    mock_input = MagicMock()
    mock_input.name = "images"

    mock_session = MagicMock()
    mock_session.get_inputs.return_value = [mock_input]
    mock_session.get_providers.return_value = ["CPUExecutionProvider"]
    mock_session.run.return_value = [None]

    with patch("onnxruntime.InferenceSession", return_value=mock_session):
        report = benchmark_onnx_model(
            model_path=model_file,
            iterations=15,
            warmup=2,
            imgsz=320,
            device_profile="generic",
        )

    assert report["model_file"] == str(model_file)
    assert report["iterations"] == 15
    assert report["warmup"] == 2
    assert report["device_profile"] == "generic"
    assert "latency_ms" in report
    lat = report["latency_ms"]
    assert "p50" in lat
    assert "p95" in lat
    assert "mean" in lat
    assert lat["mean"] >= 0.0
    assert report["throughput_fps"] >= 0.0
    assert "hardware_telemetry" in report
