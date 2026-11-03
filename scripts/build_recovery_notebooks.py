# ruff: noqa: E501, D, S
"""Generate ScamRoad_Colab_Training.ipynb, ScamRoad_Kaggle_Training.ipynb, and ScamRoad_Cloud_Recovery.ipynb.

Complies with Section 12 requirements.
"""

import json
from pathlib import Path


def make_code_cell(source_lines: list[str]) -> dict:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in source_lines],
    }


def make_md_cell(source_lines: list[str]) -> dict:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in source_lines],
    }


def build_colab_training_notebook() -> dict:
    cells = [
        make_md_cell([
            "# ScamRoad: Google Colab Pro Multi-Cloud Training Pipeline",
            "Continuous training engine supporting automatic cross-cloud failover to Kaggle.",
        ]),
        make_md_cell(["### Cell 1: Hardware & GPU Diagnostics"]),
        make_code_cell([
            "!nvidia-smi",
            "import torch",
            "print(f'PyTorch: {torch.__version__} | CUDA Available: {torch.cuda.is_available()}')",
            "if torch.cuda.is_available():",
            "    print(f'GPU: {torch.cuda.get_device_name(0)} | VRAM: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB')",
        ]),
        make_md_cell(["### Cell 2: Mount Persistent Google Drive"]),
        make_code_cell([
            "from google.colab import drive",
            "from pathlib import Path",
            "drive.mount('/content/drive')",
            "drive_root = Path('/content/drive/MyDrive/scam_road')",
            "drive_root.mkdir(parents=True, exist_ok=True)",
            "print(f'[PERSISTENT STORAGE] Drive root verified: {drive_root}')",
        ]),
        make_md_cell(["### Cell 3: Clone or Pull ScamRoad Repository"]),
        make_code_cell([
            "import subprocess",
            "from pathlib import Path",
            "from google.colab import userdata",
            "try:",
            "    token = userdata.get('GITHUB_TOKEN')",
            "    repo_url = f'https://x-access-token:{token}@github.com/Priya-Ranjan-0201/potholes.git'",
            "except Exception:",
            "    repo_url = 'https://github.com/Priya-Ranjan-0201/potholes.git'",
            "repo_dir = Path('/content/scam_road')",
            "if (repo_dir / '.git').exists():",
            "    subprocess.run(['git', 'pull', 'origin', 'main'], cwd=repo_dir, check=True)",
            "else:",
            "    subprocess.run(['git', 'clone', repo_url, str(repo_dir)], check=True)",
            "%cd /content/scam_road",
        ]),
        make_md_cell(["### Cell 4: Install Dependencies"]),
        make_code_cell([
            "!pip install -q --upgrade pip",
            "!pip install -q -r requirements.txt",
        ]),
        make_md_cell(["### Cell 5: Verify Dataset Cache in Persistent Storage"]),
        make_code_cell([
            "from pathlib import Path",
            "import subprocess",
            "drive_yaml = Path('/content/drive/MyDrive/scam_road/datasets/splits/dataset.yaml')",
            "if drive_yaml.exists():",
            "    print(f'[DATASET CACHE] Found verified dataset: {drive_yaml}')",
            "else:",
            "    print('[INFO] Dataset not found on Drive. Using sample splits benchmark...')",
            "    drive_yaml = Path('data/sample/splits/dataset.yaml').resolve()",
            "print(f'[READY] Dataset descriptor: {drive_yaml}')",
        ]),
        make_md_cell(["### Cell 6: Execute Continuous Training via CloudOrchestrator"]),
        make_code_cell([
            "from cloud_orchestrator import CloudOrchestrator",
            "orchestrator = CloudOrchestrator(config_path='cloud_config.yaml')",
            "results = orchestrator.execute_training(",
            "    experiment_id='scamroad_yolo11n_multicloud',",
            "    model_name='yolo11n.pt',",
            "    data_yaml=drive_yaml,",
            "    target_epochs=50,",
            "    batch_size=16,",
            "    imgsz=640,",
            ")",
            "print('[ORCHESTRATOR EXECUTION RESULT]:', results)",
        ]),
        make_md_cell(["### Cell 7: Push Lightweight Metrics to Branch `results/<run_id>`"]),
        make_code_cell([
            "import shutil, subprocess",
            "from pathlib import Path",
            "run_id = 'scamroad_yolo11n_multicloud'",
            "log_dir = Path('/content/drive/MyDrive/scam_road/training_logs') / run_id",
            "report_dir = Path(f'reports/{run_id}')",
            "report_dir.mkdir(parents=True, exist_ok=True)",
            "for f in ['metrics.json', 'config.yaml', 'provenance.json', 'results.csv']:",
            "    src = log_dir / f",
            "    if src.exists():",
            "        shutil.copy2(src, report_dir / f)",
            "branch = f'results/{run_id}'",
            "try:",
            "    subprocess.run(['git', 'config', 'user.name', 'ScamRoad Bot'], check=True)",
            "    subprocess.run(['git', 'config', 'user.email', 'bot@scamroad.local'], check=True)",
            "    subprocess.run(['git', 'checkout', '-B', branch], check=True)",
            "    subprocess.run(['git', 'add', f'reports/{run_id}'], check=True)",
            "    subprocess.run(['git', 'commit', '-m', f'chore(results): metrics for {run_id}'], check=True)",
            "    subprocess.run(['git', 'push', '-u', 'origin', branch, '--force'], check=True)",
            "    print(f'[SUCCESS] Pushed metrics to {branch}')",
            "except Exception as err:",
            "    print(f'[NOTICE] Push skipped: {err}')",
        ]),
        make_md_cell(["### Cell 8: Export Best Checkpoint to ONNX Edge Format"]),
        make_code_cell([
            "import subprocess",
            "from pathlib import Path",
            "best_pt = Path('/content/drive/MyDrive/scam_road/best_checkpoint/scamroad_yolo11n_multicloud/model.pt')",
            "export_dir = Path('/content/drive/MyDrive/scam_road/model_exports')",
            "export_dir.mkdir(parents=True, exist_ok=True)",
            "if best_pt.exists():",
            "    subprocess.run(['python', '-m', 'ml.export.export_onnx', '--weights', str(best_pt), '--format', 'onnx', '--opset', '17', '--output-dir', str(export_dir)], check=True)",
            "    print(f'[SUCCESS] ONNX model saved to {export_dir}')",
        ]),
    ]
    return {"cells": cells, "metadata": {"accelerator": "GPU"}, "nbformat": 4, "nbformat_minor": 2}


def build_kaggle_training_notebook() -> dict:
    cells = [
        make_md_cell([
            "# ScamRoad: Kaggle GPU Multi-Cloud Training Pipeline",
            "Seamless continuation of Colab experiments when Colab quotas or compute limits are reached.",
        ]),
        make_md_cell(["### Cell 1: Hardware & GPU Diagnostics"]),
        make_code_cell([
            "!nvidia-smi",
            "import torch",
            "print(f'PyTorch: {torch.__version__} | CUDA: {torch.cuda.is_available()}')",
            "if torch.cuda.is_available():",
            "    print(f'Device: {torch.cuda.get_device_name(0)}')",
        ]),
        make_md_cell(["### Cell 2: Configure Workspace Directories"]),
        make_code_cell([
            "from pathlib import Path",
            "work_dir = Path('/kaggle/working/scam_road')",
            "work_dir.mkdir(parents=True, exist_ok=True)",
            "print(f'Kaggle working directory initialized at {work_dir}')",
        ]),
        make_md_cell(["### Cell 3: Clone or Pull ScamRoad Repository"]),
        make_code_cell([
            "import subprocess",
            "from pathlib import Path",
            "from kaggle_secrets import UserSecretsClient",
            "try:",
            "    token = UserSecretsClient().get_secret('GITHUB_TOKEN')",
            "    repo_url = f'https://x-access-token:{token}@github.com/Priya-Ranjan-0201/potholes.git'",
            "except Exception:",
            "    repo_url = 'https://github.com/Priya-Ranjan-0201/potholes.git'",
            "repo_dir = Path('/kaggle/working/repo')",
            "if (repo_dir / '.git').exists():",
            "    subprocess.run(['git', 'pull', 'origin', 'main'], cwd=repo_dir, check=True)",
            "else:",
            "    subprocess.run(['git', 'clone', repo_url, str(repo_dir)], check=True)",
            "%cd /kaggle/working/repo",
        ]),
        make_md_cell(["### Cell 4: Install Dependencies"]),
        make_code_cell([
            "!pip install -q --upgrade pip",
            "!pip install -q -r requirements.txt",
        ]),
        make_md_cell(["### Cell 5: Resolve Dataset & Discover Checkpoints"]),
        make_code_cell([
            "from pathlib import Path",
            "dataset_yaml = Path('/kaggle/working/repo/data/sample/splits/dataset.yaml').resolve()",
            "for cand in Path('/kaggle/input').rglob('dataset.yaml'):",
            "    dataset_yaml = cand.resolve()",
            "    break",
            "print(f'[DATASET] Using descriptor: {dataset_yaml}')",
        ]),
        make_md_cell(["### Cell 6: Execute / Continue Training via CloudOrchestrator"]),
        make_code_cell([
            "from cloud_orchestrator import CloudOrchestrator",
            "orchestrator = CloudOrchestrator(config_path='cloud_config.yaml')",
            "results = orchestrator.execute_training(",
            "    experiment_id='scamroad_yolo11n_multicloud',",
            "    model_name='yolo11n.pt',",
            "    data_yaml=dataset_yaml,",
            "    target_epochs=50,",
            "    batch_size=16,",
            "    imgsz=640,",
            ")",
            "print('[KAGGLE TRAINING EXECUTION RESULT]:', results)",
        ]),
        make_md_cell(["### Cell 7: Push Lightweight Metrics to Branch `results/<run_id>`"]),
        make_code_cell([
            "import shutil, subprocess",
            "from pathlib import Path",
            "run_id = 'scamroad_yolo11n_multicloud'",
            "log_dir = Path('/kaggle/working/scam_road/training_logs') / run_id",
            "report_dir = Path(f'/kaggle/working/repo/reports/{run_id}')",
            "report_dir.mkdir(parents=True, exist_ok=True)",
            "for f in ['metrics.json', 'config.yaml', 'provenance.json', 'results.csv']:",
            "    src = log_dir / f",
            "    if src.exists():",
            "        shutil.copy2(src, report_dir / f)",
            "branch = f'results/{run_id}'",
            "try:",
            "    subprocess.run(['git', 'config', 'user.name', 'ScamRoad Kaggle Bot'], check=True)",
            "    subprocess.run(['git', 'config', 'user.email', 'bot@scamroad.local'], check=True)",
            "    subprocess.run(['git', 'checkout', '-B', branch], check=True)",
            "    subprocess.run(['git', 'add', f'reports/{run_id}'], check=True)",
            "    subprocess.run(['git', 'commit', '-m', f'chore(results): metrics for {run_id}'], check=True)",
            "    subprocess.run(['git', 'push', '-u', 'origin', branch, '--force'], check=True)",
            "    print(f'[SUCCESS] Pushed metrics to {branch}')",
            "except Exception as err:",
            "    print(f'[NOTICE] Push skipped: {err}')",
        ]),
        make_md_cell(["### Cell 8: Export Best Checkpoint to ONNX Edge Format"]),
        make_code_cell([
            "import subprocess",
            "from pathlib import Path",
            "best_pt = Path('/kaggle/working/scam_road/best_checkpoint/scamroad_yolo11n_multicloud/model.pt')",
            "export_dir = Path('/kaggle/working/scam_road/model_exports')",
            "export_dir.mkdir(parents=True, exist_ok=True)",
            "if best_pt.exists():",
            "    subprocess.run(['python', '-m', 'ml.export.export_onnx', '--weights', str(best_pt), '--format', 'onnx', '--opset', '17', '--output-dir', str(export_dir)], check=True)",
            "    print(f'[SUCCESS] ONNX model saved to {export_dir}')",
        ]),
    ]
    return {"cells": cells, "metadata": {"accelerator": "GPU"}, "nbformat": 4, "nbformat_minor": 2}


def build_cloud_recovery_notebook() -> dict:
    cells = [
        make_md_cell([
            "# ScamRoad: Universal Cloud Recovery & Diagnostics Notebook",
            "Inspects cloud storage, validates checkpoint integrity, recovers stale locks, and resumes training on whichever cloud platform is currently active.",
        ]),
        make_md_cell(["### Cell 1: Detect Platform & Profile Hardware"]),
        make_code_cell([
            "from environment_manager import EnvironmentManager",
            "env_mgr = EnvironmentManager()",
            "print(f'[ENVIRONMENT] Active Platform : {env_mgr.platform_name.upper()}')",
            "print(f'[HARDWARE] GPU Model       : {env_mgr.hardware.get(\"gpu_name\", \"CPU\")}')",
            "print(f'[HARDWARE] VRAM (GB)        : {env_mgr.hardware.get(\"vram_gb\", 0.0)}')",
            "print(f'[HARDWARE] System RAM (GB)  : {env_mgr.hardware.get(\"ram_total_gb\", 0.0)}')",
        ]),
        make_md_cell(["### Cell 2: Connect Authorized Persistent Cloud Storage"]),
        make_code_cell([
            "from pathlib import Path",
            "if env_mgr.platform_name == 'colab':",
            "    from google.colab import drive",
            "    drive.mount('/content/drive')",
            "    cloud_root = Path('/content/drive/MyDrive/scam_road')",
            "elif env_mgr.platform_name == 'kaggle':",
            "    cloud_root = Path('/kaggle/working/scam_road')",
            "else:",
            "    cloud_root = Path('./data/cloud_storage_simulation').resolve()",
            "cloud_root.mkdir(parents=True, exist_ok=True)",
            "print(f'[STORAGE] Connected to: {cloud_root}')",
        ]),
        make_md_cell(["### Cell 3: Scan Interrupted Experiments & Checkpoints"]),
        make_code_cell([
            "import json",
            "configs_dir = cloud_root / 'experiment_configs'",
            "configs_dir.mkdir(parents=True, exist_ok=True)",
            "print('=' * 65)",
            "print('          SCAMROAD CLOUD EXPERIMENT REGISTRY SCAN             ')",
            "print('=' * 65)",
            "experiments = list(configs_dir.iterdir())",
            "if not experiments:",
            "    print('No previous experiments found. Initializing fresh registry.')",
            "for exp_path in experiments:",
            "    state_file = exp_path / 'experiment_state.json'",
            "    if state_file.exists():",
            "        state = json.loads(state_file.read_text(encoding='utf-8'))",
            "        print(f'• Experiment : {state.get(\"experiment_id\")}')",
            "        print(f'  Status     : {state.get(\"status\")}')",
            "        print(f'  Platform   : {state.get(\"current_platform\")}')",
            "        print(f'  Last Epoch : {state.get(\"current_epoch\")} / {state.get(\"target_epochs\")}')",
            "print('=' * 65)",
        ]),
        make_md_cell(["### Cell 4: Validate Checkpoint Integrity & Recover Stale Locks"]),
        make_code_cell([
            "from checkpoint_manager import CheckpointManager",
            "from experiment_manager import ExperimentManager",
            "exp_id = 'scamroad_yolo11n_multicloud'",
            "ckpt_mgr = CheckpointManager(cloud_root, exp_id)",
            "exp_mgr = ExperimentManager(cloud_root, exp_id)",
            "",
            "# Check lock status",
            "locked, lock_data = exp_mgr.is_locked()",
            "if locked:",
            "    print(f'[LOCK STATUS] Active lock held by {lock_data.get(\"platform\")}. Checking lease...')",
            "else:",
            "    print('[LOCK STATUS] Lock is free or stale lease recovered.')",
            "",
            "# Verify latest checkpoint",
            "latest_dir, manifest = ckpt_mgr.load_latest_checkpoint()",
            "if latest_dir and manifest:",
            "    v = ckpt_mgr.verify_checkpoint(latest_dir)",
            "    print(f'[CHECKPOINT VERIFICATION] Status: {v[\"valid\"]} | Epoch: {v[\"epoch\"]} | Step: {v[\"global_step\"]}')",
            "else:",
            "    print('[CHECKPOINT VERIFICATION] No valid prior checkpoint found. Fresh initialization required.')",
        ]),
        make_md_cell(["### Cell 5: Resume Training from Interrupted State"]),
        make_code_cell([
            "from cloud_orchestrator import CloudOrchestrator",
            "orchestrator = CloudOrchestrator(config_path='cloud_config.yaml')",
            "session = orchestrator.prepare_session(experiment_id=exp_id)",
            "print(f'[RECOVERY PLAN] Action: {session[\"action\"]} | Resume Epoch: {session.get(\"start_epoch\", 0)}')",
            "",
            "recovery_results = orchestrator.execute_training(",
            "    experiment_id=exp_id,",
            "    model_name='yolo11n.pt',",
            "    target_epochs=50,",
            "    batch_size=16,",
            ")",
            "print('[RECOVERY EXECUTION RESULT]:', recovery_results)",
        ]),
    ]
    return {"cells": cells, "metadata": {"accelerator": "GPU"}, "nbformat": 4, "nbformat_minor": 2}


def main() -> None:
    nb_dir = Path("notebooks")
    nb_dir.mkdir(parents=True, exist_ok=True)

    colab_nb = build_colab_training_notebook()
    with open(nb_dir / "ScamRoad_Colab_Training.ipynb", "w", encoding="utf-8") as f:
        json.dump(colab_nb, f, indent=2)
    print(f"[SUCCESS] Wrote {nb_dir / 'ScamRoad_Colab_Training.ipynb'}")

    kaggle_nb = build_kaggle_training_notebook()
    with open(nb_dir / "ScamRoad_Kaggle_Training.ipynb", "w", encoding="utf-8") as f:
        json.dump(kaggle_nb, f, indent=2)
    print(f"[SUCCESS] Wrote {nb_dir / 'ScamRoad_Kaggle_Training.ipynb'}")

    rec_nb = build_cloud_recovery_notebook()
    with open(nb_dir / "ScamRoad_Cloud_Recovery.ipynb", "w", encoding="utf-8") as f:
        json.dump(rec_nb, f, indent=2)
    print(f"[SUCCESS] Wrote {nb_dir / 'ScamRoad_Cloud_Recovery.ipynb'}")


if __name__ == "__main__":
    main()
