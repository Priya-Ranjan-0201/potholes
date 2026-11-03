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
import yaml
from configs.paths import get_paths
from ultralytics import YOLO


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


def _resolve_valid_resume_checkpoint(weights_dir: Path) -> Path | None:
    """Find valid last.pt or best.pt checkpoint for resume, filtering corrupt files."""
    for cand in [weights_dir / "last.pt", weights_dir / "best.pt"]:
        if cand.exists() and cand.stat().st_size > 100_000:
            try:
                torch.load(str(cand), map_location="cpu", weights_only=False)
            except Exception as err:
                print(f"[WARNING] Checkpoint {cand.name} corrupted ({err}). Trying fallback...")
            else:
                return cand
    return None


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
) -> dict[str, Any]:
    """Train Ultralytics YOLO model with provenance logging and auto-resume."""
    paths = get_paths()
    base_runs_dir = Path(runs_dir) if runs_dir else paths["runs_dir"]
    data_path = Path(data_yaml).resolve()

    if not data_path.exists():
        raise FileNotFoundError(f"Dataset descriptor yaml not found: {data_path}")

    # Determine run identifier and target folder
    if run_id is None:
        model_stem = Path(model_name).stem
        timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        run_id = f"{model_stem}_{timestamp}"

    target_run_dir = base_runs_dir / run_id
    weights_dir = target_run_dir / "weights"
    weights_dir.mkdir(parents=True, exist_ok=True)

    hardware = detect_hardware()
    target_device = device if device is not None else hardware["recommended_device"]

    # Save training configuration
    train_cfg = {
        "model": model_name,
        "data": str(data_path),
        "epochs": epochs,
        "imgsz": imgsz,
        "batch": batch,
        "device": target_device,
        "seed": seed,
        "run_id": run_id,
        "save_period": 1,
    }
    with open(target_run_dir / "config.yaml", "w", encoding="utf-8") as f:
        yaml.safe_dump(train_cfg, f, sort_keys=False)

    if dry_run:
        summary = {
            "status": "DRY_RUN_PASSED",
            "run_id": run_id,
            "run_dir": str(target_run_dir),
            "config": train_cfg,
            "hardware": hardware,
        }
        with open(target_run_dir / "provenance.json", "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        return summary

    start_time = time.time()
    resume_target = _resolve_valid_resume_checkpoint(weights_dir) if resume else None

    if resume_target is not None:
        print(f"[RESUME] Resuming from verified checkpoint: {resume_target}")
        model = YOLO(str(resume_target))
        results = model.train(resume=True)
    else:
        if resume:
            print("[NOTICE] --resume requested but no valid checkpoint was found. Starting fresh.")
        print(f"[START] Initializing new training for {model_name}...")
        try:
            model = YOLO(model_name)
        except Exception:
            alt_model = "yolov8n.pt" if "s" not in model_name else "yolov8s.pt"
            print(f"[WARNING] Model {model_name} unavailable. Falling back to {alt_model}.")
            model = YOLO(alt_model)

        results = model.train(
            data=str(data_path),
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            device=target_device,
            project=str(base_runs_dir),
            name=run_id,
            save=True,
            save_period=1,
            exist_ok=True,
            seed=seed,
            deterministic=True,
            plots=True,
            verbose=True,
        )

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
    )
    print(f"\n[SUCCESS] Training status: {res['status']} | Run directory: {res['run_dir']}")


if __name__ == "__main__":
    main()
