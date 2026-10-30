"""Dataset download with SHA-256 verification.

Downloads configured dataset archives and verifies integrity before extraction.

Run::

    python -m ml.data.download --dataset <name> --out-dir <path>
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Download ScamRoad datasets.")
    parser.add_argument(
        "--dataset", type=str, required=True, help="Dataset identifier to download."
    )
    parser.add_argument("--out-dir", type=Path, default=Path("datasets"), help="Output directory.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the dataset download CLI."""
    _args = parse_args(argv)
    print("Download scripts not yet implemented. See Phase 2.")
    sys.exit(0)


if __name__ == "__main__":
    main()
