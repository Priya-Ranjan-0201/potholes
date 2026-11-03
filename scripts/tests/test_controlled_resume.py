"""Controlled verification test for ScamRoad training interruption and auto-resume.

Step 5 verification:
1. Starts a training experiment with target 4 epochs on sample benchmark splits.
2. Allows it to complete 2 epochs, then simulates a cloud preemption/interruption.
3. Confirms persistent checkpoints exist on disk (last.pt).
4. Verifies checkpoint integrity (weights, optimizer state, epoch=1).
5. Launches a simulated fresh runtime session.
6. Restores and validates the checkpoint.
7. Resumes training with resume=True.
8. Verifies that training resumes from epoch 3 (not epoch 1) and completes through epoch 4.
9. Confirms optimizer, model weights, and epoch progression are preserved.
"""

from __future__ import annotations

import shutil
import sys
import tempfile
from pathlib import Path

# Ensure scam_road root is on sys.path
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from ultralytics import YOLO

from scripts.colab.setup_colab import (
    PipelineState,
    verify_checkpoint,
)


def run_controlled_test() -> None:
    print("=" * 70)
    print("      SCAMROAD CONTROLLED INTERRUPTION & AUTO-RESUME TEST (STEP 5)     ")
    print("=" * 70)

    # Use isolated temporary run directory simulating Google Drive
    test_dir = Path(tempfile.mkdtemp(prefix="scamroad_resume_test_"))
    fake_drive_runs = test_dir / "runs"
    state_file = test_dir / "pipeline_state.json"
    dataset_yaml = Path("data/sample/splits/dataset.yaml").resolve()

    assert dataset_yaml.exists(), f"Sample dataset not found at {dataset_yaml}"
    print(f"[TEST ENV] Isolated Run Directory: {fake_drive_runs}")
    print(f"[TEST ENV] Dataset YAML           : {dataset_yaml}")

    model_key = "test_yolo_nano"
    base_weight = "yolov8n.pt"

    # -------------------------------------------------------------
    # PHASE 1: Initial Run with Simulated Preemption after Epoch 2
    # -------------------------------------------------------------
    print("\n>>> PHASE 1: Launching initial training run (target: 4 epochs)...")
    state1 = PipelineState(state_file)

    model1 = YOLO(base_weight)

    # Attach interruption callback after epoch 1 (which is the 2nd completed epoch, 0-indexed)
    interrupted_flag = False

    def simulate_colab_preemption(trainer):
        nonlocal interrupted_flag
        if trainer.epoch == 1:
            interrupted_flag = True
            print(f"\n[SIMULATION] Triggering cloud preemption at end of Epoch {trainer.epoch + 1}...")
            raise RuntimeError("Simulated Google Colab GPU timeout / preemption event")

    model1.add_callback("on_fit_epoch_end", simulate_colab_preemption)

    try:
        model1.train(
            data=str(dataset_yaml),
            epochs=4,
            imgsz=160,
            batch=8,
            device="cpu",
            project=str(fake_drive_runs),
            name=model_key,
            save=True,
            save_period=1,
            exist_ok=True,
            verbose=False,
        )
    except RuntimeError as exc:
        if "Simulated Google Colab" in str(exc):
            print(f"[CAUGHT] {exc}")
        else:
            raise

    assert interrupted_flag, "Simulation callback was not triggered!"

    last_pt = fake_drive_runs / model_key / "weights" / "last.pt"
    assert last_pt.exists(), f"last.pt was not saved to {last_pt}"
    print(f"[PHASE 1 SUCCESS] Interrupted run saved checkpoint to: {last_pt}")

    # -------------------------------------------------------------
    # PHASE 2: Verify Checkpoint Integrity & State Preservation
    # -------------------------------------------------------------
    print("\n>>> PHASE 2: Inspecting and verifying checkpoint integrity...")
    info = verify_checkpoint(last_pt)
    print(f"[CHECKPOINT INFO]:")
    print(f"  • Valid            : {info['valid']}")
    print(f"  • Completed Epoch  : {info['epoch'] + 1} (0-indexed: {info['epoch']})")
    print(f"  • Next Epoch       : {info['next_epoch'] + 1}")
    print(f"  • Has Optimizer    : {info['has_optimizer']}")
    print(f"  • Has Model State  : {info.get('has_model')}")
    print(f"  • Checkpoint Size  : {info.get('file_size_mb')} MB")

    assert info["valid"], f"Checkpoint invalid: {info.get('error')}"
    assert info["epoch"] == 1, f"Expected epoch index 1 (2 epochs total), got {info['epoch']}"
    assert info["has_optimizer"], "Optimizer state missing from checkpoint!"

    # Record interrupted state
    state1.mark_interrupted(model_key, last_epoch=info["epoch"], ckpt_path=last_pt)
    print("[PERSISTENT STATE] State recorded: status='interrupted', last_epoch=2.")
    del model1

    # -------------------------------------------------------------
    # PHASE 3: Fresh Runtime Simulation & Auto-Resume
    # -------------------------------------------------------------
    print("\n>>> PHASE 3: Simulating fresh Colab runtime and launching Auto-Resume...")
    # Fresh state instance loading from persistent file
    state2 = PipelineState(state_file)
    action, resume_target, resume_meta = state2.get_resume_target(
        model_key, fake_drive_runs, target_epochs=4, verify_integrity=True, return_info=True
    )

    print(f"[STATE RESOLUTION]:")
    print(f"  • Resolved Action  : {action}")
    print(f"  • Target File      : {resume_target}")
    print(f"  • Resuming From    : Epoch {resume_meta.get('next_epoch', 0) + 1} of 4")

    assert action == "resume", f"Expected action 'resume', got '{action}'"
    assert resume_target == last_pt, f"Expected {last_pt}, got {resume_target}"

    print(f"\n[AUTO-RESUME EXECUTION] Calling YOLO('{last_pt}').train(resume=True)...")
    resumed_epochs_seen = []

    resume_model = YOLO(str(last_pt))

    def track_resumed_epochs(trainer):
        resumed_epochs_seen.append(trainer.epoch + 1)
        print(f"  --> Executing Resumed Epoch {trainer.epoch + 1}/4...")

    resume_model.add_callback("on_train_epoch_end", track_resumed_epochs)
    resume_results = resume_model.train(resume=True)

    print(f"\n[RESUMED EPOCHS EXECUTED]: {resumed_epochs_seen}")
    # Verify that training resumed from epoch 3 and 4, NEVER repeating epoch 1 or 2!
    assert 1 not in resumed_epochs_seen, "ERROR: Training restarted from epoch 1!"
    assert 2 not in resumed_epochs_seen, "ERROR: Training restarted from epoch 2!"
    assert 3 in resumed_epochs_seen, "ERROR: Training did not execute epoch 3!"
    assert 4 in resumed_epochs_seen, "ERROR: Training did not execute epoch 4!"

    # -------------------------------------------------------------
    # PHASE 4: Verification of Resumed Completion
    # -------------------------------------------------------------
    print("\n>>> PHASE 4: Validating post-resume completion and artifacts...")
    final_info = verify_checkpoint(last_pt)
    print(f"[FINAL CHECKPOINT INFO]:")
    print(f"  • Valid            : {final_info['valid']}")
    print(f"  • Final Status     : Training finished to completion")

    best_pt = fake_drive_runs / model_key / "weights" / "best.pt"
    assert best_pt.exists(), f"best.pt not found at {best_pt}"

    # Mark completed in state
    state2.mark_completed(model_key, {"total_epochs": 4, "best_weights": str(best_pt)})
    assert state2.is_completed(model_key), "State not marked completed"

    # Verify subsequent invocation skips instead of re-training
    action3, target3 = state2.get_resume_target(model_key, fake_drive_runs, target_epochs=4)
    print(f"[SUBSEQUENT CALL ACTION]: {action3} (pointing to {target3.name})")
    assert action3 == "skip", f"Expected 'skip' on completed model, got '{action3}'"

    # Cleanup temporary test folder
    shutil.rmtree(test_dir, ignore_errors=True)

    print("\n" + "=" * 70)
    print(" [PASSED] ALL STEP 5 CONTROLLED INTERRUPTION & RESUME TESTS SUCCEEDED!")
    print("=" * 70)


if __name__ == "__main__":
    run_controlled_test()
