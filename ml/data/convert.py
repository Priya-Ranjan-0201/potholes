"""Label unification: map sources to taxonomy.yaml.

Run::

    python -m ml.data.convert --source <path> --target <path>
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Convert dataset labels to unified taxonomy.")
    parser.add_argument("--source", type=Path, required=True, help="Source dataset directory.")
    parser.add_argument("--target", type=Path, required=True, help="Target output directory.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the label conversion CLI."""
    _args = parse_args(argv)
    print("Label conversion not yet implemented. See Phase 2.")
    sys.exit(0)


if __name__ == "__main__":
    main()
