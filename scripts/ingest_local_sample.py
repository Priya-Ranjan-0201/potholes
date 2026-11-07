"""Local Test Set Ingestion & Pre-Labeling Pipeline for ScamRoad.
Ingests local raw videos or image directories, extracts frames with temporal/spatial spacing,
applies Rule R6 on-device privacy blurring (faces & license plates),
and runs YOLO11n-INT8 in pre-label mode to emit draft YOLO format annotations.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
import cv2
import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from edge.agent.blur_privacy import PrivacyRedactor
from edge.agent.infer import EdgeInferenceEngine

def ingest_directory(
    input_dir: Path,
    output_dir: Path,
    conf_thresh: float = 0.25,
    sample_interval_frames: int = 30, # ~1 fps at 30 fps
) -> dict[str, any]:
    """Ingests image/video frames, blurs privacy targets, and generates draft YOLO annotations."""
    images_out = output_dir / "images"
    labels_out = output_dir / "labels"
    images_out.mkdir(parents=True, exist_ok=True)
    labels_out.mkdir(parents=True, exist_ok=True)

    redactor = PrivacyRedactor(blur_kernel_size=35, blur_faces=True, blur_plates=True)
    model_path = REPO_ROOT / "runs" / "export" / "best_int8.onnx"
    engine = EdgeInferenceEngine(str(model_path), conf_threshold=conf_thresh) if model_path.exists() else None

    input_files = list(input_dir.glob("*.jpg")) + list(input_dir.glob("*.png")) + list(input_dir.glob("*.mp4"))
    processed_count = 0
    total_detections = 0
    redactions_total = 0

    print(f"Ingesting local frames from: {input_dir}")
    print(f"Output directory: {output_dir}")

    for idx, fpath in enumerate(input_files):
        if fpath.suffix.lower() in [".mp4", ".mov", ".avi"]:
            # Process video
            cap = cv2.VideoCapture(str(fpath))
            f_idx = 0
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                if f_idx % sample_interval_frames == 0:
                    out_base = f"{fpath.stem}_frame_{f_idx:05d}"
                    red_res = redactor.redact_image(frame)
                    redactions_total += red_res.total_redactions
                    
                    # Save blurred frame
                    img_dest = images_out / f"{out_base}.jpg"
                    cv2.imwrite(str(img_dest), red_res.redacted_image)
                    
                    # Pre-label draft
                    lbl_dest = labels_out / f"{out_base}.txt"
                    draft_lines = []
                    if engine:
                        preds = engine.predict(red_res.redacted_image)
                        h, w = frame.shape[:2]
                        for p in preds:
                            # YOLO format: cls, xc, yc, w, h
                            # p.bbox is [x1, y1, x2, y2]
                            x1, y1, x2, y2 = p.bbox_xyxy_xyxy
                            xc = ((x1 + x2) / 2.0) / w
                            yc = ((y1 + y2) / 2.0) / h
                            bw = (x2 - x1) / w
                            bh = (y2 - y1) / h
                            draft_lines.append(f"{p.class_id} {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}")
                            total_detections += 1
                            
                    lbl_dest.write_text("\n".join(draft_lines), encoding="utf-8")
                    processed_count += 1
                f_idx += 1
            cap.release()
        else:
            # Single Image
            img = cv2.imread(str(fpath))
            if img is None:
                continue
            out_base = f"local_{fpath.stem}"
            red_res = redactor.redact_image(img)
            redactions_total += red_res.total_redactions

            img_dest = images_out / f"{out_base}.jpg"
            cv2.imwrite(str(img_dest), red_res.redacted_image)

            lbl_dest = labels_out / f"{out_base}.txt"
            draft_lines = []
            if engine:
                preds = engine.predict(red_res.redacted_image)
                h, w = img.shape[:2]
                for p in preds:
                    x1, y1, x2, y2 = p.bbox_xyxy
                    xc = ((x1 + x2) / 2.0) / w
                    yc = ((y1 + y2) / 2.0) / h
                    bw = (x2 - x1) / w
                    bh = (y2 - y1) / h
                    draft_lines.append(f"{p.class_id} {xc:.6f} {yc:.6f} {bw:.6f} {bh:.6f}")
                    total_detections += 1

            lbl_dest.write_text("\n".join(draft_lines), encoding="utf-8")
            processed_count += 1

    summary = {
        "processed_frames": processed_count,
        "total_draft_detections": total_detections,
        "privacy_redactions_applied": redactions_total,
        "images_directory": str(images_out),
        "labels_directory": str(labels_out),
        "verification_checklist": [
            "[ ] Verify all human faces and license plates are blurred (Rule R6)",
            "[ ] Validate bounding boxes in labeling tool (e.g. CVAT / LabelImg)",
            "[ ] Confirm class IDs match shared/taxonomy.yaml (0: pothole, 1: crack_long, 2: crack_trans, 3: crack_allig)",
            "[ ] Ensure non-defect images have 0-byte empty .txt files",
        ],
    }

    print("\n--- Ingestion & Pre-Labeling Summary ---")
    print(f"Frames Ingested: {processed_count}")
    print(f"Draft Detections: {total_detections}")
    print(f"Privacy Redactions: {redactions_total}")
    return summary

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ScamRoad Local Sample Ingestion")
    parser.add_argument("--input-dir", type=Path, default=REPO_ROOT / "data" / "processed" / "sample_india" / "images")
    parser.add_argument("--output-dir", type=Path, default=REPO_ROOT / "data" / "local_sample")
    args = parser.parse_args()

    ingest_directory(args.input_dir, args.output_dir)
