"""YOLO training script for ScamRoad road-defect detection.

Loads a configuration YAML and launches Ultralytics YOLO training.

Run::

    python -m ml.training.train --cfg ml/configs/default.yaml
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Train a ScamRoad detection model.")
    parser.add_argument("--cfg", type=Path, required=True, help="Training config YAML.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the training CLI."""
    _args = parse_args(argv)
    print("Training script not yet implemented. See Phase 3.")
    sys.exit(0)


if __name__ == "__main__":
    main()
