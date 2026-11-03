"""Google Colab & Cloud GPU Environment Setup and Diagnostics for ScamRoad.

Verifies hardware, mounts persistent Google Drive storage, checks CUDA/GPU,
configures Kaggle API credentials, and validates the training pipeline environment.
"""

from __future__ import annotations

import contextlib
import json
import logging
import os
import platform
import shutil
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

UTC = getattr(datetime, "UTC", UTC)
logger = logging.getLogger("scamroad.colab")


class PipelineState:
    """Persistent execution state manager stored in Google Drive.

    Tracks stage completion and enables transparent session resuming across
    Colab preemptions, network drops, or runtime timeouts.
    """

    def __init__(self, state_file: Path | str) -> None:
        self.path = Path(state_file)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.data: dict[str, Any] = self._load()

    def _load(self) -> dict[str, Any]:
        if self.path.exists():
            with contextlib.suppress(Exception):
                return json.loads(self.path.read_text(encoding="utf-8"))
        return {
            "version": "1.0",
            "stages": {},
            "created_at": datetime.now(UTC).isoformat(),
            "last_resumed_at": datetime.now(UTC).isoformat(),
        }

    def save(self) -> None:
        """Persist state to disk or Google Drive."""
        self.data["last_updated_at"] = datetime.now(UTC).isoformat()
        with contextlib.suppress(Exception):
            self.path.write_text(json.dumps(self.data, indent=2), encoding="utf-8")

    def is_completed(self, stage_name: str) -> bool:
        """Check if a pipeline stage or model training is completed."""
        return self.data.get("stages", {}).get(stage_name, {}).get("status") == "completed"

    def mark_completed(self, stage_name: str, metadata: dict[str, Any] | None = None) -> None:
        """Mark stage as completed with arbitrary execution metadata."""
        if "stages" not in self.data:
            self.data["stages"] = {}
        self.data["stages"][stage_name] = {
            "status": "completed",
            "completed_at": datetime.now(UTC).isoformat(),
            **(metadata or {}),
        }
        self.save()

    def mark_interrupted(
        self,
        stage_name: str,
        last_epoch: int = 0,
        ckpt_path: Path | str | None = None,
        error: str | None = None,
    ) -> None:
        """Record an interrupted training session."""
        if "stages" not in self.data:
            self.data["stages"] = {}
        self.data["stages"][stage_name] = {
            "status": "interrupted",
            "last_epoch": last_epoch,
            "checkpoint": str(ckpt_path) if ckpt_path else None,
            "interrupted_at": datetime.now(UTC).isoformat(),
            "error": error,
        }
        self.save()

    def get_resume_target(
        self,
        model_name: str,
        runs_dir: Path | str,
        target_epochs: int = 50,
        verify_integrity: bool = False,
        return_info: bool = False,
    ) -> tuple[str, Path | None] | tuple[str, Path | None, dict[str, Any]]:
        """Determine whether to skip, resume from checkpoint, or start fresh.

        Returns:
            Tuple of (action, path) or (action, path, info):
            - ('skip', best_pt_path): model is already trained and complete
            - ('resume', last_pt_path): prior interrupted run detected; resume from last.pt
            - ('fresh', None): no prior checkpoint; start new training run
        """
        model_dir = Path(runs_dir) / model_name
        last_pt = model_dir / "weights" / "last.pt"
        best_pt = model_dir / "weights" / "best.pt"
        results_csv = model_dir / "results.csv"

        info: dict[str, Any] = {"epoch": -1, "next_epoch": 0, "valid": False}

        if self.is_completed(model_name) and best_pt.exists():
            res: tuple[str, Path | None] = ("skip", best_pt)
            return (*res, {"status": "completed"}) if return_info else res

        if results_csv.exists() and best_pt.exists():
            with contextlib.suppress(Exception):
                lines = [
                    ln.strip()
                    for ln in results_csv.read_text(encoding="utf-8").splitlines()
                    if ln.strip()
                ]
                if len(lines) >= target_epochs + 1:
                    self.mark_completed(
                        model_name,
                        {"total_epochs": target_epochs, "best_weights": str(best_pt)},
                    )
                    res = ("skip", best_pt)
                    return (*res, {"status": "completed_by_results_csv"}) if return_info else res

        if last_pt.exists():
            if verify_integrity:
                info = verify_checkpoint(last_pt)
                if info["valid"]:
                    if info.get("epoch", -1) + 1 >= target_epochs and best_pt.exists():
                        self.mark_completed(
                            model_name,
                            {"total_epochs": target_epochs, "best_weights": str(best_pt)},
                        )
                        res = ("skip", best_pt)
                        return (*res, info) if return_info else res
                    res = ("resume", last_pt)
                    return (*res, info) if return_info else res
                # Checkpoint corrupted; fallback to best_pt if valid
                if best_pt.exists():
                    best_info = verify_checkpoint(best_pt)
                    if best_info["valid"]:
                        res = ("resume", best_pt)
                        return (*res, best_info) if return_info else res
            else:
                res = ("resume", last_pt)
                return (*res, info) if return_info else res

        res = ("fresh", None)
        return (*res, info) if return_info else res

    def print_summary(self) -> None:
        """Format and print an executive resume summary."""
        print("\n" + "=" * 65)
        print("          SCAMROAD PERSISTENT PIPELINE SESSION STATE          ")
        print("=" * 65)
        print(f" State Hub File  : {self.path}")
        stages = self.data.get("stages", {})
        if not stages:
            print(" Active Stages   : None recorded yet (fresh pipeline initialization).")
        for stg, meta in stages.items():
            status_symbol = "✔ COMPLETED" if meta.get("status") == "completed" else "⏳ PENDING"
            print(f" • {stg:<20}: {status_symbol}")
        print("=" * 65 + "\n")


def verify_checkpoint(ckpt_path: Path | str) -> dict[str, Any]:
    """Verify integrity of a PyTorch / Ultralytics checkpoint.

    Checks:
    1. File existence and non-trivial size (> 100 KB).
    2. PyTorch serialization integrity (can be unpickled without corruption).
    3. Essential checkpoint dictionary keys ('model', 'epoch', 'train_args').

    Returns:
        dict: Checkpoint status and diagnostic metadata:
            - 'valid' (bool): True if checkpoint is uncorrupted and resumable.
            - 'epoch' (int): 0-indexed completed epoch (or -1 if unavailable).
            - 'next_epoch' (int): 1-indexed epoch to resume from.
            - 'best_fitness' (float | None): Recorded validation fitness.
            - 'has_optimizer' (bool): True if optimizer state is present.
            - 'file_size_mb' (float): File size in megabytes.
            - 'error' (str | None): Failure reason if invalid.
    """
    p = Path(ckpt_path)
    if not p.exists() or not p.is_file():
        return {
            "valid": False,
            "error": f"File does not exist: {p}",
            "epoch": -1,
            "next_epoch": 0,
            "file_size_mb": 0.0,
            "has_optimizer": False,
        }

    size_mb = round(p.stat().st_size / (1024**2), 3)
    if p.stat().st_size < 100_000:
        return {
            "valid": False,
            "error": f"File is truncated or suspiciously small ({size_mb} MB < 0.1 MB)",
            "epoch": -1,
            "next_epoch": 0,
            "file_size_mb": size_mb,
            "has_optimizer": False,
        }

    try:
        import torch  # noqa: PLC0415

        ckpt = torch.load(str(p), map_location="cpu", weights_only=False)
        if not isinstance(ckpt, dict):
            return {
                "valid": True,
                "epoch": -1,
                "next_epoch": 0,
                "best_fitness": None,
                "has_optimizer": False,
                "file_size_mb": size_mb,
                "error": None,
            }

        epoch = ckpt.get("epoch", -1)
        best_fitness = ckpt.get("best_fitness")
        has_opt = ckpt.get("optimizer") is not None
        has_model = "model" in ckpt or "ema" in ckpt or "state_dict" in ckpt

        return {
            "valid": has_model or has_opt or (epoch is not None and epoch >= 0),
            "epoch": int(epoch) if epoch is not None else -1,
            "next_epoch": int(epoch) + 1 if epoch is not None and epoch >= 0 else 0,
            "best_fitness": float(best_fitness) if best_fitness is not None else None,
            "has_optimizer": has_opt,
            "has_model": has_model,
            "train_args": ckpt.get("train_args", {}),
            "file_size_mb": size_mb,
            "error": None,
        }
    except Exception as exc:
        return {
            "valid": False,
            "error": f"Corrupted PyTorch checkpoint: {exc}",
            "epoch": -1,
            "next_epoch": 0,
            "file_size_mb": size_mb,
            "has_optimizer": False,
        }


def restore_dataset_from_drive(drive_splits_dir: Path | str, local_splits_dir: Path | str) -> bool:
    """Restore dataset splits from Google Drive persistent storage to local Colab NVMe.

    Enables instant continuation after a Colab runtime termination without re-downloading
    massive raw archives.
    """
    drive_p = Path(drive_splits_dir)
    local_p = Path(local_splits_dir)

    drive_yaml = drive_p / "dataset.yaml"
    local_yaml = local_p / "dataset.yaml"

    if not drive_yaml.exists():
        return False

    if local_yaml.exists():
        print(f"[INFO] Dataset splits already present locally at {local_p}.")
        return True

    print(f"[INFO] Restoring dataset splits from Google Drive cache ({drive_p}) to {local_p}...")
    local_p.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(drive_p, local_p, dirs_exist_ok=True)
    print(f"[SUCCESS] Dataset splits restored to {local_p} (YAML verified).")
    return True


def backup_dataset_to_drive(local_splits_dir: Path | str, drive_splits_dir: Path | str) -> bool:
    """Mirror local dataset splits to Google Drive to protect against runtime disconnections."""
    local_p = Path(local_splits_dir)
    drive_p = Path(drive_splits_dir)

    if not (local_p / "dataset.yaml").exists():
        print(f"[WARNING] Cannot backup dataset: {local_p}/dataset.yaml does not exist.")
        return False

    drive_p.mkdir(parents=True, exist_ok=True)
    print(f"[INFO] Mirroring dataset splits to persistent Google Drive ({drive_p})...")
    shutil.copytree(local_p, drive_p, dirs_exist_ok=True)
    print(f"[SUCCESS] Dataset cached in Google Drive: {drive_p}")
    return True


def safe_train_with_auto_resume(
    model_key: str,
    base_weight: str,
    dataset_cfg: Path | str,
    runs_dir: Path | str,
    epochs: int = 50,
    batch: int = 16,
    imgsz: int = 640,
    device: str | int = 0,
    state: PipelineState | None = None,
    drive_splits_dir: Path | str | None = None,
    local_splits_dir: Path | str | None = None,
    save_period: int = 1,
    **kwargs: Any,
) -> Any:
    """Execute training with guaranteed checkpoint persistence and intelligent auto-resumption.

    Before training:
    1. Validates dataset existence, auto-restoring from Google Drive if local NVMe was reset.
    2. Inspects Google Drive runs folder for existing checkpoint (last.pt / best.pt).
    3. Verifies checkpoint integrity with PyTorch deserialization test.
    4. Automatically resumes using model.train(resume=True) if interrupted.
    5. Safely skips already-completed runs.
    6. Traps CUDA Out-Of-Memory exceptions, clears VRAM cache, and saves failure state.
    """
    from ultralytics import YOLO  # noqa: PLC0415

    cfg_p = Path(dataset_cfg)
    runs_p = Path(runs_dir)

    # 1. Dataset availability check & auto-restore
    if not cfg_p.exists() and drive_splits_dir and local_splits_dir:
        restore_dataset_from_drive(drive_splits_dir, local_splits_dir)

    if not cfg_p.exists():
        raise FileNotFoundError(
            f"Dataset configuration '{cfg_p}' not found! "
            f"Please run the dataset ingestion / cache restore step before training."
        )

    # Initialize or use state manager
    if state is None:
        state_file = runs_p.parent / "pipeline_state.json"
        state = PipelineState(state_file)

    action, ckpt_path, info = state.get_resume_target(
        model_key, runs_p, target_epochs=epochs, verify_integrity=True, return_info=True
    )

    # 2. Skip if completed
    if action == "skip" and ckpt_path and ckpt_path.exists():
        print(f"[SKIP] Model '{model_key}' training is already completed!")
        print(f"       Best persistent weights verified at: {ckpt_path}")
        return YOLO(str(ckpt_path))

    # 3. Resume if valid checkpoint exists
    if action == "resume" and ckpt_path and ckpt_path.exists():
        print("=" * 65)
        print(f" [AUTO-RESUME] Interrupted session detected for {model_key}!")
        print(f" Checkpoint path : {ckpt_path}")
        print(f" Last saved epoch: {info['epoch'] + 1} of {epochs}")
        print(f" Resuming from   : Epoch {info['next_epoch'] + 1}")
        print("=" * 65)
        try:
            model = YOLO(str(ckpt_path))
            results = model.train(resume=True)
            best_weights = runs_p / model_key / "weights" / "best.pt"
            state.mark_completed(
                model_key,
                {
                    "total_epochs": epochs,
                    "best_weights": str(best_weights),
                    "resumed": True,
                },
            )
            print(f"[SUCCESS] {model_key} training completed via auto-resume!")
            return results
        except (KeyboardInterrupt, SystemExit):
            print(f"[INTERRUPT] Training manually paused for {model_key}. Checkpoint safe.")
            state.mark_interrupted(model_key, last_epoch=info["epoch"], ckpt_path=ckpt_path)
            raise
        except Exception as exc:
            err_msg = str(exc)
            print(f"[ERROR] Auto-resume failed: {err_msg}")
            state.mark_interrupted(
                model_key, last_epoch=info["epoch"], ckpt_path=ckpt_path, error=err_msg
            )
            raise

    # 4. Fresh training initialization
    print("=" * 65)
    print(f" [START] Initializing new training session for {model_key}")
    print(f" Architecture     : {base_weight}")
    print(f" Target Epochs    : {epochs}")
    print(f" Image Resolution : {imgsz}x{imgsz}")
    print(f" Batch Size       : {batch}")
    print(f" Persistent Output: {runs_p / model_key}")
    print("=" * 65)

    try:
        model = YOLO(base_weight)
    except Exception:
        alt = "yolov8n.pt" if "seg" not in base_weight else "yolov8n-seg.pt"
        print(f"[WARNING] Base weight '{base_weight}' unavailable. Falling back to '{alt}'.")
        model = YOLO(alt)

    try:
        results = model.train(
            data=str(cfg_p),
            epochs=epochs,
            imgsz=imgsz,
            batch=batch,
            device=device,
            project=str(runs_p),
            name=model_key,
            save=True,
            save_period=save_period,
            exist_ok=True,
            verbose=True,
            **kwargs,
        )
        best_weights = runs_p / model_key / "weights" / "best.pt"
        state.mark_completed(
            model_key,
            {
                "total_epochs": epochs,
                "best_weights": str(best_weights),
                "resumed": False,
            },
        )
        print(f"[SUCCESS] {model_key} fresh training completed successfully.")
        return results
    except (KeyboardInterrupt, SystemExit):
        print(f"[INTERRUPT] Training interrupted for {model_key}. Saving state...")
        last_pt = runs_p / model_key / "weights" / "last.pt"
        last_epoch = 0
        if last_pt.exists():
            v = verify_checkpoint(last_pt)
            last_epoch = v.get("epoch", 0)
        state.mark_interrupted(model_key, last_epoch=last_epoch, ckpt_path=last_pt)
        raise
    except Exception as exc:
        err_str = str(exc)
        if "out of memory" in err_str.lower() or "cuda oom" in err_str.lower():
            import gc  # noqa: PLC0415
            import torch  # noqa: PLC0415

            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            print(f"[FATAL OOM] CUDA Out-of-Memory detected on batch={batch}, imgsz={imgsz}!")
            print(
                f"            Recommendation: rerun with batch={max(2, batch // 2)} or imgsz={max(320, imgsz - 128)}."
            )
        last_pt = runs_p / model_key / "weights" / "last.pt"
        last_epoch = 0
        if last_pt.exists():
            v = verify_checkpoint(last_pt)
            last_epoch = v.get("epoch", 0)
        state.mark_interrupted(model_key, last_epoch=last_epoch, ckpt_path=last_pt, error=err_str)
        raise


def is_colab() -> bool:
    """Check if the current runtime is Google Colab."""
    try:
        import google.colab  # noqa: F401, PLC0415
    except ImportError:
        return Path("/content").exists() and Path("/content/drive").parent.exists()
    else:
        return True


def check_system_resources() -> dict[str, str]:
    """Detect OS, CPU, RAM, disk, and Python environment."""
    info: dict[str, str] = {
        "os": platform.platform(),
        "python": sys.version.split()[0],
    }

    try:
        import psutil  # noqa: PLC0415

        ram = psutil.virtual_memory()
        info["ram_total_gb"] = f"{ram.total / (1024**3):.2f} GB"
        info["ram_available_gb"] = f"{ram.available / (1024**3):.2f} GB"
    except Exception:
        info["ram_total_gb"] = "Unknown"
        info["ram_available_gb"] = "Unknown"

    try:
        root_path = "/content" if is_colab() else (os.environ.get("SYSTEMDRIVE", "C:") + "\\")
        disk = shutil.disk_usage(root_path)
        info["disk_total_gb"] = f"{disk.total / (1024**3):.2f} GB"
        info["disk_free_gb"] = f"{disk.free / (1024**3):.2f} GB"
    except Exception:
        info["disk_total_gb"] = "Unknown"
        info["disk_free_gb"] = "Unknown"

    return info


def check_gpu_environment() -> dict[str, str]:
    """Detect GPU, CUDA, and PyTorch acceleration."""
    gpu_info: dict[str, str] = {
        "cuda_available": "False",
        "device_name": "None (CPU only)",
        "vram_gb": "0.0 GB",
        "torch_version": "Not installed",
    }

    try:
        import torch  # noqa: PLC0415

        gpu_info["torch_version"] = torch.__version__
        cuda_avail = torch.cuda.is_available()
        gpu_info["cuda_available"] = str(cuda_avail)

        if cuda_avail:
            gpu_info["device_name"] = torch.cuda.get_device_name(0)
            mem_b = torch.cuda.get_device_properties(0).total_memory
            gpu_info["vram_gb"] = f"{mem_b / (1024**3):.2f} GB"
            gpu_info["cuda_version"] = getattr(torch.version, "cuda", "Unknown")
    except Exception as e:
        gpu_info["error"] = str(e)

    return gpu_info


def mount_google_drive(mount_point: str = "/content/drive") -> Path | None:
    """Mount Google Drive if running in Google Colab."""
    if not is_colab():
        print("[INFO] Not running in Google Colab. Google Drive mount skipped.")
        return None

    try:
        from google.colab import drive  # noqa: PLC0415

        print(f"[INFO] Mounting Google Drive to {mount_point}...")
        drive.mount(mount_point)

        storage_root = Path(mount_point) / "MyDrive" / "ScamRoad"
        storage_root.mkdir(parents=True, exist_ok=True)

        for folder in ["datasets", "weights", "checkpoints", "exports", "runs", "logs"]:
            (storage_root / folder).mkdir(exist_ok=True)

        print(f"[SUCCESS] Google Drive mounted and initialized: {storage_root}")
    except Exception as e:
        print(f"[ERROR] Failed to mount Google Drive: {e}")
        return None
    else:
        return storage_root


def _clean_token(raw_token: str | None) -> str | None:
    """Sanitize token string, stripping shell commands like 'export VAR=' and surrounding quotes."""
    if not raw_token:
        return None
    token = raw_token.strip()
    is_shell_export = token.startswith("export ") and "=" in token
    is_assignment = "=" in token and not token.startswith("{")
    if is_shell_export or is_assignment:
        token = token.split("=", 1)[1].strip()
    return token.strip("\"'")


def _resolve_colab_secrets(userdata: any) -> tuple[str | None, str | None]:
    """Retrieve Kaggle username and token from Colab Secrets across naming conventions."""
    username = None
    with contextlib.suppress(Exception):
        username = userdata.get("KAGGLE_USERNAME")

    key = None
    with contextlib.suppress(Exception):
        key = userdata.get("KAGGLE_KEY")

    single_token = None
    with contextlib.suppress(Exception):
        single_token = userdata.get("KAGGLE_API_TOKEN")

    custom_token = None
    candidates = [
        "priyaranja",
        "priyaranjanng",
        "priyaranjan",
        "kaggle",
        "kaggle_token",
    ]
    for candidate in candidates:
        try:
            val = userdata.get(candidate)
            if val:
                custom_token = val
                break
        except Exception as exc:
            logger.debug("Secret '%s' not present: %s", candidate, exc)

    token = _clean_token(key or single_token or custom_token)
    user = username or "priyaranja"
    return user, token


def configure_kaggle_credentials() -> bool:
    """Check and configure Kaggle API credentials across multiple secret naming conventions."""
    kaggle_dir = Path.home() / ".kaggle"
    kaggle_json = kaggle_dir / "kaggle.json"
    access_token_file = kaggle_dir / "access_token"

    if kaggle_json.exists():
        print(f"[SUCCESS] Kaggle credentials found at {kaggle_json}")
        with contextlib.suppress(Exception):
            os.chmod(kaggle_json, 0o600)
        return True

    if access_token_file.exists():
        print(f"[SUCCESS] Kaggle access token found at {access_token_file}")
        with contextlib.suppress(Exception):
            os.chmod(access_token_file, 0o600)
        return True

    if is_colab():
        try:
            from google.colab import userdata  # noqa: PLC0415

            uname, token = _resolve_colab_secrets(userdata)
            if token:
                kaggle_dir.mkdir(parents=True, exist_ok=True)
                with open(access_token_file, "w", encoding="utf-8") as f:
                    f.write(token.strip())
                with contextlib.suppress(Exception):
                    os.chmod(access_token_file, 0o600)

                with open(kaggle_json, "w", encoding="utf-8") as f:
                    json.dump({"username": uname, "key": token.strip()}, f)
                with contextlib.suppress(Exception):
                    os.chmod(kaggle_json, 0o600)

                os.environ["KAGGLE_USERNAME"] = uname
                os.environ["KAGGLE_KEY"] = token.strip()
                os.environ["KAGGLE_API_TOKEN"] = token.strip()

                print(
                    f"[SUCCESS] Kaggle credentials configured from Colab Secrets "
                    f"(identifier: '{uname}')."
                )
                return True
        except Exception as exc:
            logger.debug("Colab secrets lookup error: %s", exc)

    if os.environ.get("KAGGLE_API_TOKEN") or (
        os.environ.get("KAGGLE_USERNAME") and os.environ.get("KAGGLE_KEY")
    ):
        print("[SUCCESS] Kaggle credentials detected in environment variables.")
        return True

    print("[WARNING] Kaggle credentials not configured.")
    print("         To enable Kaggle dataset downloads, add KAGGLE_USERNAME and KAGGLE_KEY")
    print("         (or 'priyaranja' / 'KAGGLE_API_TOKEN') in Colab Secrets (Left Key icon).")
    return False


def install_training_dependencies() -> None:
    """Install training dependencies required for Colab GPU execution."""
    pkgs = [
        "ultralytics>=8.1.0",
        "onnx>=1.15.0",
        "pyyaml>=6.0",
        "psutil>=5.9.0",
    ]
    print(f"[INFO] Ensuring cloud dependencies are installed: {pkgs}")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", *pkgs])  # noqa: S603
    print("[SUCCESS] Training dependencies verified.")


def run_diagnostics_report() -> dict[str, any]:
    """Run full diagnostic check and print formatted status banner."""
    in_colab = is_colab()
    sys_res = check_system_resources()
    gpu_res = check_gpu_environment()
    kaggle_ready = configure_kaggle_credentials()

    banner = "=" * 70
    print("\n" + banner)
    print("            SCAMROAD CLOUD ENVIRONMENT & GPU DIAGNOSTICS            ")
    print(banner)
    env_str = "Google Colab (Cloud)" if in_colab else "Local / Workstation"
    print(f" Runtime Environment : {env_str}")
    print(f" Operating System    : {sys_res.get('os')}")
    print(f" Python Version      : {sys_res.get('python')}")
    ram_str = f"Total {sys_res.get('ram_total_gb')} | Free {sys_res.get('ram_available_gb')}"
    print(f" System RAM          : {ram_str}")
    disk_str = f"Total {sys_res.get('disk_total_gb')} | Free {sys_res.get('disk_free_gb')}"
    print(f" Disk Storage        : {disk_str}")
    print("-" * 70)
    print(f" PyTorch Version     : {gpu_res.get('torch_version')}")
    print(f" CUDA GPU Available  : {gpu_res.get('cuda_available')}")
    print(f" Active GPU Device   : {gpu_res.get('device_name')}")
    print(f" Video RAM (VRAM)    : {gpu_res.get('vram_gb')}")
    print("-" * 70)
    kag_status = "Configured & Ready" if kaggle_ready else "Pending Authentication"
    print(f" Kaggle Credentials  : {kag_status}")
    print(banner + "\n")

    return {
        "is_colab": in_colab,
        "system": sys_res,
        "gpu": gpu_res,
        "kaggle_ready": kaggle_ready,
    }


if __name__ == "__main__":
    run_diagnostics_report()
