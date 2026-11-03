"""Unit tests for multi-environment path management (configs/paths.py)."""

from pathlib import Path

import pytest
from configs.paths import detect_environment, get_paths, load_path_config


def test_load_path_config() -> None:
    """Verify paths.yaml parses valid dictionary with local, colab, and kaggle."""
    cfg = load_path_config()
    assert isinstance(cfg, dict)
    assert "local" in cfg
    assert "colab" in cfg
    assert "kaggle" in cfg


def test_detect_environment_override(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify environment detection respects SCAMROAD_ENV override."""
    monkeypatch.setenv("SCAMROAD_ENV", "colab")
    assert detect_environment() == "colab"

    monkeypatch.setenv("SCAMROAD_ENV", "kaggle")
    assert detect_environment() == "kaggle"

    monkeypatch.setenv("SCAMROAD_ENV", "local")
    assert detect_environment() == "local"


def test_detect_environment_kaggle(monkeypatch: pytest.MonkeyPatch) -> None:
    """Verify Kaggle environment variable detection."""
    monkeypatch.delenv("SCAMROAD_ENV", raising=False)
    monkeypatch.setenv("KAGGLE_KERNEL_RUN_TYPE", "Interactive")
    assert detect_environment() == "kaggle"


def test_get_paths_local() -> None:
    """Verify local path resolution yields Path instances."""
    paths = get_paths("local")
    assert isinstance(paths["runs_dir"], Path)
    assert isinstance(paths["weights_dir"], Path)
    assert isinstance(paths["datasets_dir"], Path)
    assert isinstance(paths["exports_dir"], Path)


def test_get_paths_colab() -> None:
    """Verify colab paths resolve to Google Drive persistent mount."""
    paths = get_paths("colab")
    assert paths["drive_root"].as_posix().endswith("/content/drive/MyDrive/scam_road")
    assert paths["datasets_dir"].as_posix().endswith("/content/drive/MyDrive/scam_road/datasets")
    assert paths["runs_dir"].as_posix().endswith("/content/drive/MyDrive/scam_road/runs")
    assert paths["weights_dir"].as_posix().endswith("/content/drive/MyDrive/scam_road/weights")


def test_get_paths_kaggle() -> None:
    """Verify kaggle paths resolve to Kaggle working and input spaces."""
    paths = get_paths("kaggle")
    assert paths["datasets_dir"].as_posix().endswith("/kaggle/input")
    assert paths["runs_dir"].as_posix().endswith("/kaggle/working/scam_road/runs")
    assert paths["weights_dir"].as_posix().endswith("/kaggle/working/scam_road/weights")
