"""Package and publish ScamRoad models and benchmarks to Kaggle Datasets."""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DIST_DIR = REPO_ROOT / "dist_kaggle" / "scamroad-indian-pothole-model"


def prepare_package():
    print(f"[PACKAGE] Preparing Kaggle package at {DIST_DIR}...")
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Models to include
    weights = [
        REPO_ROOT / "runs" / "export" / "best.onnx",
        REPO_ROOT / "runs" / "export" / "best_yolo11_int8.onnx",
        REPO_ROOT / "ml" / "weights" / "yolov8n_seg_pothole.onnx",
        REPO_ROOT / "ml" / "weights" / "pyresearch_pothole_best.onnx",
        REPO_ROOT / "ml" / "weights" / "coco_scene_blocker.onnx",
    ]

    for w in weights:
        if w.exists():
            dst = DIST_DIR / w.name
            if not dst.exists() or dst.stat().st_size != w.stat().st_size:
                print(f"  Copying {w.name} ({w.stat().st_size / (1024*1024):.1f} MB)...")
                shutil.copy2(w, dst)

    # 2. Benchmark data
    benchmark_src = REPO_ROOT / "data" / "verification_benchmark"
    if benchmark_src.exists():
        dst_bench = DIST_DIR / "verification_benchmark"
        if not dst_bench.exists():
            shutil.copytree(benchmark_src, dst_bench)

    # 3. Create dataset-metadata.json
    metadata = {
        "title": "ScamRoad: Indian Road Distress & Pothole Detection Models",
        "id": "priyaranjan0201/scamroad-indian-pothole-models",
        "licenses": [{"name": "mit"}],
        "description": "Production ONNX models for real-time pothole and road distress detection calibrated on Indian urban and highway corridors. Includes YOLO11n INT8, YOLOv8-Seg polygon segmenter, PyResearch YOLOv12, COCO obstacle mask engine, and benchmark evaluation sets.",
        "keywords": ["computer-vision", "potholes", "yolo", "road-safety", "smart-cities"],
    }

    meta_path = DIST_DIR / "dataset-metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # 4. Create README.md
    readme_content = """# ScamRoad: Indian Road Distress & Pothole Detection Models

Trained and calibrated ONNX models for real-time edge and municipal road surface condition analysis.

## Models Included

- **best.onnx (YOLO11n FP32)**: Autoritative multi-condition road pothole detector trained across dry craters, rain puddles, and monsoon washouts.
- **best_yolo11_int8.onnx (YOLO11n INT8 Quantized)**: Sub-3MB edge-optimized model for in-vehicle dashcams and mobile patrol devices (18.6ms latency).
- **yolov8n_seg_pothole.onnx**: Semantic polygon segmentation engine for precise pothole depth and volume estimation.
- **pyresearch_pothole_best.onnx**: YOLOv12 distress localization network.
- **coco_scene_blocker.onnx**: Semantic vehicle and pedestrian shield preventing false alarms on non-road obstacles.

## GitHub Repository
Source code, FastAPI inference server, and React GIS dashboard available at:
https://github.com/Priya-Ranjan-0201/potholes
"""
    with open(DIST_DIR / "README.md", "w", encoding="utf-8") as f:
        f.write(readme_content)

    print(f"[PACKAGE] Successfully prepared {len(list(DIST_DIR.glob('*')))} files in {DIST_DIR}")


def upload_dataset():
    # Check if kaggle CLI is authenticated
    res = subprocess.run(["kaggle", "datasets", "list"], capture_output=True, text=True)
    if res.returncode != 0:
        print("\n[AUTH NOTICE] Kaggle authentication required to publish automatically.")
        print("Run the following command once in your terminal to authenticate with your browser:")
        print("    kaggle auth login")
        print("\nOr place your kaggle.json in C:\\Users\\PRIYE RANJAN\\.kaggle\\kaggle.json")
        return False

    print("\n[UPLOAD] Creating / updating dataset on Kaggle...")
    create_res = subprocess.run(["kaggle", "datasets", "create", "-p", str(DIST_DIR), "-u"], capture_output=True, text=True)
    print(create_res.stdout)
    if create_res.returncode != 0:
        # Try version if already exists
        version_res = subprocess.run(["kaggle", "datasets", "version", "-p", str(DIST_DIR), "-m", "Update models and benchmarks"], capture_output=True, text=True)
        print(version_res.stdout)
        print(version_res.stderr)
    return True


if __name__ == "__main__":
    prepare_package()
    upload_dataset()
