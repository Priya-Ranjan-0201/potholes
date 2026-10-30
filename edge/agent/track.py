"""ByteTrack / BoT-SORT tracker wrapper.

Wraps multi-object tracking algorithms to assign persistent IDs to detected
road defects across consecutive frames, enabling temporal de-duplication.

Run::

    python -m edge.agent.track
"""

from __future__ import annotations

import sys


def main() -> None:
    """Entry-point for the tracker CLI."""
    print("Tracker wrapper not yet implemented. See Phase 5.")
    sys.exit(0)


if __name__ == "__main__":
    main()
