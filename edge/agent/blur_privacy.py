"""Privacy blur for faces and licence plates.

Runs a lightweight detector (or pre-trained model) on each frame and applies
Gaussian blur to regions containing faces or licence plates before any image
is persisted or transmitted.

Run::

    python -m edge.agent.blur_privacy
"""

from __future__ import annotations

import sys


def main() -> None:
    """Entry-point for the privacy-blur CLI."""
    print("Privacy blur not yet implemented. See Phase 5.")
    sys.exit(0)


if __name__ == "__main__":
    main()
