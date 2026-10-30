"""Camera capture with non-blocking ring buffer.

Provides a threaded capture loop that writes frames into a fixed-size ring
buffer so that inference can consume frames at its own pace without blocking
the camera driver.

Run::

    python -m edge.agent.capture --device 0 --buffer-size 64
"""

from __future__ import annotations

import argparse
import sys


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Camera ring-buffer capture.")
    parser.add_argument("--device", type=int, default=0, help="Camera device index.")
    parser.add_argument("--buffer-size", type=int, default=64, help="Ring buffer capacity.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the capture CLI."""
    _args = parse_args(argv)
    print("Camera capture not yet implemented. See Phase 5.")
    sys.exit(0)


if __name__ == "__main__":
    main()
