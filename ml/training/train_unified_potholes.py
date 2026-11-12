"""Train and export a multi-condition YOLO11n pothole detection model on pothole_unified."""

from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import time
from datetime import UTC, datetime
from pathlib import Path

from ultralytics import YOLO


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser(description="Train YOLO11n on unified multi-condition pothole dataset.")
    parser.add_argument("--data", type=str, default="data/datasets/pothole_unified/dataset.yaml")
    parser.add_argument("--weights", type=str, default="yolo11n.pt")
    parser.add_argument("--epochs", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=512)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--workers", type=int, default=0)
    parser.add_argument("--cache", type=str, default="false")
    parser.add_argument("--lr0", type=float, default=0.002)
    parser.add_argument("--mosaic", type=float, default=1.0)
    parser.add_argument("--mixup", type=float, default=0.15)
    parser.add_argument("--erasing", type=float, default=0.20)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--project", type=str, default="ml/runs")
    parser.add_argument("--name", type=str, default="pothole_yolo11n_unified")
    args = parser.parse_args()

    cache_val: bool | str = False if args.cache.lower() == "false" else True if args.cache.lower() == "true" else args.cache

    run_dir = Path("runs/detect") / args.project / args.name
    if not args.resume:
        for d in [Path(args.project) / args.name, run_dir]:
            if d.exists():
                shutil.rmtree(d)

    t0 = time.perf_counter()
    model = YOLO(args.weights)
    model.train(
        data=args.data,
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device="cpu",
        workers=args.workers,
        cache=cache_val,
        resume=args.resume,
        optimizer="AdamW",
        lr0=args.lr0,
        lrf=0.01,
        cos_lr=True,
        warmup_epochs=1.5,
        close_mosaic=3,
        # Road-condition & multi-scale augmentations (dry, wet glare, shadows, near/far potholes)
        hsv_h=0.015,
        hsv_s=0.75,
        hsv_v=0.45,
        degrees=8.0,
        translate=0.12,
        scale=0.60,
        shear=2.5,
        perspective=0.0005,
        flipud=0.0,
        fliplr=0.5,
        mosaic=args.mosaic,
        mixup=args.mixup,
        copy_paste=0.10,
        erasing=args.erasing,
        patience=10,
        seed=42,
        deterministic=True,
        project=args.project,
        name=args.name,
        exist_ok=True,
        plots=True,
    )
    train_s = round(time.perf_counter() - t0, 1)

    best_pt = run_dir / "weights" / "best.pt"
    if not best_pt.exists():
        # Ultralytics 8.4 may nest under runs/detect/<project>/<name>
        alt = Path("runs/detect") / args.project / args.name / "weights" / "best.pt"
        if alt.exists():
            best_pt = alt

    best_model = YOLO(str(best_pt))
    test_res = best_model.val(
        data=args.data,
        split="test",
        imgsz=640,
        batch=args.batch,
        device="cpu",
        workers=2,
        plots=True,
    )

    export_dir = Path("runs/export")
    export_dir.mkdir(parents=True, exist_ok=True)
    exported_onnx = Path(best_model.export(format="onnx", imgsz=640, simplify=True, opset=17))
    target_fp32 = export_dir / "best.onnx"
    shutil.copy2(exported_onnx, target_fp32)

    # Also export INT8 dynamic quantized edge model while keeping FP32 best.onnx primary
    target_int8 = export_dir / "best_yolo11_int8.onnx"
    try:
        from onnxruntime.quantization import QuantType, quantize_dynamic

        quantize_dynamic(
            model_input=str(target_fp32),
            model_output=str(target_int8),
            weight_type=QuantType.QUInt8,
        )
        shutil.copy2(target_int8, export_dir / "best_int8.onnx")
    except Exception as e:
        print(f"INT8 quantization warning: {e}")

    summary = {
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "dataset": args.data,
        "base_weights": args.weights,
        "epochs": args.epochs,
        "imgsz_train": args.imgsz,
        "imgsz_eval_export": 640,
        "train_duration_sec": train_s,
        "best_pt": str(best_pt),
        "best_onnx_fp32": str(target_fp32),
        "best_onnx_fp32_sha256": sha256_file(target_fp32),
        "test_metrics": {
            "mAP50": round(float(test_res.box.map50), 4),
            "mAP50_95": round(float(test_res.box.map), 4),
            "precision": round(float(test_res.box.mp), 4),
            "recall": round(float(test_res.box.mr), 4),
        },
    }
    summary_path = run_dir / "unified_eval_summary.json"
    summary_path.parent.mkdir(parents=True, exist_ok=True)
    summary_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print("\nTRAINING & TEST COMPLETE:", json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()

