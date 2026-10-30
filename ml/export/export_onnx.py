"""Export trained YOLO model to ONNX format for edge deployment.

Converts a PyTorch ``.pt`` checkpoint to an optimised ONNX graph with
configurable opset and dynamic-axis settings.

Run::

    python -m ml.export.export_onnx --weights <path> --imgsz 640
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Export ScamRoad model to ONNX.")
    parser.add_argument("--weights", type=Path, required=True, help="PyTorch weights file.")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size.")
    parser.add_argument("--opset", type=int, default=17, help="ONNX opset version.")
    parser.add_argument("--dynamic", action="store_true", help="Enable dynamic axes.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the ONNX export CLI."""
    _args = parse_args(argv)
    print("ONNX export not yet implemented. See Phase 4.")
    sys.exit(0)


if __name__ == "__main__":
    main()
