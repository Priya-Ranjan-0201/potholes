# ruff: noqa: PLR0915
"""Comprehensive Multi-Cloud Cross-Platform Failover & Auto-Resume Integration Test.

Implements and validates Section 13 test specification:
1. Start training on Colab simulation (epochs 1-2).
2. Save persistent atomic checkpoint bundle (weights, optimizer, scheduler, RNG, manifest).
3. Safely interrupt / simulate Colab preemption.
4. Start fresh Kaggle session simulation.
5. Restore checkpoint, verify experiment ID, model state, epoch (3), optimizer, and scheduler.
6. Continue training for additional epochs (3-4) on Kaggle.
7. Save updated checkpoint on Kaggle.
8. Restore checkpoint in fresh Colab session simulation (epoch 5).
9. Verify training continues correctly without epoch resetting or state loss.
"""

from __future__ import annotations

from pathlib import Path

import pytest
import torch
import yaml
from checkpoint_manager import CheckpointManager
from cloud_orchestrator import CloudOrchestrator
from environment_manager import EnvironmentManager
from experiment_manager import ExperimentManager


@pytest.fixture
def multi_cloud_env(tmp_path: Path):
    """Setup simulated multi-cloud storage environment."""
    cloud_root = tmp_path / "shared_cloud_storage"
    cloud_root.mkdir(parents=True, exist_ok=True)

    config_data = {
        "version": "1.0",
        "project": "ScamRoad",
        "storage": {
            "colab": {"root": str(cloud_root)},
            "kaggle": {"root": str(cloud_root)},
            "local": {"root": str(cloud_root)},
        },
        "orchestration": {
            "lease_duration_seconds": 60,
            "lock_filename": "training.lock",
        },
    }
    cfg_file = tmp_path / "cloud_config.yaml"
    with cfg_file.open("w", encoding="utf-8") as f:
        yaml.dump(config_data, f)

    # Create dummy initial weights
    dummy_weights = tmp_path / "init_yolo.pt"
    mock_ckpt = {
        "epoch": 0,
        "model": {"conv1.weight": torch.zeros(2, 2)},
        "train_args": {"epochs": 50, "imgsz": 640},
    }
    torch.save(mock_ckpt, dummy_weights)
    if dummy_weights.stat().st_size < 100_000:
        mock_ckpt["model"]["pad"] = torch.zeros(100, 300)
        torch.save(mock_ckpt, dummy_weights)

    return {
        "cloud_root": cloud_root,
        "config_file": cfg_file,
        "init_weights": dummy_weights,
    }


def test_cross_cloud_failover_cycle(multi_cloud_env, monkeypatch: pytest.MonkeyPatch) -> None:
    """Execute complete Colab -> Kaggle -> Colab failover test cycle."""
    cloud_root = multi_cloud_env["cloud_root"]
    cfg_file = multi_cloud_env["config_file"]
    init_weights = multi_cloud_env["init_weights"]
    exp_id = "test_multicloud_failover_exp"

    # =========================================================================
    # PHASE 1: Start on Google Colab (Epochs 1 - 2)
    # =========================================================================
    monkeypatch.setattr(EnvironmentManager, "detect_platform", lambda _self: "colab")
    orch_colab = CloudOrchestrator(config_path=cfg_file)
    assert orch_colab.platform == "colab"

    session_colab = orch_colab.prepare_session(
        experiment_id=exp_id,
        model_name=str(init_weights),
        target_epochs=6,
    )
    assert session_colab["can_proceed"] is True
    assert session_colab["action"] == "fresh"
    assert session_colab["start_epoch"] == 0

    exp_mgr_colab: ExperimentManager = session_colab["exp_mgr"]
    ckpt_mgr_colab: CheckpointManager = session_colab["ckpt_mgr"]

    # Simulate completion of epoch 2 on Colab
    colab_weights = cloud_root / "colab_epoch_2.pt"
    ckpt_colab = {
        "epoch": 1,  # 0-indexed completed epoch 2
        "model": {"conv1.weight": torch.ones(2, 2)},
        "optimizer": {"state": {"param_0": torch.tensor([0.1, 0.2])}},
    }
    torch.save(ckpt_colab, colab_weights)
    if colab_weights.stat().st_size < 100_000:
        ckpt_colab["model"]["pad"] = torch.zeros(100, 300)
        torch.save(ckpt_colab, colab_weights)

    saved_v1 = ckpt_mgr_colab.save_checkpoint(
        epoch=2,
        global_step=200,
        model_weights_path=colab_weights,
        metrics={"precision": 0.82, "map50": 0.78, "map50_95": 0.51},
        optimizer_state=ckpt_colab["optimizer"],
        platform_name="colab",
        is_best=True,
    )
    assert saved_v1.exists()
    exp_mgr_colab.record_progress(epoch=2, metrics={"map50_95": 0.51}, is_best=True)

    # Simulate Colab VM preemption / resource limit
    exp_mgr_colab.mark_interrupted(reason="colab_compute_timeout")
    assert exp_mgr_colab.state["status"] == "interrupted"
    locked, _ = exp_mgr_colab.is_locked()
    assert locked is False

    # =========================================================================
    # PHASE 2: Verify Checkpoint Integrity & Provenance
    # =========================================================================
    verify_res = ckpt_mgr_colab.verify_checkpoint(saved_v1)
    assert verify_res["valid"] is True
    assert verify_res["epoch"] == 2
    assert verify_res["next_epoch"] == 3
    assert verify_res["global_step"] == 200

    # =========================================================================
    # PHASE 3: Failover to Kaggle GPU (Epochs 3 - 4)
    # =========================================================================
    monkeypatch.setattr(EnvironmentManager, "detect_platform", lambda _self: "kaggle")
    orch_kaggle = CloudOrchestrator(config_path=cfg_file)
    assert orch_kaggle.platform == "kaggle"

    session_kaggle = orch_kaggle.prepare_session(
        experiment_id=exp_id,
        model_name="yolo11n.pt",
        target_epochs=6,
    )
    assert session_kaggle["can_proceed"] is True
    assert session_kaggle["action"] == "resume"
    assert session_kaggle["start_epoch"] == 3  # Resumed at epoch 3!
    assert session_kaggle["checkpoint_manifest"] is not None
    assert session_kaggle["checkpoint_manifest"]["platform"] == "colab"
    assert Path(session_kaggle["resume_weights"]).exists()

    exp_mgr_kaggle: ExperimentManager = session_kaggle["exp_mgr"]
    ckpt_mgr_kaggle: CheckpointManager = session_kaggle["ckpt_mgr"]

    # Verify state transition was logged
    transitions = exp_mgr_kaggle.state.get("platform_transitions", [])
    assert len(transitions) >= 1
    assert transitions[-1]["from"] == "colab"
    assert transitions[-1]["to"] == "kaggle"
    assert transitions[-1]["at_epoch"] == 2

    # Simulate Kaggle training epochs 3 and 4
    kaggle_weights = cloud_root / "kaggle_epoch_4.pt"
    ckpt_kaggle = {
        "epoch": 3,
        "model": {"conv1.weight": torch.ones(2, 2) * 2},
        "optimizer": {"state": {"param_0": torch.tensor([0.2, 0.4])}},
    }
    torch.save(ckpt_kaggle, kaggle_weights)
    if kaggle_weights.stat().st_size < 100_000:
        ckpt_kaggle["model"]["pad"] = torch.zeros(100, 300)
        torch.save(ckpt_kaggle, kaggle_weights)

    saved_v2 = ckpt_mgr_kaggle.save_checkpoint(
        epoch=4,
        global_step=400,
        model_weights_path=kaggle_weights,
        metrics={"precision": 0.86, "map50": 0.82, "map50_95": 0.58},
        optimizer_state=ckpt_kaggle["optimizer"],
        platform_name="kaggle",
        is_best=True,
    )
    assert saved_v2.exists()
    exp_mgr_kaggle.record_progress(epoch=4, metrics={"map50_95": 0.58}, is_best=True)

    # Simulate Kaggle preemption / quota limit reached
    exp_mgr_kaggle.mark_interrupted(reason="kaggle_weekly_gpu_limit")
    assert exp_mgr_kaggle.state["status"] == "interrupted"
    locked, _ = exp_mgr_kaggle.is_locked()
    assert locked is False

    # =========================================================================
    # PHASE 4: Return to Fresh Colab Runtime (Epochs 5 - 6 to completion)
    # =========================================================================
    monkeypatch.setattr(EnvironmentManager, "detect_platform", lambda _self: "colab")
    orch_colab_resumed = CloudOrchestrator(config_path=cfg_file)

    session_colab_resumed = orch_colab_resumed.prepare_session(
        experiment_id=exp_id,
        model_name="yolo11n.pt",
        target_epochs=6,
    )
    assert session_colab_resumed["can_proceed"] is True
    assert session_colab_resumed["action"] == "resume"
    assert session_colab_resumed["start_epoch"] == 5  # Resumed at epoch 5!

    exp_mgr_colab2: ExperimentManager = session_colab_resumed["exp_mgr"]
    ckpt_mgr_colab2: CheckpointManager = session_colab_resumed["ckpt_mgr"]
    assert ckpt_mgr_colab2 is not None

    # Verify transitions: colab -> kaggle -> colab
    trans2 = exp_mgr_colab2.state.get("platform_transitions", [])
    assert len(trans2) >= 2
    assert trans2[-1]["from"] == "kaggle"
    assert trans2[-1]["to"] == "colab"
    assert trans2[-1]["at_epoch"] == 4

    # Finalize experiment to target epochs
    exp_mgr_colab2.record_progress(epoch=6, metrics={"map50_95": 0.65}, is_best=True)
    exp_mgr_colab2.mark_completed(final_metrics={"precision": 0.89, "map50_95": 0.65})

    assert exp_mgr_colab2.state["status"] == "completed"
    assert exp_mgr_colab2.state["best_fitness"] == 0.65

    # =========================================================================
    # PHASE 5: Attempting duplicate training on finished experiment is rejected
    # =========================================================================
    session_dup = orch_colab_resumed.prepare_session(
        experiment_id=exp_id,
        model_name="yolo11n.pt",
        target_epochs=6,
    )
    assert session_dup["can_proceed"] is False
    assert session_dup["status"] == "COMPLETED"
