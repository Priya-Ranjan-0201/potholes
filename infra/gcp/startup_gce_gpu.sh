#!/usr/bin/env bash
# ScamRoad Google Compute Engine GPU Startup & Auto-Resume Script
# Installs drivers, checks GPU, restores checkpoints from GCS, and resumes training.

set -euo pipefail

echo "=========================================================="
echo " Starting ScamRoad Google Cloud Compute Engine Deployment "
echo "=========================================================="

# 0. Setup graceful exit trap for GCE Spot/Preemption
cleanup_on_interrupt() {
    echo "[PREEMPTION TRAP] Caught termination signal. Syncing checkpoints to GCS immediately..."
    if command -v gsutil &> /dev/null; then
        gsutil -m rsync -r "${CHECKPOINTS_DIR}/" "${GCS_BUCKET}/runs/" || true
    fi
    exit 0
}
trap cleanup_on_interrupt SIGTERM SIGINT

REPO_URL="https://github.com/Priya-Ranjan-0201/potholes.git"
WORK_DIR="/opt/scamroad"
GCS_BUCKET="${GCS_BUCKET:-gs://scamroad-cloud-storage}"
AUTO_SHUTDOWN="${AUTO_SHUTDOWN:-true}"

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

# 5. Resolve Dataset Path
if [ -f "${WORK_DIR}/data/splits/dataset.yaml" ]; then
    DATA_YAML="${WORK_DIR}/data/splits/dataset.yaml"
elif [ -f "${WORK_DIR}/data/sample/splits/dataset.yaml" ]; then
    DATA_YAML="${WORK_DIR}/data/sample/splits/dataset.yaml"
else
    echo "[INFO] Dataset not found locally. Preparing dataset from sample splits..."
    DATA_YAML="${WORK_DIR}/data/sample/splits/dataset.yaml"
fi
echo "[INFO] Using dataset descriptor: ${DATA_YAML}"

# 6. Execute Resumable Training Pipeline with train_detect
echo "[INFO] Starting / Resuming Training Pipeline..."
python -c "
from pathlib import Path
from ml.training.train_detect import train_detector
from scripts.colab.setup_colab import PipelineState

runs_dir = Path('${CHECKPOINTS_DIR}')
state = PipelineState(runs_dir / 'pipeline_state.json')

models = [
    ('yolo11n', 'yolo11n.pt'),
    ('yolo11s', 'yolo11s.pt'),
]

for model_key, base_weight in models:
    action, target = state.get_resume_target(model_key, runs_dir)
    if action == 'skip':
        print(f'[SKIP] {model_key} is already fully trained: {target}')
        continue
    resume_flag = (action == 'resume')
    print(f'[{action.upper()}] Training {model_key} (resume={resume_flag})...')
    train_detector(
        model_name=base_weight,
        data_yaml=Path('${DATA_YAML}'),
        epochs=50,
        imgsz=640,
        batch=16,
        device='0',
        resume=resume_flag,
        run_id=model_key,
        runs_dir=runs_dir,
        gcs_bucket='${GCS_BUCKET}',
    )
    best_weight = runs_dir / model_key / 'weights' / 'best.pt'
    if best_weight.exists():
        state.mark_completed(model_key, {'best_weights': str(best_weight)})
"

# 7. Export Best Models to ONNX
for model_key in yolo11n yolo11s; do
    BEST_WEIGHT="${CHECKPOINTS_DIR}/${model_key}/weights/best.pt"
    if [ -f "${BEST_WEIGHT}" ]; then
        echo "[INFO] Exporting ${model_key} to ONNX opset 17..."
        python -m ml.export.export_onnx --weights "${BEST_WEIGHT}" --format onnx --opset 17 --output-dir "${WORK_DIR}/weights" || true
    fi
done

# 8. Sync Completed Artifacts Back to Google Cloud Storage
if command -v gsutil &> /dev/null; then
    echo "[INFO] Uploading finalized weights and logs back to ${GCS_BUCKET}/runs/..."
    gsutil -m rsync -r "${CHECKPOINTS_DIR}/" "${GCS_BUCKET}/runs/" || true
    gsutil -m rsync -r "${WORK_DIR}/weights/" "${GCS_BUCKET}/weights/" || true
fi

echo "[SUCCESS] ScamRoad Google Cloud Compute Engine pipeline execution finished."

# 9. Auto-shutdown instance if requested to prevent idle billing
if [ "${AUTO_SHUTDOWN}" = "true" ]; then
    echo "[INFO] Auto-shutdown enabled. Terminating VM to save compute costs..."
    sudo shutdown -h now || true
fi

