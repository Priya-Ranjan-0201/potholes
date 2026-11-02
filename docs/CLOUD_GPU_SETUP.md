# ScamRoad — Cloud GPU Computing, Google Colab & Google Drive Integration Guide

This document establishes the architecture, tool connections, and execution workflow for training and evaluating deep learning road damage models using cloud GPUs (Google Colab / Kaggle) with persistent Google Drive storage.

---

## 1. System Architecture & Resource Distribution

| Environment | Role | Hardware Profile | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **Local Workstation** (Windows 11) | Development & Testing | AMD64, 15 GB RAM, CPU-only (No CUDA), ~24 GB free disk | Code authoring, unit/integration testing, SQLite/PostgreSQL verification, git version control. |
| **GitHub** (`Priya-Ranjan-0201/potholes`) | Source Code & Release Hub | Cloud Git Remote | Central repository for all modules (`backend`, `ml`, `edge`, `web`, `mobile`), tags, and release metadata. |
| **Google Colab** | Primary GPU Acceleration | NVIDIA Tesla T4 / V100 / A100 (15-40 GB VRAM) | Model training (YOLOv8, RT-DETR), hyperparameter search, validation, and ONNX INT8 quantization. |
| **Google Drive** (`/MyDrive/ScamRoad`) | Persistent Storage Hub | Cloud Storage | Checkpoints (`best.pt`, `last.pt`), datasets, exported ONNX models, and evaluation logs. |
| **Kaggle** | Dataset Acquisition & Backup GPU | Kaggle T4 x 2 (30h/week quota) | Direct dataset access via Kaggle API, alternative batch kernel execution. |

---

## 2. Verified Tool Connections

### 2.1. GitHub Integration (Verified & Connected)
- **Remote URL**: `https://github.com/Priya-Ranjan-0201/potholes.git`
- **Active Branch**: `main` (tracking `origin/main`)
- **Tags Synchronized**: `phase-1-complete` through `phase-10-complete`
- **Capabilities**: Read, write, push, tag, branch synchronization.
- **Verification Command**:
  ```bash
  git remote -v
  git status
  ```

### 2.2. Google Colab Notebook (Prepared & Configured)
- **User Interactive Colab URL**: [Google Colab Notebook](https://colab.research.google.com/drive/1wns5TQikxxQ2znNYm92RTl5pWhTDwcI8?usp=sharing)
- **Direct GitHub Notebook Loader**:
  `https://colab.research.google.com/github/Priya-Ranjan-0201/potholes/blob/main/notebooks/ScamRoad_Colab_GPU_Pipeline.ipynb`
- **Local Notebook Path**: `notebooks/ScamRoad_Colab_GPU_Pipeline.ipynb`
- **Cloud Bootstrap Script**: `scripts/colab/setup_colab.py`

### 2.3. Google Drive Persistent Mount Structure
When the Colab notebook executes, it automatically mounts Google Drive and prepares the following directory tree under `/content/drive/MyDrive/ScamRoad`:
```text
/content/drive/MyDrive/ScamRoad/
├── datasets/         # Raw and processed datasets (RDD2022, Pothole600, etc.)
├── checkpoints/      # Saved epoch weights (last.pt, epoch_*.pt)
├── weights/          # Validated release models (best.pt)
├── exports/          # Mobile/Edge optimized models (FP32 ONNX, INT8 ONNX, TensorRT)
├── runs/             # Training logs, PR curves, confusion matrices, loss curves
└── logs/             # Text and TensorBoard logs
```

### 2.4. Kaggle CLI Integration
- **CLI Version**: `2.2.5` installed on PATH.
- **Authentication Options**:
  1. **Google Colab Secrets (Recommended)**: In Google Colab, click the **Secrets** (Key icon) on the left sidebar, add `KAGGLE_USERNAME` and `KAGGLE_KEY`.
  2. **Local / Machine Auth**:
     Run `kaggle auth login` in your terminal for browser OAuth sign-in, or copy your API token to `~/.kaggle/access_token`.

---

## 3. How to Launch Cloud GPU Training (Step-by-Step)

### Step 1: Open the Colab Notebook
1. Open the notebook in your browser:
   [ScamRoad Colab Notebook](https://colab.research.google.com/drive/1wns5TQikxxQ2znNYm92RTl5pWhTDwcI8?usp=sharing)
   *(Or open from GitHub: `File` -> `Open Notebook` -> `GitHub` -> enter `Priya-Ranjan-0201/potholes`)*
2. Set Runtime Type: Click `Runtime` -> `Change runtime type` -> select `T4 GPU`.

### Step 2: Run Initial Setup Cells
Execute the first 3 cells in the notebook:
- **Cell 1**: Hardware diagnostics (verifies GPU type and VRAM).
- **Cell 2**: Mount Google Drive (`drive.mount('/content/drive')`).
- **Cell 3**: Git Clone/Pull (`git clone https://github.com/Priya-Ranjan-0201/potholes.git`).

### Step 3: Run Diagnostics Script
In a Colab code cell, run:
```bash
!python /content/potholes/scripts/colab/setup_colab.py
```
This automatically verifies system memory, GPU acceleration, persistent Drive directories, and Kaggle access.

---

## 4. Hardware Safety & Cloud Rule Compliance
1. **No Heavy Local Workloads**: Model training and multi-gigabyte dataset processing must never run on local laptop hardware (CPU-only, limited free disk).
2. **Persistent Checkpointing**: All training scripts must write directly to `/content/drive/MyDrive/ScamRoad/runs/` to prevent loss of progress during Colab session timeouts.
3. **No Hardcoded Secrets**: Tokens and API keys are read via environment variables or Colab Secrets, never hardcoded in notebooks or committed to GitHub.

