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
from pathlib import Path

logger = logging.getLogger("scamroad.colab")


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
    for candidate in ["priyaranja", "priyaranjan", "kaggle", "kaggle_token"]:
        try:
            val = userdata.get(candidate)
            if val:
                custom_token = val
                break
        except Exception as exc:
            logger.debug("Secret '%s' not present: %s", candidate, exc)

    token = key or single_token or custom_token
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
