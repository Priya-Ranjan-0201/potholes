"""Dataset audit: per-class counts, duplicates, corrupt files, label errors.

Run::

    python -m ml.data.audit --data-dir <path>
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Audit a ScamRoad dataset directory.")
    parser.add_argument(
        "--data-dir",
        type=Path,
        required=True,
        help="Root directory of the dataset to audit.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the dataset audit CLI."""
    _args = parse_args(argv)
    print("Dataset audit not yet implemented. See Phase 2.")
    sys.exit(0)


if __name__ == "__main__":
    main()
