#!/usr/bin/env bash
# ScamRoad Google Compute Engine GPU Startup & Auto-Resume Script
# Installs drivers, checks GPU, restores checkpoints from GCS, and resumes training.

set -euo pipefail

echo "=========================================================="
echo " Starting ScamRoad Google Cloud Compute Engine Deployment "
echo "=========================================================="

REPO_URL="https://github.com/Priya-Ranjan-0201/potholes.git"
WORK_DIR="/opt/scamroad"
GCS_BUCKET="${GCS_BUCKET:-gs://scamroad-cloud-storage}"

# 1. Verify NVIDIA Driver & CUDA
if ! command -v nvidia-smi &> /dev/null; then
    echo "[INFO] Installing NVIDIA CUDA drivers..."
    /opt/deeplearning/install-driver.sh || true
fi
nvidia-smi

# 2. Clone or Pull ScamRoad Codebase
if [ ! -d "${WORK_DIR}" ]; then
    echo "[INFO] Cloning repository to ${WORK_DIR}..."
    git clone "${REPO_URL}" "${WORK_DIR}"
else
    echo "[INFO] Updating repository in ${WORK_DIR}..."
    cd "${WORK_DIR}" && git pull origin main
fi
cd "${WORK_DIR}"

# 3. Virtual Environment & Dependencies
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -q ultralytics onnx onnxruntime-gpu pyyaml albumentations opencv-python psutil imagehash

# 4. Sync Prior Checkpoints from Google Cloud Storage (GCS)
CHECKPOINTS_DIR="${WORK_DIR}/runs"
mkdir -p "${CHECKPOINTS_DIR}"
if command -v gsutil &> /dev/null; then
    echo "[INFO] Syncing existing checkpoints from GCS: ${GCS_BUCKET}/runs/..."
    gsutil -m rsync -r "${GCS_BUCKET}/runs/" "${CHECKPOINTS_DIR}/" || true
fi

# 5. Execute Resumable Multi-Model Training
echo "[INFO] Starting / Resuming Multi-Model Training Pipeline..."
python -c "
from pathlib import Path
from ultralytics import YOLO
from scripts.colab.setup_colab import PipelineState

runs_dir = Path('${CHECKPOINTS_DIR}')
state = PipelineState(runs_dir / 'pipeline_state.json')

models = [
    ('model_yolo11n', 'yolo11n.pt'),
    ('model_yolo11s', 'yolo11s.pt'),
    ('model_yolo11n_seg', 'yolo11n-seg.pt'),
]

for model_key, base_weight in models:
    action, target = state.get_resume_target(model_key, runs_dir)
    if action == 'skip':
        print(f'[SKIP] {model_key} is already fully trained: {target}')
        continue
    elif action == 'resume':
        print(f'[RESUME] Interrupted checkpoint found: {target}! Resuming training...')
        m = YOLO(str(target))
        m.train(resume=True)
    else:
        print(f'[START] Fresh training session for {model_key} using {base_weight}...')
        m = YOLO(base_weight)
        m.train(data='data/splits/dataset.yaml', epochs=50, imgsz=640, batch=16, device=0, project=str(runs_dir), name=model_key, save=True)
    state.mark_completed(model_key, {'weights': str(runs_dir / model_key / 'weights' / 'best.pt')})
"

# 6. Sync Completed Artifacts Back to Google Cloud Storage
if command -v gsutil &> /dev/null; then
    echo "[INFO] Uploading finalized weights and logs back to ${GCS_BUCKET}/runs/..."
    gsutil -m rsync -r "${CHECKPOINTS_DIR}/" "${GCS_BUCKET}/runs/" || true
fi

echo "[SUCCESS] ScamRoad Google Cloud Compute Engine pipeline execution finished."
