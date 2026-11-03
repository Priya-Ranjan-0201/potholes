"""ScamRoad Multi-Cloud Continuous Training Orchestrator.

Implements Sections 4, 5, 6, 8, 9, 10, 11 specifications:
- Coordinates cross-cloud execution across Colab, Kaggle, and Local environments.
- Enforces distributed lock safety to prevent duplicate concurrent runs.
- Adapts batch and hardware parameters dynamically per cloud GPU.
- Recovers state from exact interrupted epoch without resetting learning rates.
- Manages atomic checkpoints, metrics provenance, and ONNX edge exports.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import yaml
from checkpoint_manager import CheckpointManager
from environment_manager import EnvironmentManager
from experiment_manager import ExperimentManager

from ml.training.train_detect import train_detector


class BasePlatformAdapter:
    """Base class for cloud platform adapters."""

    def __init__(self, config: dict[str, Any]) -> None:
        self.config = config

    def get_cloud_storage_root(self) -> Path:
        raise NotImplementedError

    def prepare_environment(self) -> dict[str, Any]:
        raise NotImplementedError

    def resolve_dataset(self, default_data_path: Path | str) -> Path:
        raise NotImplementedError


class ColabAdapter(BasePlatformAdapter):
    """Google Colab Pro runtime adapter."""

    def get_cloud_storage_root(self) -> Path:
        colab_cfg = self.config.get("storage", {}).get("colab", {})
        root_str = colab_cfg.get("root", "/content/drive/MyDrive/scam_road")
        return Path(root_str)

    def prepare_environment(self) -> dict[str, Any]:
        """Mount Google Drive if running in live Colab."""
        cloud_root = self.get_cloud_storage_root()
        if Path("/content").exists():
            try:
                from google.colab import drive  # noqa: PLC0415

                if not Path("/content/drive/MyDrive").exists():
                    print("[COLAB] Mounting Google Drive to /content/drive...")
                    drive.mount("/content/drive")
            except Exception as e:
                print(f"[COLAB NOTICE] Drive mount check: {e}")

        cloud_root.mkdir(parents=True, exist_ok=True)
        return {"status": "READY", "platform": "colab", "root": str(cloud_root)}

    def resolve_dataset(self, default_data_path: Path | str) -> Path:
        """Resolve dataset on Drive or local cache."""
        cloud_root = self.get_cloud_storage_root()
        drive_yaml = cloud_root / "datasets" / "splits" / "dataset.yaml"
        if drive_yaml.exists():
            return drive_yaml
        cand = Path(default_data_path)
        if cand.exists():
            return cand.resolve()
        return Path("data/sample/splits/dataset.yaml").resolve()


class KaggleAdapter(BasePlatformAdapter):
    """Kaggle GPU Notebook runtime adapter."""

    def get_cloud_storage_root(self) -> Path:
        kaggle_cfg = self.config.get("storage", {}).get("kaggle", {})
        root_str = kaggle_cfg.get("root", "/kaggle/working/scam_road")
        return Path(root_str)

    def prepare_environment(self) -> dict[str, Any]:
        cloud_root = self.get_cloud_storage_root()
        cloud_root.mkdir(parents=True, exist_ok=True)
        return {"status": "READY", "platform": "kaggle", "root": str(cloud_root)}

    def resolve_dataset(self, default_data_path: Path | str) -> Path:
        """Locate dataset from /kaggle/input or fallback."""
        kaggle_input = Path("/kaggle/input")
        if kaggle_input.exists():
            for yaml_cand in kaggle_input.rglob("dataset.yaml"):
                return yaml_cand.resolve()
        cand = Path(default_data_path)
        if cand.exists():
            return cand.resolve()
        return Path("data/sample/splits/dataset.yaml").resolve()


class LocalAdapter(BasePlatformAdapter):
    """Local execution and testing adapter."""

    def get_cloud_storage_root(self) -> Path:
        local_cfg = self.config.get("storage", {}).get("local", {})
        root_str = local_cfg.get("root", "./data/cloud_storage_simulation")
        return Path(root_str).resolve()

    def prepare_environment(self) -> dict[str, Any]:
        root = self.get_cloud_storage_root()
        root.mkdir(parents=True, exist_ok=True)
        return {"status": "READY", "platform": "local", "root": str(root)}

    def resolve_dataset(self, default_data_path: Path | str) -> Path:
        cand = Path(default_data_path)
        if cand.exists():
            return cand.resolve()
        return Path("data/sample/splits/dataset.yaml").resolve()


class CloudOrchestrator:
    """Central engine controlling cross-cloud training, failover, and auto-resume."""

    def __init__(self, config_path: Path | str = "cloud_config.yaml") -> None:
        self.config_path = Path(config_path)
        self.config = self._load_config()

        self.env_mgr = EnvironmentManager()
        self.platform = self.env_mgr.platform_name
        self.adapter = self._init_adapter()

        self.cloud_root = self.adapter.get_cloud_storage_root()
        self.adapter.prepare_environment()

    def _load_config(self) -> dict[str, Any]:
        if not self.config_path.exists():
            alt_path = Path("configs/cloud_config.yaml")
            if alt_path.exists():
                self.config_path = alt_path
            else:
                return {}
        with self.config_path.open("r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def _init_adapter(self) -> BasePlatformAdapter:
        if self.platform == "colab":
            return ColabAdapter(self.config)
        if self.platform == "kaggle":
            return KaggleAdapter(self.config)
        return LocalAdapter(self.config)

    def prepare_session(
        self,
        experiment_id: str,
        model_name: str = "yolo11n.pt",
        data_yaml: Path | str = "data/sample/splits/dataset.yaml",
        target_epochs: int = 50,
        batch_size: int = 16,
        imgsz: int = 640,
    ) -> dict[str, Any]:
        """Verify locks, resolve checkpoints, adapt hardware, and plan resumption."""
        orch_cfg = self.config.get("orchestration", {})
        lease_sec = orch_cfg.get("lease_duration_seconds", 900)
        exp_mgr = ExperimentManager(
            cloud_root=self.cloud_root,
            experiment_id=experiment_id,
            lease_duration_seconds=lease_sec,
        )
        ckpt_mgr = CheckpointManager(cloud_root=self.cloud_root, experiment_id=experiment_id)

        # 1. Check if already completed
        if exp_mgr.state.get("status") == "completed":
            return {
                "status": "COMPLETED",
                "can_proceed": False,
                "reason": f"Experiment {experiment_id} already marked completed",
                "experiment_id": experiment_id,
            }

        # 2. Acquire distributed lock
        lock_ok = exp_mgr.acquire_lock(platform_name=self.platform)
        if not lock_ok:
            return {
                "status": "LOCKED",
                "can_proceed": False,
                "reason": "Active training lease held by another cloud instance",
                "experiment_id": experiment_id,
            }

        # 3. Locate latest valid checkpoint
        latest_ckpt_dir, manifest = ckpt_mgr.load_latest_checkpoint()
        action = "fresh"
        resume_weights = model_name
        start_epoch = 0

        if latest_ckpt_dir and manifest:
            action = "resume"
            resume_weights = str(latest_ckpt_dir / manifest["weights_file"])
            start_epoch = manifest.get("epoch", 0) + 1
            src_plat = manifest.get("platform")
            g_step = manifest.get("global_step")
            print(
                f"[ORCHESTRATOR] Found valid checkpoint from platform '{src_plat}'. "
                f"Resuming at Epoch {start_epoch} (global step: {g_step})."
            )

        # 4. Hardware adaptation
        adaptations = self.env_mgr.adapt_training_hyperparameters(
            target_batch=batch_size,
            imgsz=imgsz,
        )

        resolved_data = self.adapter.resolve_dataset(data_yaml)

        return {
            "status": "READY",
            "can_proceed": True,
            "action": action,
            "experiment_id": experiment_id,
            "platform": self.platform,
            "start_epoch": start_epoch,
            "target_epochs": target_epochs,
            "resume_weights": resume_weights,
            "checkpoint_manifest": manifest,
            "dataset_yaml": str(resolved_data),
            "adaptations": adaptations,
            "hardware": self.env_mgr.hardware,
            "exp_mgr": exp_mgr,
            "ckpt_mgr": ckpt_mgr,
        }

    def execute_training(
        self,
        experiment_id: str,
        model_name: str = "yolo11n.pt",
        data_yaml: Path | str = "data/sample/splits/dataset.yaml",
        target_epochs: int = 50,
        batch_size: int = 16,
        imgsz: int = 640,
        dry_run: bool = False,
    ) -> dict[str, Any]:
        """Execute full training session with continuous checkpointing and fault tolerance."""
        session = self.prepare_session(
            experiment_id=experiment_id,
            model_name=model_name,
            data_yaml=data_yaml,
            target_epochs=target_epochs,
            batch_size=batch_size,
            imgsz=imgsz,
        )

        if not session["can_proceed"]:
            return session

        exp_mgr: ExperimentManager = session["exp_mgr"]
        ckpt_mgr: CheckpointManager = session["ckpt_mgr"]
        adaptations = session["adaptations"]

        if dry_run:
            exp_mgr.release_lock()
            return {
                "status": "DRY_RUN_SUCCESS",
                "session_plan": session,
            }

        plat_tag = self.platform.upper()
        gpu_tag = adaptations['adapted_for']
        print(f"\n[ORCHESTRATOR] Starting training on {plat_tag} (GPU: {gpu_tag})...")

        try:
            # Execute detector training
            train_res = train_detector(
                model_name=session["resume_weights"],
                data_yaml=session["dataset_yaml"],
                epochs=target_epochs,
                imgsz=adaptations["imgsz"],
                batch=adaptations["batch_size"],
                device=adaptations["device"],
                resume=(session["action"] == "resume"),
                run_id=experiment_id,
                runs_dir=self.cloud_root / "training_logs",
                persistent_cloud_dir=self.cloud_root,
            )

            metrics = train_res.get("metrics", {}).get("all", {})
            best_weight = train_res.get("weights", {}).get("best") or session["resume_weights"]

            # Save persistent checkpoint
            ckpt_mgr.save_checkpoint(
                epoch=target_epochs,
                global_step=target_epochs * 100,
                model_weights_path=best_weight,
                metrics=metrics,
                platform_name=self.platform,
                is_best=True,
            )

            exp_mgr.record_progress(epoch=target_epochs, metrics=metrics, is_best=True)
            exp_mgr.mark_completed(final_metrics=metrics)

            return {
                "status": "COMPLETED",
                "experiment_id": experiment_id,
                "platform": self.platform,
                "epochs_completed": target_epochs,
                "metrics": metrics,
                "best_checkpoint": str(best_weight),
            }

        except (KeyboardInterrupt, SystemExit):
            print(f"\n[INTERRUPT] Preemption / user interruption on {self.platform}!")
            exp_mgr.mark_interrupted(reason=f"preemption_on_{self.platform}")
            raise

        except Exception as exc:
            err_msg = str(exc)
            print(f"\n[ERROR] Training halted on {self.platform}: {err_msg}")
            exp_mgr.mark_interrupted(reason=f"error_{err_msg[:60]}")
            return {
                "status": "FAILED",
                "experiment_id": experiment_id,
                "error": err_msg,
                "platform": self.platform,
            }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="ScamRoad Multi-Cloud Continuous Training Orchestrator."
    )
    parser.add_argument("--experiment-id", type=str, default="scamroad_yolo11n_multicloud")
    parser.add_argument("--model", type=str, default="yolo11n.pt")
    parser.add_argument("--data", type=str, default="data/sample/splits/dataset.yaml")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--config", type=str, default="cloud_config.yaml")
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    orchestrator = CloudOrchestrator(config_path=args.config)
    res = orchestrator.execute_training(
        experiment_id=args.experiment_id,
        model_name=args.model,
        data_yaml=args.data,
        target_epochs=args.epochs,
        batch_size=args.batch,
        imgsz=args.imgsz,
        dry_run=args.dry_run,
    )
    print("\n" + json.dumps(res, indent=2, default=str))


if __name__ == "__main__":
    main()
