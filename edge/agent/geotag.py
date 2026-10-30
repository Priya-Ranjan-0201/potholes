"""GPS geotagging with Kalman filter.

Reads NMEA sentences from a serial GPS module, applies a Kalman filter for
smoothing, and attaches (lat, lon, heading, speed) to each detection frame.

Run::

    python -m edge.agent.geotag --port /dev/ttyUSB0
"""

from __future__ import annotations

import argparse
import sys


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="GPS geotagging service.")
    parser.add_argument("--port", type=str, default="/dev/ttyUSB0", help="Serial GPS port.")
    parser.add_argument("--baud", type=int, default=9600, help="Baud rate.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the geotagging CLI."""
    _args = parse_args(argv)
    print("GPS geotagging not yet implemented. See Phase 5.")
    sys.exit(0)


if __name__ == "__main__":
    main()
