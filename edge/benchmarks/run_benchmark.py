"""Device benchmark: FPS, latency, RAM, temp.

Runs a synthetic inference loop on the target device and reports throughput,
per-frame latency percentiles, peak RAM, and thermal readings.

Run::

    python -m edge.benchmarks.run_benchmark --device jetson --iterations 500
"""

from __future__ import annotations

import argparse
import sys


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Edge device benchmark.")
    parser.add_argument(
        "--device",
        type=str,
        choices=["jetson", "rpi", "coral", "generic"],
        default="generic",
        help="Target device profile.",
    )
    parser.add_argument("--iterations", type=int, default=500, help="Benchmark iterations.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the benchmark CLI."""
    _args = parse_args(argv)
    print("Device benchmark not yet implemented. See Phase 5.")
    sys.exit(0)


if __name__ == "__main__":
    main()
