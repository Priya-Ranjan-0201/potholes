"""Health monitoring: FPS, temp, RAM, GPS, queue depth.

Periodically samples device metrics and exposes them via a local HTTP
endpoint for Prometheus scraping and systemd watchdog integration.

Run::

    python -m edge.agent.health --interval 10
"""

from __future__ import annotations

import argparse
import sys


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Edge device health monitor.")
    parser.add_argument("--interval", type=int, default=10, help="Sampling interval (seconds).")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the health monitor CLI."""
    _args = parse_args(argv)
    print("Health monitoring not yet implemented. See Phase 5.")
    sys.exit(0)


if __name__ == "__main__":
    main()
