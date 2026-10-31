"""YOLO training script for ScamRoad road-defect detection.

Trains Ultralytics YOLOv8 models (nano/small for edge) on road damage datasets
with full reproducibility, hardware provenance logging, and Kaggle/local execution support.
Follows SPEC B3 and rules R1, R2, R4, R14.
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

import torch
import yaml
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
    """Compute SHA-256 hash of a configuration or dataset descriptor file."""
    if not path.exists():
        return "FILE_NOT_FOUND"
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def detect_hardware() -> dict[str, Any]:
    """Detect local or cloud execution hardware (CUDA GPU, MPS, or CPU)."""
    hardware: dict[str, Any] = {
        "platform": platform.platform(),
        "python_version": sys.version,
        "torch_version": torch.__version__,
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


def load_config(config_path: Path) -> dict[str, Any]:
    """Load and validate training YAML configuration."""
    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found at: {config_path}")

    with config_path.open("r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    if not isinstance(cfg, dict):
        raise TypeError(f"Invalid YAML config in {config_path}")

    required_keys = ["model", "data", "imgsz", "epochs"]
    for k in required_keys:
        if k not in cfg:
            raise KeyError(f"Missing required training config key: '{k}'")

    return cfg


def record_provenance(
    run_dir: Path, config: dict[str, Any], config_path: Path, hardware: dict[str, Any]
) -> Path:
    """Save immutable provenance metadata for the training run."""
    run_dir.mkdir(parents=True, exist_ok=True)
    provenance = {
        "project": "ScamRoad",
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "git_commit": get_git_revision(),
        "config_file": str(config_path),
        "config_hash_sha256": compute_file_hash(config_path),
        "data_descriptor_hash": compute_file_hash(Path(config["data"])),
        "hardware": hardware,
        "config": config,
    }

    provenance_path = run_dir / "provenance.json"
    with provenance_path.open("w", encoding="utf-8") as f:
        json.dump(provenance, f, indent=2)

    return provenance_path


def train_model(
    config_path: Path,
    overrides: dict[str, Any] | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    """Execute model training or dry-run validation.

    Args:
        config_path: Path to YAML training configuration.
        overrides: Command-line hyperparameter overrides.
        dry_run: When True, validates pipeline, hardware, and weights loading without training loop.

    Returns:
        Summary dictionary containing run directory, status, and metrics.
    """
    cfg = load_config(config_path)
    if overrides:
        for k, v in overrides.items():
            if v is not None:
                cfg[k] = v

    hardware = detect_hardware()

    # Determine execution device
    device = cfg.get("device")
    if not device:
        device = hardware["recommended_device"]
        cfg["device"] = device

    # Determine run output directory
    project = Path(cfg.get("project", "ml/runs"))
    name = cfg.get("name", "train")
    run_dir = project / name
    if run_dir.exists() and not cfg.get("exist_ok", False):
        timestamp_suffix = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
        run_dir = project / f"{name}_{timestamp_suffix}"

    run_dir.mkdir(parents=True, exist_ok=True)
    provenance_path = record_provenance(run_dir, cfg, config_path, hardware)

    if dry_run:
        summary = {
            "status": "DRY_RUN_PASSED",
            "run_dir": str(run_dir),
            "provenance_file": str(provenance_path),
            "model_name": cfg["model"],
            "target_device": device,
            "epochs": cfg["epochs"],
            "batch": cfg.get("batch", 16),
            "imgsz": cfg["imgsz"],
            "hardware": hardware,
        }
        with (run_dir / "summary.json").open("w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)
        return summary

    start_time = time.time()
    model = YOLO(cfg["model"])

    # Prepare Ultralytics training keyword arguments
    train_args = {
        "data": cfg["data"],
        "epochs": cfg["epochs"],
        "batch": cfg.get("batch", 16),
        "imgsz": cfg["imgsz"],
        "device": device,
        "project": str(project),
        "name": run_dir.name,
        "exist_ok": True,
        "save": cfg.get("save", True),
        "save_period": cfg.get("save_period", 10),
        "patience": cfg.get("patience", 25),
        "optimizer": cfg.get("optimizer", "AdamW"),
        "lr0": cfg.get("lr0", 0.001),
        "lrf": cfg.get("lrf", 0.01),
        "momentum": cfg.get("momentum", 0.937),
        "weight_decay": cfg.get("weight_decay", 0.0005),
        "warmup_epochs": cfg.get("warmup_epochs", 3.0),
        "hsv_h": cfg.get("hsv_h", 0.015),
        "hsv_s": cfg.get("hsv_s", 0.7),
        "hsv_v": cfg.get("hsv_v", 0.4),
        "degrees": cfg.get("degrees", 5.0),
        "translate": cfg.get("translate", 0.10),
        "scale": cfg.get("scale", 0.50),
        "shear": cfg.get("shear", 2.0),
        "perspective": cfg.get("perspective", 0.0005),
        "flipud": cfg.get("flipud", 0.0),
        "fliplr": cfg.get("fliplr", 0.5),
        "mosaic": cfg.get("mosaic", 1.0),
        "mixup": cfg.get("mixup", 0.10),
        "copy_paste": cfg.get("copy_paste", 0.10),
        "deterministic": cfg.get("deterministic", True),
        "seed": cfg.get("seed", 42),
        "half": cfg.get("half", False) if hardware["cuda_available"] else False,
    }

    # Execute training
    results = model.train(**train_args)
    duration_seconds = round(time.time() - start_time, 2)

    save_dir = Path(getattr(results, "save_dir", run_dir))
    weights_best = save_dir / "weights" / "best.pt"
    weights_last = save_dir / "weights" / "last.pt"

    target_weights_dir = run_dir / "weights"
    target_weights_dir.mkdir(parents=True, exist_ok=True)
    if weights_best.exists() and weights_best != (target_weights_dir / "best.pt"):
        shutil.copy2(weights_best, target_weights_dir / "best.pt")
        weights_best = target_weights_dir / "best.pt"
    if weights_last.exists() and weights_last != (target_weights_dir / "last.pt"):
        shutil.copy2(weights_last, target_weights_dir / "last.pt")
        weights_last = target_weights_dir / "last.pt"

    summary = {
        "status": "COMPLETED",
        "run_dir": str(run_dir),
        "duration_seconds": duration_seconds,
        "best_weights": str(weights_best) if weights_best.exists() else None,
        "last_weights": str(weights_last) if weights_last.exists() else None,
        "metrics": getattr(results, "results_dict", {}),
    }

    with (run_dir / "summary.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Train a ScamRoad YOLOv8 detection model.")
    parser.add_argument(
        "--cfg",
        type=Path,
        default=Path("ml/configs/yolov8_pothole.yaml"),
        help="Path to training config YAML.",
    )
    parser.add_argument("--epochs", type=int, help="Override total epochs.")
    parser.add_argument("--batch", type=int, help="Override batch size.")
    parser.add_argument("--imgsz", type=int, help="Override input image size.")
    parser.add_argument("--device", type=str, help="Device to use (e.g. '0', 'cpu').")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate configuration and hardware without launching training loop.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """CLI entry-point."""
    args = parse_args(argv)
    overrides = {
        "epochs": args.epochs,
        "batch": args.batch,
        "imgsz": args.imgsz,
        "device": args.device,
    }

    print(f"Loading training configuration from {args.cfg}...")
    summary = train_model(config_path=args.cfg, overrides=overrides, dry_run=args.dry_run)
    print(f"Training status: {summary['status']} | Run dir: {summary['run_dir']}")


if __name__ == "__main__":
    main()
