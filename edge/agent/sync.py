"""Sync service with resumable uploads and idempotency.

Reads events from the SQLite outbox, uploads them to the backend API with
resumable chunked uploads, and marks them as synced.  Each upload carries
an idempotency key to prevent duplicates.

Run::

    python -m edge.agent.sync --api-url https://api.scamroad.example.com
"""

from __future__ import annotations

import argparse
import sys


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Sync service for edge-to-cloud upload.")
    parser.add_argument("--api-url", type=str, required=True, help="Backend API base URL.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the sync CLI."""
    _args = parse_args(argv)
    print("Sync service not yet implemented. See Phase 5.")
    sys.exit(0)


if __name__ == "__main__":
    main()
