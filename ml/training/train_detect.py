"""Ultralytics YOLO detector training script for ScamRoad.

Adheres to Step 3 specification:
- Model architectures: YOLO (n/s sizes, e.g., yolo11n, yolo11s, yolov8n, yolov8s).
- CLI args for epochs, imgsz, batch, --resume, seed, device, run_id.
- Saves runs to Drive or local runs/<run_id>/ with:
  * config.yaml
  * git commit SHA and dataset descriptor hash
  * hardware environment specifications
  * duration and execution timestamps
  * metrics.json (precision, recall, F1, mAP@50, mAP@50-95 overall and per-class)
  * PR curve and confusion matrix
  * weights/last.pt (saved every epoch) and weights/best.pt
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# Ensure project root is in sys.path
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

import torch

# 1. Alias serialization modules to prevent torch.load / unpickling errors
if "torch.utils.serialization" not in sys.modules:
    try:
        sys.modules["torch.utils.serialization"] = torch.serialization
    except Exception:
        pass
if "torch.utils.serialization.config" not in sys.modules:
    try:
        sys.modules["torch.utils.serialization.config"] = types.ModuleType("torch.utils.serialization.config")
    except Exception:
        pass

# 2. Patch torch.use_deterministic_algorithms to prevent inductor config crash
_orig_use_deterministic_algorithms = getattr(torch, "use_deterministic_algorithms", None)
if _orig_use_deterministic_algorithms is not None:
    def _safe_use_deterministic_algorithms(mode: bool, *, warn_only: bool = False) -> None:
        try:
            _orig_use_deterministic_algorithms(mode, warn_only=warn_only)
        except (AttributeError, Exception):
            try:
                if hasattr(torch, "_C") and hasattr(torch._C, "_set_deterministic_algorithms"):
                    torch._C._set_deterministic_algorithms(mode, warn_only=warn_only)
            except Exception:
                pass
    torch.use_deterministic_algorithms = _safe_use_deterministic_algorithms

# 3. Patch torch._inductor.config if it is a ConfigModule to allow setting deterministic
try:
    import torch._inductor.config as ic
    orig_setattr = type(ic).__setattr__
    def _safe_config_setattr(self, name, value):
        try:
            orig_setattr(self, name, value)
        except AttributeError:
            object.__setattr__(self, name, value)
    type(ic).__setattr__ = _safe_config_setattr
    ic.deterministic = False
except Exception:
    pass

# 4. Patch Ultralytics unset_deterministic
try:
    import ultralytics.utils.torch_utils as tu
    _orig_unset_deterministic = tu.unset_deterministic
    def _safe_unset_deterministic():
        try:
            _orig_unset_deterministic()
        except Exception:
            try:
                torch.backends.cudnn.deterministic = False
            except Exception:
                pass
    tu.unset_deterministic = _safe_unset_deterministic
except Exception:
    pass

import yaml
from configs.paths import get_paths
from ultralytics import YOLO
from ultralytics.engine.trainer import BaseTrainer

# Bulletproof BaseTrainer.run_callbacks against non-callable booleans
_orig_run_callbacks = BaseTrainer.run_callbacks

def _safe_run_callbacks(self, event: str) -> None:
    for callback in self.callbacks.get(event, []):
        if callable(callback):
            try:
                callback(self)
            except Exception as exc:
                print(f"[CALLBACK NOTICE] Non-fatal callback issue on '{event}': {exc}")

BaseTrainer.run_callbacks = _safe_run_callbacks


def get_git_revision() -> str:
    """Retrieve current Git commit SHA for provenance tracking."""
    git_bin = shutil.which("git") or "git"
    try:
        out = subprocess.check_output(  # noqa: S603
            [git_bin, "rev-parse", "HEAD"], stderr=subprocess.DEVNULL, text=True
        )
        return out.strip()
    except Exception:
        return "UNKNOWN_GIT_REVISION"


def compute_file_hash(path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    if not path.exists():
        return "FILE_NOT_FOUND"
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def detect_hardware() -> dict[str, Any]:
    """Detect local or cloud execution hardware."""
    hardware: dict[str, Any] = {
        "platform": platform.platform(),
        "python_version": sys.version.split()[0],
        "torch_version": torch.__version__,
        "is_colab": Path("/content").exists(),
        "is_kaggle": "KAGGLE_KERNEL_RUN_TYPE" in os.environ,
        "cuda_available": False,
        "gpu_name": None,
        "vram_gb": None,
        "recommended_device": "cpu",
    }

    if torch.cuda.is_available():
        hardware["cuda_available"] = True
        hardware["gpu_name"] = torch.cuda.get_device_name(0)
        mem_bytes = torch.cuda.get_device_properties(0).total_memory
        hardware["vram_gb"] = round(mem_bytes / (1024**3), 2)
        hardware["recommended_device"] = "0"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        hardware["recommended_device"] = "mps"

    return hardware


def extract_metrics_json(results: Any) -> dict[str, Any]:
    """Extract precision, recall, F1, mAP@50, and mAP@50-95 per class and overall."""
    box = getattr(results, "box", None)
    if box is None:
        return {"all": {}, "per_class": {}}

    names = getattr(results, "names", {})
    all_p = float(box.mp) if hasattr(box, "mp") else 0.0
    all_r = float(box.mr) if hasattr(box, "mr") else 0.0
    all_map50 = float(box.map50) if hasattr(box, "map50") else 0.0
    all_map50_95 = float(box.map) if hasattr(box, "map") else 0.0
    all_f1 = (2 * all_p * all_r / (all_p + all_r)) if (all_p + all_r) > 0 else 0.0

    metrics: dict[str, Any] = {
        "all": {
            "precision": round(all_p, 4),
            "recall": round(all_r, 4),
            "f1": round(all_f1, 4),
            "map50": round(all_map50, 4),
            "map50_95": round(all_map50_95, 4),
        },
        "per_class": {},
    }

    # Per-class metrics
    p_per_class = getattr(box, "p", [])
    r_per_class = getattr(box, "r", [])
    f1_per_class = getattr(box, "f1", [])
    maps_per_class = getattr(box, "maps", [])

    for cls_idx, cls_name in names.items():
        p_val = float(p_per_class[cls_idx]) if cls_idx < len(p_per_class) else 0.0
        r_val = float(r_per_class[cls_idx]) if cls_idx < len(r_per_class) else 0.0
        f1_val = float(f1_per_class[cls_idx]) if cls_idx < len(f1_per_class) else 0.0
        map_val = float(maps_per_class[cls_idx]) if cls_idx < len(maps_per_class) else 0.0

        metrics["per_class"][cls_name] = {
            "class_id": int(cls_idx),
            "precision": round(p_val, 4),
            "recall": round(r_val, 4),
            "f1": round(f1_val, 4),
            "map50_95": round(map_val, 4),
        }

    return metrics


def _save_evaluation_artifacts(
    save_dir: Path,
    target_run_dir: Path,
    results: Any,
    data_path: Path,
    train_cfg: dict[str, Any],
    duration_seconds: float,
    hardware: dict[str, Any],
) -> tuple[dict[str, Any], Path]:
    """Persist generated plots, metrics JSON, and run provenance metadata."""
    for artifact in ["PR_curve.png", "confusion_matrix.png", "results.csv", "results.png"]:
        src = save_dir / artifact
        dst = target_run_dir / artifact
        if src.exists() and src != dst:
            shutil.copy2(src, dst)

    metrics_data = extract_metrics_json(results)
    metrics_path = target_run_dir / "metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics_data, f, indent=2)

    provenance = {
        "project": "ScamRoad",
        "run_id": train_cfg["run_id"],
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "git_commit": get_git_revision(),
        "dataset_descriptor_path": str(data_path),
        "dataset_hash_sha256": compute_file_hash(data_path),
        "hardware": hardware,
        "duration_seconds": duration_seconds,
        "config": train_cfg,
        "metrics_summary": metrics_data.get("all", {}),
    }
    with open(target_run_dir / "provenance.json", "w", encoding="utf-8") as f:
        json.dump(provenance, f, indent=2)

    return metrics_data, metrics_path


def create_persistent_checkpoint_callback(
    run_id: str,
    target_run_dir: Path,
    persistent_cloud_dir: Path | None = None,
    gcs_bucket: str | None = None,
):
    """Create an on_fit_epoch_end callback that atomically syncs checkpoints to persistent storage every epoch."""

    def on_fit_epoch_end(trainer: Any) -> None:
        epoch = getattr(trainer, "epoch", 0) + 1
        total_epochs = getattr(trainer, "epochs", 0)
        last_pt = getattr(trainer, "last", None)
        best_pt = getattr(trainer, "best", None)
        fit_raw = getattr(trainer, "fitness", 0.0)
        fitness = float(fit_raw.detach().cpu().item()) if hasattr(fit_raw, "detach") else float(fit_raw or 0.0)
        loss_raw = getattr(trainer, "loss", 0.0)
        loss = float(loss_raw.detach().cpu().item()) if hasattr(loss_raw, "detach") else float(loss_raw or 0.0)

        epoch_info = {
            "run_id": run_id,
            "epoch": epoch,
            "total_epochs": total_epochs,
            "fitness": fitness,
            "loss": loss,
            "timestamp_utc": datetime.now(UTC).isoformat(),
            "last_weights": str(last_pt) if last_pt else None,
            "best_weights": str(best_pt) if best_pt else None,
        }

        # 1. Update local latest_epoch.json
        try:
            with open(target_run_dir / "latest_epoch.json", "w", encoding="utf-8") as f:
                json.dump(epoch_info, f, indent=2)
        except Exception as e:
            print(f"[CALLBACK NOTICE] Failed to write latest_epoch.json: {e}")

        # 2. Sync to persistent cloud storage (Google Drive / persistent root)
        if persistent_cloud_dir and last_pt and Path(last_pt).exists():
            try:
                # Latest pointer directory
                latest_p = persistent_cloud_dir / "latest_checkpoint" / run_id
                latest_p.mkdir(parents=True, exist_ok=True)
                weights_dir_p = latest_p / "weights"
                weights_dir_p.mkdir(parents=True, exist_ok=True)

                # Atomic copy last.pt
                tmp_weights = weights_dir_p / "last.pt.tmp"
                shutil.copy2(str(last_pt), str(tmp_weights))
                final_weights = weights_dir_p / "last.pt"
                if final_weights.exists():
                    final_weights.unlink()
                tmp_weights.rename(final_weights)

                # Copy args.yaml
                src_args = target_run_dir / "args.yaml"
                if src_args.exists():
                    shutil.copy2(str(src_args), str(latest_p / "args.yaml"))

                # Write manifest
                with open(latest_p / "checkpoint_manifest.json", "w", encoding="utf-8") as f:
                    json.dump(epoch_info, f, indent=2)

                # Versioned epoch backup every 5 epochs or on best
                if epoch % 5 == 0 or epoch == total_epochs:
                    ver_dir = persistent_cloud_dir / "checkpoints" / run_id / f"epoch_{epoch:04d}"
                    ver_dir.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(str(last_pt), str(ver_dir / "model.pt"))
                    if src_args.exists():
                        shutil.copy2(str(src_args), str(ver_dir / "args.yaml"))
                    with open(ver_dir / "checkpoint_manifest.json", "w", encoding="utf-8") as f:
                        json.dump(epoch_info, f, indent=2)

                # Best pointer
                if best_pt and Path(best_pt).exists() and fitness > 0:
                    best_p = persistent_cloud_dir / "best_checkpoint" / run_id
                    best_p.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(str(best_pt), str(best_p / "model.pt"))
                    if src_args.exists():
                        shutil.copy2(str(src_args), str(best_p / "args.yaml"))
                    with open(best_p / "checkpoint_manifest.json", "w", encoding="utf-8") as f:
                        json.dump(epoch_info, f, indent=2)

                print(f"[PERSISTENT CHECKPOINT] Epoch {epoch}/{total_epochs} atomically saved to persistent storage.")
            except Exception as e:
                print(f"[CALLBACK WARNING] Persistent Drive sync error: {e}")

        # 3. Background sync to Google Cloud Storage (GCS)
        bucket = gcs_bucket or os.environ.get("GCS_BUCKET")
        if bucket and shutil.which("gsutil") and last_pt and Path(last_pt).exists():
            try:
                subprocess.Popen(
                    ["gsutil", "-m", "-q", "cp", str(last_pt), f"{bucket}/checkpoints/{run_id}/last.pt"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            except Exception:
                pass

    return on_fit_epoch_end


def _resolve_valid_resume_checkpoint(
    weights_dir: Path,
    base_runs_dir: Path | None = None,
    run_id: str | None = None,
    model_stem: str | None = None,
) -> tuple[Path | None, Path | None, str | None, int]:
    """Find valid last.pt or best.pt checkpoint for resume, filtering corrupt files.

    Returns:
        (checkpoint_weights_path, run_dir, resolved_run_id, completed_epoch) or (None, None, None, 0)
    """
    candidates: list[tuple[Path, Path, str]] = []

    # 1. Directly in weights_dir
    candidates.append((weights_dir / "last.pt", weights_dir.parent, weights_dir.parent.name))
    candidates.append((weights_dir / "best.pt", weights_dir.parent, weights_dir.parent.name))

    # 2. Check Persistent Google Drive if in Colab
    drive_root = Path("/content/drive/MyDrive/scam_road")
    if drive_root.exists():
        if run_id:
            candidates.append((drive_root / "latest_checkpoint" / run_id / "weights" / "last.pt", drive_root / "latest_checkpoint" / run_id, run_id))
            candidates.append((drive_root / "runs" / run_id / "weights" / "last.pt", drive_root / "runs" / run_id, run_id))
            candidates.append((drive_root / "training_logs" / run_id / "weights" / "last.pt", drive_root / "training_logs" / run_id, run_id))
        for search_folder in ["runs", "training_logs", "latest_checkpoint"]:
            s_path = drive_root / search_folder
            if s_path.exists():
                for sub in sorted(s_path.iterdir(), key=lambda p: p.stat().st_mtime if p.is_dir() else 0, reverse=True):
                    if sub.is_dir() and (model_stem is None or model_stem in sub.name):
                        candidates.append((sub / "weights" / "last.pt", sub, sub.name))
                        candidates.append((sub / "last.pt", sub, sub.name))

    # 3. Check base_runs_dir subfolders
    if base_runs_dir and base_runs_dir.exists():
        if run_id:
            candidates.append((base_runs_dir / run_id / "weights" / "last.pt", base_runs_dir / run_id, run_id))
        for sub in sorted(base_runs_dir.iterdir(), key=lambda p: p.stat().st_mtime if p.is_dir() else 0, reverse=True):
            if sub.is_dir() and (model_stem is None or model_stem in sub.name):
                candidates.append((sub / "weights" / "last.pt", sub, sub.name))

    # 4. Filter and verify checkpoint integrity
    for cand_weights, cand_run_dir, cand_id in candidates:
        if cand_weights.exists() and cand_weights.stat().st_size > 100_000:
            try:
                # Safe CPU loadability check
                ckpt = torch.load(str(cand_weights), map_location="cpu", weights_only=False)
                epoch = int(ckpt.get("epoch", -1))
                # Ensure args.yaml exists in cand_run_dir for seamless Ultralytics resumption
                args_src = cand_run_dir / "args.yaml"
                if not args_src.exists() and cand_weights.parent.parent != cand_run_dir:
                    alt_args = cand_weights.parent.parent / "args.yaml"
                    if alt_args.exists():
                        shutil.copy2(str(alt_args), str(cand_run_dir / "args.yaml"))
                return cand_weights, cand_run_dir, cand_id, epoch + 1
            except Exception as err:
                print(f"[WARNING] Checkpoint {cand_weights} integrity check failed ({err}). Trying next fallback...")

    return None, None, None, 0


def train_detector(
    model_name: str = "yolo11n.pt",
    data_yaml: Path | str = "data/sample/splits/dataset.yaml",
    epochs: int = 50,
    imgsz: int = 640,
    batch: int = 16,
    device: str | None = None,
    resume: bool = False,
    seed: int = 42,
    run_id: str | None = None,
    runs_dir: Path | str | None = None,
    dry_run: bool = False,
    persistent_cloud_dir: Path | str | None = None,
    gcs_bucket: str | None = None,
) -> dict[str, Any]:
    """Train Ultralytics YOLO model with provenance logging, per-epoch Drive persistence, and intelligent auto-resume."""
    paths = get_paths()
    base_runs_dir = Path(runs_dir) if runs_dir else paths["runs_dir"]
    data_path = Path(data_yaml).resolve()

    if not data_path.exists():
        raise FileNotFoundError(f"Dataset descriptor yaml not found: {data_path}")

    model_stem = Path(model_name).stem

    # Detect persistent cloud storage directory
    p_cloud_dir: Path | None = None
    if persistent_cloud_dir:
        p_cloud_dir = Path(persistent_cloud_dir)
    elif Path("/content/drive/MyDrive/scam_road").exists():
        p_cloud_dir = Path("/content/drive/MyDrive/scam_road")
    elif Path("data/cloud_storage_simulation").exists():
        p_cloud_dir = Path("data/cloud_storage_simulation").resolve()

    # Resolve resume checkpoint if resume requested or automatic detection enabled
    resume_target = None
    resolved_run_id = run_id
    completed_epoch = 0

    if resume:
        dummy_weights = (base_runs_dir / run_id / "weights") if run_id else (base_runs_dir / model_stem / "weights")
        cand_w, cand_dir, cand_id, completed_epoch = _resolve_valid_resume_checkpoint(
            weights_dir=dummy_weights,
            base_runs_dir=base_runs_dir,
            run_id=run_id,
            model_stem=model_stem,
        )
        if cand_w is not None:
            resume_target = cand_w
            resolved_run_id = cand_id or run_id
            target_run_dir = cand_dir or (base_runs_dir / resolved_run_id)
            print(f"[AUTORESUME] Located valid checkpoint at {resume_target} (Epoch {completed_epoch} completed).")
        else:
            print("[AUTORESUME] --resume requested but no prior valid checkpoint was found in storage. Starting fresh from epoch 1.")

    # Determine run identifier and target folder
    if resolved_run_id is None:
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        resolved_run_id = f"{model_stem}_{timestamp}"
        target_run_dir = base_runs_dir / resolved_run_id
    elif resume_target is None:
        target_run_dir = base_runs_dir / resolved_run_id

    weights_dir = target_run_dir / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)

    hardware = detect_hardware()
    target_device = device if device is not None else hardware["recommended_device"]

    # Auto-resolve dataset.yaml path attribute to avoid path mismatches across OS/cloud runtimes
    try:
        with open(data_path, "r", encoding="utf-8") as f:
            d_cfg = yaml.safe_load(f) or {}
        expected_path = str(data_path.parent.resolve()).replace("\\", "/")
        if d_cfg.get("path") != expected_path:
            d_cfg["path"] = expected_path
            with open(data_path, "w", encoding="utf-8") as f:
                yaml.safe_dump(d_cfg, f)
    except Exception:
        pass

    # Save training configuration
    train_cfg = {
        "model": model_name,
        "data": str(data_path),
        "epochs": epochs,
        "imgsz": imgsz,
        "batch": batch,
        "device": target_device,
        "seed": seed,
        "run_id": resolved_run_id,
        "save_period": 1,
    }
    with open(target_run_dir / "config.yaml", "w", encoding="utf-8") as f:
        yaml.safe_dump(train_cfg, f, sort_keys=False)

    if dry_run:
        summary = {
            "status": "DRY_RUN_PASSED",
            "run_id": resolved_run_id,
            "run_dir": str(target_run_dir),
            "config": train_cfg,
            "hardware": hardware,
            "resumed": resume_target is not None,
            "completed_epoch": completed_epoch,
        }
        with open(target_run_dir / "provenance.json", "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        return summary

    start_time = time.time()

    # Setup per-epoch persistent checkpoint callback
    cb = create_persistent_checkpoint_callback(
        run_id=resolved_run_id,
        target_run_dir=target_run_dir,
        persistent_cloud_dir=p_cloud_dir,
        gcs_bucket=gcs_bucket,
    )

    if resume_target is not None:
        ckpt_data = torch.load(str(resume_target), map_location="cpu", weights_only=False)
        saved_epoch = int(ckpt_data.get("epoch", -1))

        # Check if already completed all target epochs
        if saved_epoch == -1 or (saved_epoch + 1) >= epochs:
            print(f"[COMPLETED] Model at {resume_target} has already completed requested epochs ({saved_epoch + 1}/{epochs}). Skipping.")
            return {
                "status": "ALREADY_COMPLETED",
                "run_id": resolved_run_id,
                "run_dir": str(target_run_dir),
                "duration_seconds": 0.0,
                "weights": {"best": str(resume_target), "last": str(resume_target)},
            }

        # Interrupted mid-training: update args.yaml target epochs if extending
        print(f"[RESUME] Resuming training from verified checkpoint: {resume_target} (Epoch {saved_epoch + 1} -> {epochs})")
        args_file = target_run_dir / "args.yaml"
        if args_file.exists():
            with open(args_file) as f:
                cfg_a = yaml.safe_load(f) or {}
            cfg_a["epochs"] = epochs
            with open(args_file, "w") as f:
                yaml.safe_dump(cfg_a, f)

        model = YOLO(str(resume_target))
        model.add_callback("on_fit_epoch_end", cb)
        results = model.train(resume=str(resume_target))
    else:
        print(f"[START] Initializing new training for {model_name}...")
        try:
            model = YOLO(model_name)
        except Exception as exc:
            print(f"[NOTICE] Pretrained weight load failed ({exc}). Falling back to architecture build...")
            try:
                yaml_candidate = model_name.replace(".pt", ".yaml")
                print(f"[INFO] Initializing architecture directly from {yaml_candidate}...")
                model = YOLO(yaml_candidate)
            except Exception:
                alt_model = "yolov8n.yaml"
                print(f"[WARNING] Falling back to default architecture {alt_model}...")
                model = YOLO(alt_model)

        model.add_callback("on_fit_epoch_end", cb)
        for ev in list(model.callbacks.keys()):
            model.callbacks[ev] = [c for c in model.callbacks[ev] if callable(c)]

        try:
            results = model.train(
                data=str(data_path),
                epochs=epochs,
                imgsz=imgsz,
                batch=batch,
                device=target_device,
                project=str(base_runs_dir),
                name=resolved_run_id,
                save=True,
                save_period=1,
                exist_ok=True,
                seed=seed,
                deterministic=False,
                optimizer="AdamW",
                plots=True,
                verbose=True,
            )
        except Exception as train_exc:
            import traceback
            traceback.print_exc()
            raise train_exc

    duration_seconds = round(time.time() - start_time, 2)
    save_dir = Path(getattr(results, "save_dir", target_run_dir))

    metrics_data, metrics_path = _save_evaluation_artifacts(
        save_dir=save_dir,
        target_run_dir=target_run_dir,
        results=results,
        data_path=data_path,
        train_cfg=train_cfg,
        duration_seconds=duration_seconds,
        hardware=hardware,
    )

    return {
        "status": "COMPLETED",
        "run_id": run_id,
        "run_dir": str(target_run_dir),
        "duration_seconds": duration_seconds,
        "metrics_file": str(metrics_path),
        "metrics": metrics_data,
        "weights": {
            "best": str(weights_dir / "best.pt") if (weights_dir / "best.pt").exists() else None,
            "last": str(weights_dir / "last.pt") if (weights_dir / "last.pt").exists() else None,
        },
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments for train_detect."""
    parser = argparse.ArgumentParser(description="ScamRoad YOLO road defect detector training.")
    parser.add_argument(
        "--model",
        type=str,
        default="yolo11n.pt",
        help="YOLO model architecture (yolo11n.pt, yolo11s.pt, yolov8n.pt, yolov8s.pt)",
    )
    parser.add_argument(
        "--data",
        type=str,
        default="data/sample/splits/dataset.yaml",
        help="Path to dataset.yaml descriptor",
    )
    parser.add_argument("--epochs", type=int, default=50, help="Total training epochs")
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size")
    parser.add_argument("--batch", type=int, default=16, help="Training batch size")
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Device to use ('0', 'cpu', 'mps')",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume training from existing checkpoint",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--run-id", type=str, default=None, help="Custom identifier for run")
    parser.add_argument("--runs-dir", type=str, default=None, help="Output directory for runs")
    parser.add_argument(
        "--persistent-cloud-dir",
        type=str,
        default=None,
        help="Path to persistent cloud storage root (e.g. Google Drive)",
    )
    parser.add_argument(
        "--gcs-bucket",
        type=str,
        default=None,
        help="Optional GCS bucket path (gs://bucket-name) for cloud sync",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate config without training loop",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """CLI entrypoint."""
    args = parse_args(argv)
    res = train_detector(
        model_name=args.model,
        data_yaml=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        resume=args.resume,
        seed=args.seed,
        run_id=args.run_id,
        runs_dir=args.runs_dir,
        dry_run=args.dry_run,
        persistent_cloud_dir=args.persistent_cloud_dir,
        gcs_bucket=args.gcs_bucket,
    )
    print(f"\n[SUCCESS] Training status: {res['status']} | Run directory: {res['run_dir']}")


if __name__ == "__main__":
    main()
