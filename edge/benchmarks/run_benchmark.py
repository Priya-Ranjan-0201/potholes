"""Device edge benchmark suite for ScamRoad detection models.

Measures inference latency percentiles (p50, p90, p95, p99), end-to-end FPS throughput,
peak memory (RSS in MB), and CPU usage across target devices (Android / OPPO K13,
Raspberry Pi, Jetson, and laptop workstations).
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


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Edge device inference benchmark.")
    parser.add_argument("--model", type=Path, required=True, help="Path to ONNX or PT model.")
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
    report = benchmark_onnx_model(
        model_path=args.model,
        iterations=args.iterations,
        warmup=args.warmup,
        imgsz=args.imgsz,
        device_profile=args.device,
    )

    args.output_dir.mkdir(parents=True, exist_ok=True)
    out_file = args.output_dir / f"{args.device}_{args.model.stem}_bench.json"
    with out_file.open("w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    lat = report["latency_ms"]
    p_rss = report["hardware_telemetry"]["process_ram_rss_mb"]
    print(
        f"Benchmark finished: p50={lat['p50']}ms, p95={lat['p95']}ms | "
        f"Throughput: {report['throughput_fps']} FPS | Peak RSS: {p_rss} MB"
    )
    print(f"Report saved to {out_file}")


if __name__ == "__main__":
    main()
