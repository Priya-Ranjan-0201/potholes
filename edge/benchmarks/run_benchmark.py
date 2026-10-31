"""Device edge benchmark suite for ScamRoad detection models.

Measures inference latency percentiles (p50, p90, p95, p99), end-to-end FPS throughput,
peak memory (RSS in MB), and CPU usage across target devices (Android / OPPO K13,
Raspberry Pi, Jetson, and laptop workstations).
Supports comparative benchmarking between FP32 baseline and INT8 quantized models.
Follows SPEC B4 and strict Rule R1 (Truth over appearance: never fabricate numbers).
"""

from __future__ import annotations

import argparse
import json
import platform
import statistics
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
import onnxruntime as ort
import psutil


def detect_system_telemetry() -> dict[str, Any]:
    """Capture real hardware telemetry and resource metrics."""
    process = psutil.Process()
    mem_info = process.memory_info()
    mem_rss_mb = round(mem_info.rss / (1024 * 1024), 2)
    cpu_percent = psutil.cpu_percent(interval=None)

    temps: dict[str, Any] = {}
    if hasattr(psutil, "sensors_temperatures"):
        try:
            raw_temps = psutil.sensors_temperatures()
            if raw_temps:
                for k, entries in raw_temps.items():
                    temps[k] = [e.current for e in entries if hasattr(e, "current")]
        except Exception:
            temps = {}

    return {
        "platform": platform.platform(),
        "processor": platform.processor(),
        "cpu_count_logical": psutil.cpu_count(logical=True),
        "cpu_count_physical": psutil.cpu_count(logical=False),
        "system_ram_total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
        "process_ram_rss_mb": mem_rss_mb,
        "cpu_utilization_percent": cpu_percent,
        "temperatures_celsius": temps if temps else None,
    }


def benchmark_onnx_model(
    model_path: Path,
    iterations: int = 100,
    warmup: int = 20,
    imgsz: int = 640,
    device_profile: str = "generic",
) -> dict[str, Any]:
    """Benchmark ONNX model using onnxruntime.

    Args:
        model_path: Path to .onnx file.
        iterations: Number of timed inference iterations.
        warmup: Number of untimed warmup iterations.
        imgsz: Model input image resolution.
        device_profile: Target device label.

    Returns:
        Structured benchmark report dictionary.
    """
    session_options = ort.SessionOptions()
    session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

    available_providers = ort.get_available_providers()
    providers = ["CPUExecutionProvider"]
    if "CUDAExecutionProvider" in available_providers and device_profile != "cpu":
        providers.insert(0, "CUDAExecutionProvider")

    session = ort.InferenceSession(
        str(model_path), sess_options=session_options, providers=providers
    )
    active_providers = session.get_providers()
    input_name = session.get_inputs()[0].name
    input_shape = [1, 3, imgsz, imgsz]

    # Generate dummy input tensor
    dummy_input = np.random.uniform(0.0, 1.0, size=input_shape).astype(np.float32)
    feed_dict = {input_name: dummy_input}

    # 1. Warm-up
    for _ in range(warmup):
        session.run(None, feed_dict)

    # 2. Timed inference loop
    latencies_ms: list[float] = []
    process = psutil.Process()
    peak_rss_mb = 0.0

    start_bench = time.perf_counter()
    for _ in range(iterations):
        t0 = time.perf_counter()
        session.run(None, feed_dict)
        t1 = time.perf_counter()
        latencies_ms.append((t1 - t0) * 1000.0)

        # Track peak memory
        rss = process.memory_info().rss / (1024 * 1024)
        peak_rss_mb = max(peak_rss_mb, rss)

    total_bench_duration = time.perf_counter() - start_bench

    # 3. Statistical aggregation
    mean_ms = round(statistics.mean(latencies_ms), 2)
    std_ms = round(statistics.stdev(latencies_ms) if len(latencies_ms) > 1 else 0.0, 2)
    min_ms = round(min(latencies_ms), 2)
    max_ms = round(max(latencies_ms), 2)
    p50_ms = round(statistics.median(latencies_ms), 2)
    p90_ms = round(float(np.percentile(latencies_ms, 90)), 2)
    p95_ms = round(float(np.percentile(latencies_ms, 95)), 2)
    p99_ms = round(float(np.percentile(latencies_ms, 99)), 2)
    fps = round(1000.0 / mean_ms, 2) if mean_ms > 0 else 0.0

    model_size_mb = round(model_path.stat().st_size / (1024 * 1024), 2)
    telemetry = detect_system_telemetry()
    telemetry["process_ram_rss_mb"] = round(peak_rss_mb, 2)

    return {
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "model_file": str(model_path),
        "model_format": "onnx",
        "model_size_mb": model_size_mb,
        "device_profile": device_profile,
        "runtime_providers": active_providers,
        "input_shape": input_shape,
        "iterations": iterations,
        "warmup": warmup,
        "bench_duration_seconds": round(total_bench_duration, 2),
        "latency_ms": {
            "mean": mean_ms,
            "std": std_ms,
            "min": min_ms,
            "max": max_ms,
            "p50": p50_ms,
            "p90": p90_ms,
            "p95": p95_ms,
            "p99": p99_ms,
        },
        "throughput_fps": fps,
        "hardware_telemetry": telemetry,
    }


def generate_comparison_markdown(
    base_report: dict[str, Any],
    comp_report: dict[str, Any],
    output_path: Path,
) -> None:
    """Generate side-by-side comparative benchmark report in Markdown."""
    b_lat = base_report["latency_ms"]
    c_lat = comp_report["latency_ms"]

    speedup_p50 = round(b_lat["p50"] / c_lat["p50"], 2) if c_lat["p50"] > 0 else 1.0
    speedup_fps = (
        round(comp_report["throughput_fps"] / base_report["throughput_fps"], 2)
        if base_report["throughput_fps"] > 0
        else 1.0
    )
    b_size = base_report["model_size_mb"]
    c_size = comp_report["model_size_mb"]
    size_reduction = round((1.0 - (c_size / b_size)) * 100, 2) if b_size > 0 else 0.0

    b_rss = base_report["hardware_telemetry"]["process_ram_rss_mb"]
    c_rss = comp_report["hardware_telemetry"]["process_ram_rss_mb"]

    diff_p95 = round(b_lat["p95"] - c_lat["p95"], 2)
    diff_mean = round(b_lat["mean"] - c_lat["mean"], 2)
    diff_rss = round(b_rss - c_rss, 2)
    b_fps = base_report["throughput_fps"]
    c_fps = comp_report["throughput_fps"]

    lines = [
        "# ScamRoad Model Comparative Benchmark Report",
        "",
        f"**Evaluated At**: {base_report['timestamp_utc']}  ",
        f"**Device Profile**: `{base_report['device_profile']}`  ",
        f"**Platform**: `{base_report['hardware_telemetry']['platform']}`  ",
        f"**Iterations**: `{base_report['iterations']}` (Warmup: `{base_report['warmup']}`)  ",
        "",
        "## 1. FP32 vs INT8 Performance Comparison",
        "",
        "| Metric | FP32 Baseline | INT8 Quantized | Delta / Improvement |",
        "|---|---|---|---|",
        f"| **Model Size** | {b_size} MB | {c_size} MB | **-{size_reduction}%** |",
        f"| **Latency p50** | {b_lat['p50']} ms | {c_lat['p50']} ms | **{speedup_p50}x faster** |",
        f"| **Latency p95** | {b_lat['p95']} ms | {c_lat['p95']} ms | -{diff_p95} ms |",
        f"| **Latency Mean** | {b_lat['mean']} ms | {c_lat['mean']} ms | -{diff_mean} ms |",
        f"| **Throughput (FPS)** | {b_fps} FPS | {c_fps} FPS | **+{speedup_fps}x FPS** |",
        f"| **Peak Process RSS** | {b_rss} MB | {c_rss} MB | -{diff_rss} MB |",
        "",
        "## 2. Hardware Telemetry Details",
        "",
        f"- **Processor**: `{base_report['hardware_telemetry']['processor']}`",
        f"- **Logical CPU Cores**: `{base_report['hardware_telemetry']['cpu_count_logical']}`",
        f"- **System RAM**: `{base_report['hardware_telemetry']['system_ram_total_gb']} GB`",
        f"- **Runtime Provider**: `{', '.join(base_report['runtime_providers'])}`",
        "",
        "---",
        "*Report generated automatically by `edge/benchmarks/run_benchmark.py`.*  ",
        "*Adheres strictly to Rule R1 (Truth over appearance).*",
    ]

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Edge device inference benchmark.")
    parser.add_argument("--model", type=Path, required=True, help="Path to base model.")
    parser.add_argument(
        "--compare-with",
        type=Path,
        default=None,
        help="Optional second model for comparative benchmarking (e.g. INT8 vs FP32).",
    )
    parser.add_argument(
        "--device",
        type=str,
        choices=["android", "rpi", "jetson", "generic", "cpu"],
        default="generic",
        help="Device profile.",
    )
    parser.add_argument("--iterations", type=int, default=100, help="Benchmark iterations.")
    parser.add_argument("--warmup", type=int, default=20, help="Warmup iterations.")
    parser.add_argument("--imgsz", type=int, default=640, help="Model input size.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("edge/benchmarks/results"),
        help="Output results directory.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """CLI entry-point."""
    args = parse_args(argv)
    if not args.model.exists():
        print(f"Error: Model not found at {args.model}", file=sys.stderr)
        sys.exit(1)

    print(f"Benchmarking {args.model.name} on profile '{args.device}' ({args.iterations} iters)...")
    base_report = benchmark_onnx_model(
        model_path=args.model,
        iterations=args.iterations,
        warmup=args.warmup,
        imgsz=args.imgsz,
        device_profile=args.device,
    )

    args.output_dir.mkdir(parents=True, exist_ok=True)
    out_file = args.output_dir / f"{args.device}_{args.model.stem}_bench.json"
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(base_report, f, indent=2)

    lat = base_report["latency_ms"]
    p_rss = base_report["hardware_telemetry"]["process_ram_rss_mb"]
    print(
        f"Benchmark finished: p50={lat['p50']}ms, p95={lat['p95']}ms | "
        f"Throughput: {base_report['throughput_fps']} FPS | Peak RSS: {p_rss} MB"
    )

    if args.compare_with and args.compare_with.exists():
        print(
            f"Benchmarking comparative model {args.compare_with.name} "
            f"on profile '{args.device}' ({args.iterations} iters)..."
        )
        comp_report = benchmark_onnx_model(
            model_path=args.compare_with,
            iterations=args.iterations,
            warmup=args.warmup,
            imgsz=args.imgsz,
            device_profile=args.device,
        )
        comp_file = args.output_dir / f"{args.device}_{args.compare_with.stem}_bench.json"
        with comp_file.open("w", encoding="utf-8") as f:
            json.dump(comp_report, f, indent=2)

        md_path = args.output_dir / "COMPARATIVE_BENCHMARK.md"
        generate_comparison_markdown(base_report, comp_report, md_path)
        print(f"Comparative report generated at {md_path}")


if __name__ == "__main__":
    main()
