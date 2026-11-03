"""ScamRoad Multi-Environment Path Management.

Provides runtime detection for Local, Google Colab, and Kaggle environments,
loading paths from configs/paths.yaml and resolving them to absolute Path objects.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml

# Root directory of the repository
REPO_ROOT = Path(__file__).resolve().parents[1]
CONFIGS_DIR = REPO_ROOT / "configs"
CONFIG_FILE = CONFIGS_DIR / "paths.yaml"


def detect_environment() -> str:
    """Detect whether the current process is running in Colab, Kaggle, or Local.

    Priority:
    1. SCAMROAD_ENV override variable ('colab', 'kaggle', 'local').
    2. Kaggle environment indicators ('KAGGLE_KERNEL_RUN_TYPE', '/kaggle/working').
    3. Google Colab indicators ('google.colab' module, '/content/drive').
    4. Default: 'local'.
    """
    env_override = os.environ.get("SCAMROAD_ENV", "").strip().lower()
    if env_override in {"local", "colab", "kaggle"}:
        return env_override

    # Kaggle detection
    if "KAGGLE_KERNEL_RUN_TYPE" in os.environ or Path("/kaggle/working").exists():
        return "kaggle"

    # Google Colab detection
    try:
        import google.colab  # noqa: F401, PLC0415
    except ImportError:
        is_content = Path("/content").exists()
        has_subdirs = Path("/content/drive").exists() or Path("/content/sample_data").exists()
        if is_content and has_subdirs:
            return "colab"
    else:
        return "colab"

    return "local"


def load_path_config(config_path: Path | str | None = None) -> dict[str, Any]:
    """Load paths.yaml configuration dictionary."""
    path = Path(config_path) if config_path else CONFIG_FILE
    if not path.exists():
        raise FileNotFoundError(f"Path configuration file not found at: {path}")

    with path.open("r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    if not isinstance(cfg, dict):
        raise TypeError(f"Invalid YAML content in {path}, expected dictionary.")

    return cfg


def get_paths(env: str | None = None, config_path: Path | str | None = None) -> dict[str, Path]:
    """Get resolved Path objects for the active environment.

    Args:
        env: Explicit environment name ('local', 'colab', 'kaggle'). If None, auto-detected.
        config_path: Custom path to paths.yaml if not default.

    Returns:
        dict with string keys mapped to absolute Path instances.
    """
    active_env = env or detect_environment()
    cfg = load_path_config(config_path)

    if active_env not in cfg:
        raise KeyError(
            f"Unknown environment '{active_env}'. Expected one of: {list(cfg.keys())}"
        )

    env_cfg: dict[str, Any] = cfg[active_env]
    resolved_paths: dict[str, Path] = {}

    for key, val in env_cfg.items():
        if key == "env_name":
            continue
        # If relative path, resolve relative to REPO_ROOT
        p = Path(val)
        if not p.is_absolute():
            p = (REPO_ROOT / p).resolve()
        resolved_paths[key] = p

    return resolved_paths
