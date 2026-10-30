"""Model inference (ONNX/TFLite) for edge deployment.

Loads an exported model and runs detection on incoming frames, returning
bounding boxes, class IDs, and confidence scores.

Run::

    python -m edge.agent.infer --config edge/configs/edge_config.yaml
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Edge model inference.")
    parser.add_argument("--config", type=Path, required=True, help="Edge config YAML.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the inference CLI."""
    _args = parse_args(argv)
    print("Model not loaded. Inference not yet implemented. See Phase 5.")
    sys.exit(0)


if __name__ == "__main__":
    main()
