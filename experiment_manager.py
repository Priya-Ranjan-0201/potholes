"""ScamRoad Experiment State & Distributed Cloud Lock Manager.

Implements Section 4, 5, 9, 11 specifications:
- Distributed lease locking (training.lock) preventing Colab and Kaggle race conditions.
- Automatic stale lock reclamation after lease expiration (default 900s).
- Full platform transition history tracking across Colab, Kaggle, and Local.
- Atomic state updates with persistent experiment_state.json.
"""

from __future__ import annotations

import contextlib
import json
import socket
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any


class ExperimentManager:
    """Manages distributed cloud training locks, state transitions, and platform failover."""

    def __init__(
        self,
        cloud_root: Path | str,
        experiment_id: str,
        lease_duration_seconds: int = 900,
    ) -> None:
        self.cloud_root = Path(cloud_root).resolve()
        self.experiment_id = experiment_id
        self.lease_duration = lease_duration_seconds

        self.exp_dir = self.cloud_root / "experiment_configs" / experiment_id
        self.exp_dir.mkdir(parents=True, exist_ok=True)

        self.state_file = self.exp_dir / "experiment_state.json"
        self.lock_file = self.exp_dir / "training.lock"

        self.worker_id = f"{socket.gethostname()}_{time.time_ns()}"
        self.state = self._load_or_init_state()

    def _load_or_init_state(self) -> dict[str, Any]:
        """Load persistent experiment state or initialize new state."""
        if self.state_file.exists():
            with contextlib.suppress(Exception):
                return json.loads(self.state_file.read_text(encoding="utf-8"))

        initial_state = {
            "experiment_id": self.experiment_id,
            "status": "pending",
            "current_platform": None,
            "last_platform": None,
            "current_epoch": 0,
            "target_epochs": 50,
            "best_fitness": 0.0,
            "created_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
            "platform_transitions": [],
            "metrics_history": [],
        }
        self._write_json_atomic(self.state_file, initial_state)
        return initial_state

    @staticmethod
    def _write_json_atomic(file_path: Path, data: dict[str, Any]) -> None:
        """Atomic write using temporary file and atomic replace."""
        file_path.parent.mkdir(parents=True, exist_ok=True)
        tmp_path = file_path.with_suffix(".tmp")
        tmp_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        tmp_path.replace(file_path)

    def is_locked(self) -> tuple[bool, dict[str, Any] | None]:
        """Check if active unexpired lock exists."""
        if not self.lock_file.exists():
            return False, None

        try:
            lock_data = json.loads(self.lock_file.read_text(encoding="utf-8"))
            expires_at = datetime.fromisoformat(lock_data["expires_at"])
            now = datetime.now(UTC)
        except Exception:
            return False, None
        else:
            if now < expires_at:
                return True, lock_data
            return False, lock_data

    def acquire_lock(self, platform_name: str) -> bool:
        """Attempt to acquire distributed training lease."""
        locked, lock_data = self.is_locked()
        now = datetime.now(UTC)

        if locked and lock_data:
            # Check if current worker already holds lock
            if lock_data.get("worker_id") == self.worker_id:
                self.renew_lock()
                return True
            print(
                f"[LOCK] Experiment {self.experiment_id} is currently locked by "
                f"{lock_data.get('platform')} (worker {lock_data.get('worker_id')}). "
                f"Lease expires at {lock_data.get('expires_at')}."
            )
            return False

        # Acquire or reclaim stale lock
        expires_at = now + timedelta(seconds=self.lease_duration)
        new_lock = {
            "experiment_id": self.experiment_id,
            "platform": platform_name,
            "worker_id": self.worker_id,
            "acquired_at": now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "lease_seconds": self.lease_duration,
        }
        self._write_json_atomic(self.lock_file, new_lock)

        # Update experiment state
        if self.state.get("status") != "completed":
            self.state["status"] = "running"
        prev_plat = self.state.get("current_platform")
        if prev_plat and prev_plat != platform_name:
            self.state["last_platform"] = prev_plat
            self.state["platform_transitions"].append({
                "from": prev_plat,
                "to": platform_name,
                "at_epoch": self.state.get("current_epoch", 0),
                "timestamp_utc": now.isoformat(),
            })

        self.state["current_platform"] = platform_name
        self.state["updated_at"] = now.isoformat()
        self._write_json_atomic(self.state_file, self.state)
        print(f"[LOCK ACQUIRED] {platform_name} acquired lease on {self.experiment_id}.")
        return True

    def renew_lock(self) -> None:
        """Extend lease duration (heartbeat)."""
        if not self.lock_file.exists():
            return
        with contextlib.suppress(Exception):
            lock_data = json.loads(self.lock_file.read_text(encoding="utf-8"))
            if lock_data.get("worker_id") == self.worker_id:
                now = datetime.now(UTC)
                lock_data["expires_at"] = (now + timedelta(seconds=self.lease_duration)).isoformat()
                lock_data["last_heartbeat"] = now.isoformat()
                self._write_json_atomic(self.lock_file, lock_data)

    def release_lock(self) -> None:
        """Release the distributed lease."""
        if self.lock_file.exists():
            with contextlib.suppress(Exception):
                lock_data = json.loads(self.lock_file.read_text(encoding="utf-8"))
                if lock_data.get("worker_id") == self.worker_id:
                    self.lock_file.unlink(missing_ok=True)
                    print(f"[LOCK RELEASED] Worker {self.worker_id} released lock.")

    def record_progress(
        self,
        epoch: int,
        metrics: dict[str, Any],
        is_best: bool = False,
    ) -> None:
        """Record epoch progress and update state."""
        self.renew_lock()
        self.state["current_epoch"] = epoch
        self.state["updated_at"] = datetime.now(UTC).isoformat()
        fitness = metrics.get("map50_95", metrics.get("fitness", 0.0))
        if is_best or fitness > self.state.get("best_fitness", 0.0):
            self.state["best_fitness"] = fitness

        self.state["metrics_history"].append({
            "epoch": epoch,
            "metrics": metrics,
            "platform": self.state.get("current_platform"),
            "timestamp": datetime.now(UTC).isoformat(),
        })
        self._write_json_atomic(self.state_file, self.state)

    def mark_interrupted(self, reason: str = "runtime_preemption") -> None:
        """Mark experiment as interrupted before release or exit."""
        self.state["status"] = "interrupted"
        self.state["interruption_reason"] = reason
        self.state["updated_at"] = datetime.now(UTC).isoformat()
        self._write_json_atomic(self.state_file, self.state)
        self.release_lock()
        print(f"[INTERRUPTED] Experiment {self.experiment_id} marked interrupted: {reason}")

    def mark_completed(self, final_metrics: dict[str, Any] | None = None) -> None:
        """Mark experiment as successfully completed."""
        self.state["status"] = "completed"
        self.state["completed_at"] = datetime.now(UTC).isoformat()
        self.state["updated_at"] = datetime.now(UTC).isoformat()
        if final_metrics:
            self.state["final_metrics"] = final_metrics
        self._write_json_atomic(self.state_file, self.state)
        self.release_lock()
        print(f"[COMPLETED] Experiment {self.experiment_id} successfully finished!")
