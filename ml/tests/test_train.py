"""Unit tests for ML training pipeline and hardware detection."""

import json
from pathlib import Path

import pytest
import yaml
from scripts.colab.setup_colab import PipelineState

from ml.training.train import (
    compute_file_hash,
    detect_hardware,
    get_git_revision,
    load_config,
    record_provenance,
    train_model,
)


def test_get_git_revision() -> None:
    """Verify git revision returns valid string."""
    sha = get_git_revision()
    assert isinstance(sha, str)
    assert len(sha) > 0


def test_compute_file_hash(tmp_path: Path) -> None:
    """Verify SHA-256 hash computation."""
    f = tmp_path / "test.txt"
    f.write_text("scamroad-data", encoding="utf-8")
    h = compute_file_hash(f)
    assert len(h) == 64
    assert compute_file_hash(tmp_path / "nonexistent.txt") == "FILE_NOT_FOUND"


def test_detect_hardware() -> None:
    """Verify hardware detection structure."""
    hw = detect_hardware()
    assert "platform" in hw
    assert "python_version" in hw
    assert "cuda_available" in hw
    assert "recommended_device" in hw
    assert hw["recommended_device"] in ("0", "cpu", "mps")


def test_load_config_valid(tmp_path: Path) -> None:
    """Verify config loading and validation."""
    cfg_file = tmp_path / "valid.yaml"
    cfg_data = {
        "model": "yolov8n.pt",
        "data": "data.yaml",
        "imgsz": 640,
        "epochs": 10,
    }
    with cfg_file.open("w", encoding="utf-8") as f:
        yaml.dump(cfg_data, f)

    loaded = load_config(cfg_file)
    assert loaded["model"] == "yolov8n.pt"
    assert loaded["epochs"] == 10


def test_load_config_missing_keys(tmp_path: Path) -> None:
    """Verify KeyError when mandatory config keys are missing."""
    cfg_file = tmp_path / "invalid.yaml"
    cfg_data = {"model": "yolov8n.pt"}
    with cfg_file.open("w", encoding="utf-8") as f:
        yaml.dump(cfg_data, f)

    with pytest.raises(KeyError, match="Missing required training config key"):
        load_config(cfg_file)


def test_record_provenance(tmp_path: Path) -> None:
    """Verify provenance metadata file generation."""
    cfg_file = tmp_path / "train_cfg.yaml"
    cfg_file.write_text("model: yolov8n.pt\ndata: dummy.yaml\nimgsz: 640\nepochs: 5\n")
    run_dir = tmp_path / "run_test"
    hw = {"platform": "test", "recommended_device": "cpu"}

    prov_path = record_provenance(
        run_dir,
        {"model": "yolov8n.pt", "data": str(cfg_file)},
        cfg_file,
        hw,
    )
    assert prov_path.exists()

    with prov_path.open("r", encoding="utf-8") as f:
        data = json.load(f)

    assert data["project"] == "ScamRoad"
    assert "git_commit" in data
    assert "config_hash_sha256" in data


def test_train_model_dry_run(tmp_path: Path) -> None:
    """Verify dry_run executes configuration checks and writes summary without training."""
    cfg_file = tmp_path / "pothole_cfg.yaml"
    cfg_data = {
        "model": "yolov8n.pt",
        "data": str(tmp_path / "data.yaml"),
        "imgsz": 640,
        "epochs": 50,
        "project": str(tmp_path / "runs"),
        "name": "dry_run_test",
    }
    with cfg_file.open("w", encoding="utf-8") as f:
        yaml.dump(cfg_data, f)

    (tmp_path / "data.yaml").write_text("nc: 4\nnames: [pothole, c1, c2, c3]\n", encoding="utf-8")

    summary = train_model(
        config_path=cfg_file,
        overrides={"epochs": 5},
        dry_run=True,
    )

    assert summary["status"] == "DRY_RUN_PASSED"
    assert summary["epochs"] == 5
    run_dir = Path(summary["run_dir"])
    assert run_dir.exists()
    assert (run_dir / "provenance.json").exists()
    assert (run_dir / "summary.json").exists()


def test_pipeline_state_save_and_resume(tmp_path: Path) -> None:
    """Verify PipelineState checkpoint management and resume target resolution."""
    state_file = tmp_path / "pipeline_state.json"
    ps = PipelineState(state_file)

    # Initial state
    assert not ps.is_completed("yolo11n")
    runs_dir = tmp_path / "runs"
    model_dir = runs_dir / "yolo11n"
    weights_dir = model_dir / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)

    action, target = ps.get_resume_target("yolo11n", runs_dir)
    assert action == "fresh"
    assert target is None

    # Simulate interruption with last.pt
    last_pt = weights_dir / "last.pt"
    last_pt.write_text("fake_last_weights", encoding="utf-8")
    action, target = ps.get_resume_target("yolo11n", runs_dir)
    assert action == "resume"
    assert target == last_pt

    # Simulate completion with best.pt and marked status
    best_pt = weights_dir / "best.pt"
    best_pt.write_text("fake_best_weights", encoding="utf-8")
    ps.mark_completed("yolo11n", {"best_pt": str(best_pt)})
    assert ps.is_completed("yolo11n")

    action, target = ps.get_resume_target("yolo11n", runs_dir)
    assert action == "skip"
    assert target == best_pt

    # Re-instantiate to verify disk persistence
    ps2 = PipelineState(state_file)
    assert ps2.is_completed("yolo11n")
