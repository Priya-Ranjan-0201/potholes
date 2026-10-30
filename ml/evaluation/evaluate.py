"""Model evaluation: mAP, PR curves, confusion matrix.

Runs inference on a validation set and computes detection metrics.

Run::

    python -m ml.evaluation.evaluate --weights <path> --data <yaml>
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Evaluate a ScamRoad detection model.")
    parser.add_argument("--weights", type=Path, required=True, help="Model weights file.")
    parser.add_argument("--data", type=Path, help="Dataset YAML.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the evaluation CLI."""
    _args = parse_args(argv)
    print("Evaluation script not yet implemented. See Phase 4.")
    sys.exit(0)


if __name__ == "__main__":
    main()
