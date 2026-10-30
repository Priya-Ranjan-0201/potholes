"""SQLite WAL outbox for offline-first sync.

Stores detection events in a local SQLite database (WAL mode) so that the
edge device continues to operate when the network is unavailable.  Events
are dequeued by the sync service once connectivity is restored.

Run::

    python -m edge.agent.outbox --db-path /var/lib/scamroad/outbox.db
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="SQLite outbox manager.")
    parser.add_argument(
        "--db-path",
        type=Path,
        default=Path("/var/lib/scamroad/outbox.db"),
        help="Outbox database path.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the outbox CLI."""
    _args = parse_args(argv)
    print("SQLite outbox not yet implemented. See Phase 5.")
    sys.exit(0)


if __name__ == "__main__":
    main()
