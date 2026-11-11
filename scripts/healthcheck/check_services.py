"""Healthcheck: verify that core ScamRoad services are reachable.

Attempts TCP connections to PostgreSQL, Redis, MinIO, and the API server
on their default ports and reports the status of each.

Run::

    python scripts/healthcheck/check_services.py
"""

from __future__ import annotations

import socket
import sys

# (name, host, port)
SERVICES: list[tuple[str, str, int]] = [
    ("PostgreSQL", "127.0.0.1", 5432),
    ("Redis", "127.0.0.1", 6379),
    ("MinIO", "127.0.0.1", 9000),
    ("API", "127.0.0.1", 8000),
]


def check_port(host: str, port: int, timeout: float = 2.0) -> bool:
    """Return True if a TCP connection to *host*:*port* succeeds."""
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except (OSError, ConnectionRefusedError, TimeoutError):
        return False


def main() -> None:
    """Check reachability of all configured services and print a summary."""
    all_ok = True
    print("ScamRoad — Service Healthcheck")
    print("=" * 40)
    for name, host, port in SERVICES:
        ok = check_port(host, port)
        status = "reachable" if ok else "unreachable"
        print(f"  {name:.<20s} {host}:{port}  {status}")
        if not ok:
            all_ok = False
    print("=" * 40)
    if all_ok:
        print("All services reachable.")
    else:
        print("Some services are unreachable. Check docker-compose / infra.")
        sys.exit(1)


if __name__ == "__main__":
    main()
