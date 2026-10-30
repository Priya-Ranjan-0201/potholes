"""Post-training quantisation for edge deployment.

Applies INT8 or FP16 quantisation to an ONNX model using calibration data
to minimise accuracy loss on target hardware (Jetson, RPi, Coral).

Run::

    python -m ml.quantization.quantize --model <onnx> --precision int8
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Quantise a ScamRoad ONNX model.")
    parser.add_argument("--model", type=Path, required=True, help="ONNX model file.")
    parser.add_argument(
        "--precision",
        choices=["int8", "fp16"],
        default="int8",
        help="Target precision.",
    )
    parser.add_argument("--calibration-dir", type=Path, help="Calibration images directory.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the quantisation CLI."""
    _args = parse_args(argv)
    print("Quantisation not yet implemented. See Phase 4.")
    sys.exit(0)


if __name__ == "__main__":
    main()
