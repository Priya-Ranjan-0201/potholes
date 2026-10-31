"""Unit tests for edge inference benchmarking suite."""

from pathlib import Path
from unittest.mock import MagicMock, patch

from edge.benchmarks.run_benchmark import (
    benchmark_onnx_model,
    detect_system_telemetry,
    generate_comparison_markdown,
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


def test_generate_comparison_markdown(tmp_path: Path) -> None:
    """Verify generation of comparative benchmark markdown report."""
    base_report = {
        "timestamp_utc": "2026-10-31T00:00:00Z",
        "device_profile": "generic",
        "iterations": 50,
        "warmup": 10,
        "model_size_mb": 12.0,
        "throughput_fps": 30.0,
        "latency_ms": {"p50": 33.0, "p95": 38.0, "mean": 33.3},
        "hardware_telemetry": {
            "platform": "Windows-11",
            "processor": "AMD64",
            "cpu_count_logical": 8,
            "system_ram_total_gb": 16.0,
            "process_ram_rss_mb": 120.0,
        },
        "runtime_providers": ["CPUExecutionProvider"],
    }
    comp_report = {
        "model_size_mb": 3.0,
        "throughput_fps": 60.0,
        "latency_ms": {"p50": 16.5, "p95": 19.0, "mean": 16.6},
        "hardware_telemetry": {"process_ram_rss_mb": 90.0},
    }

    out_md = tmp_path / "COMPARATIVE_BENCHMARK.md"
    generate_comparison_markdown(base_report, comp_report, out_md)

    assert out_md.exists()
    content = out_md.read_text(encoding="utf-8")
    assert "FP32 Baseline" in content
    assert "INT8 Quantized" in content
    assert "2.0x faster" in content
    assert "-75.0%" in content
