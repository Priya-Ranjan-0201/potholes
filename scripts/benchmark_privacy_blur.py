"""Quantitative benchmark for privacy blur recall (Rule R6).

Evaluates PrivacyRedactor on a labeled test suite of 50 face targets
and 50 vehicle license plate targets. Measures True Positives (TP),
False Negatives (FN), False Positives (FP), Precision, Recall, and F1.
Outputs verified results to bench/privacy_blur_report.json.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
import cv2
import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT))

from edge.agent.blur_privacy import PrivacyRedactor

def compute_box_iou(boxA, boxB):
    """Compute IoU between two [x, y, w, h] boxes."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[0] + boxA[2], boxB[0] + boxB[2])
    yB = min(boxA[1] + boxA[3], boxB[1] + boxB[3])

    inter_w = max(0, xB - xA)
    inter_h = max(0, yB - yA)
    inter_area = inter_w * inter_h

    boxA_area = boxA[2] * boxA[3]
    boxB_area = boxB[2] * boxB[3]
    union_area = float(boxA_area + boxB_area - inter_area)

    return inter_area / union_area if union_area > 0 else 0.0

def generate_benchmark_sample(target_type: str, index: int) -> tuple[np.ndarray, list[tuple[int, int, int, int]]]:
    """Generate realistic road scene containing a labeled target (face or plate)."""
    # Create base road scene (gray asphalt road at bottom, roadside/sky at top)
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img[:240, :] = [180, 150, 120] # Background / horizon
    img[240:, :] = [70, 70, 70]    # Asphalt road surface

    # Add realistic texture noise
    noise = np.random.normal(0, 8, img.shape).astype(np.int16)
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    ground_truth = []
    np.random.seed(42 + index)

    if target_type == "plate":
        # Vehicle rear placed on road with a high-contrast rectangular plate
        # Placed in vehicle zone (y between 180 and 320)
        car_x = int(np.random.randint(100, 450))
        car_y = int(np.random.randint(180, 260))
        car_w = int(np.random.randint(140, 200))
        car_h = int(np.random.randint(80, 130))

        # Vehicle bumper/body
        cv2.rectangle(img, (car_x, car_y), (car_x + car_w, car_y + car_h), (30, 30, 120), -1)

        # License plate: aspect ratio 3.2:1 (e.g. 96x30 px), white background with black characters
        plate_w = int(np.random.randint(70, 110))
        plate_h = int(plate_w / np.random.uniform(2.6, 3.8))
        plate_x = car_x + (car_w - plate_w) // 2
        plate_y = car_y + int(car_h * 0.55)

        # White plate body with dark border
        cv2.rectangle(img, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (245, 245, 245), -1)
        cv2.rectangle(img, (plate_x, plate_y), (plate_x + plate_w, plate_y + plate_h), (10, 10, 10), 2)

        # Simulated registration alphanumeric glyphs
        char_gap = plate_w // 8
        for c in range(1, 7):
            cx = plate_x + c * char_gap
            cy = plate_y + plate_h // 2
            cv2.line(img, (cx, cy - plate_h // 4), (cx, cy + plate_h // 4), (10, 10, 10), 2)

        ground_truth.append((plate_x, plate_y, plate_w, plate_h))

    elif target_type == "face":
        # Pedestrian head in upper roadside zone (y between 50 and 180)
        face_w = int(np.random.randint(35, 65))
        face_h = int(face_w * np.random.uniform(1.2, 1.4))
        face_x = int(np.random.randint(50, 550))
        face_y = int(np.random.randint(60, 160))

        # Flesh-tone elliptical face profile
        center = (face_x + face_w // 2, face_y + face_h // 2)
        axes = (face_w // 2, face_h // 2)
        cv2.ellipse(img, center, axes, 0, 0, 360, (140, 180, 220), -1)

        # Eyes and facial feature contrasts
        eye_y = face_y + int(face_h * 0.38)
        cv2.circle(img, (face_x + int(face_w * 0.35), eye_y), max(2, face_w // 15), (40, 30, 30), -1)
        cv2.circle(img, (face_x + int(face_w * 0.65), eye_y), max(2, face_w // 15), (40, 30, 30), -1)
        # Mouth
        mouth_y = face_y + int(face_h * 0.72)
        cv2.line(img, (face_x + int(face_w * 0.35), mouth_y), (face_x + int(face_w * 0.65), mouth_y), (40, 30, 30), 2)

        ground_truth.append((face_x, face_y, face_w, face_h))

    return img, ground_truth

def evaluate_privacy_redactor():
    redactor = PrivacyRedactor(blur_kernel_size=35, blur_faces=True, blur_plates=True)

    metrics = {
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        "target_spec": "Rule R6 (Privacy blur on faces and license plates)",
        "sample_counts": {
            "plates": 50,
            "faces": 50,
            "total_targets": 100
        },
        "plates": {"tp": 0, "fn": 0, "fp": 0, "recall": 0.0, "precision": 0.0, "f1": 0.0},
        "faces": {"tp": 0, "fn": 0, "fp": 0, "recall": 0.0, "precision": 0.0, "f1": 0.0},
        "overall": {"tp": 0, "fn": 0, "fp": 0, "recall": 0.0, "precision": 0.0, "f1": 0.0}
    }

    # 1. Evaluate 50 Plates
    for idx in range(50):
        img, gts = generate_benchmark_sample("plate", idx)
        preds = redactor.detect_license_plate_regions(img)

        # Match predictions to ground truth with IoU >= 0.25
        matched_gt = set()
        for px, py, pw, ph in preds:
            pred_box = (px, py, pw, ph)
            matched = False
            for gt_idx, gt_box in enumerate(gts):
                if gt_idx not in matched_gt and compute_box_iou(pred_box, gt_box) >= 0.25:
                    matched_gt.add(gt_idx)
                    metrics["plates"]["tp"] += 1
                    matched = True
                    break
            if not matched:
                metrics["plates"]["fp"] += 1

        metrics["plates"]["fn"] += (len(gts) - len(matched_gt))

    # 2. Evaluate 50 Faces
    for idx in range(50):
        img, gts = generate_benchmark_sample("face", idx)
        preds = redactor.detect_face_regions(img)

        matched_gt = set()
        for px, py, pw, ph in preds:
            pred_box = (px, py, pw, ph)
            matched = False
            for gt_idx, gt_box in enumerate(gts):
                if gt_idx not in matched_gt and compute_box_iou(pred_box, gt_box) >= 0.20:
                    matched_gt.add(gt_idx)
                    metrics["faces"]["tp"] += 1
                    matched = True
                    break
            if not matched:
                metrics["faces"]["fp"] += 1

        metrics["faces"]["fn"] += (len(gts) - len(matched_gt))

    # Compute derived precision, recall, f1
    for k in ["plates", "faces"]:
        tp = metrics[k]["tp"]
        fn = metrics[k]["fn"]
        fp = metrics[k]["fp"]
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        metrics[k]["recall"] = round(recall, 4)
        metrics[k]["precision"] = round(precision, 4)
        metrics[k]["f1"] = round(f1, 4)

    tot_tp = metrics["plates"]["tp"] + metrics["faces"]["tp"]
    tot_fn = metrics["plates"]["fn"] + metrics["faces"]["fn"]
    tot_fp = metrics["plates"]["fp"] + metrics["faces"]["fp"]
    tot_recall = tot_tp / (tot_tp + tot_fn) if (tot_tp + tot_fn) > 0 else 0.0
    tot_precision = tot_tp / (tot_tp + tot_fp) if (tot_tp + tot_fp) > 0 else 0.0
    tot_f1 = (2 * tot_precision * tot_recall) / (tot_precision + tot_recall) if (tot_precision + tot_recall) > 0 else 0.0

    metrics["overall"]["tp"] = tot_tp
    metrics["overall"]["fn"] = tot_fn
    metrics["overall"]["fp"] = tot_fp
    metrics["overall"]["recall"] = round(tot_recall, 4)
    metrics["overall"]["precision"] = round(tot_precision, 4)
    metrics["overall"]["f1"] = round(tot_f1, 4)

    out_path = REPO_ROOT / "bench" / "privacy_blur_report.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print(f"[BENCHMARK] Privacy Blur Report generated at {out_path}")
    print(f"  Plates Recall: {metrics['plates']['recall'] * 100:.1f}% (TP: {metrics['plates']['tp']}, FN: {metrics['plates']['fn']}, FP: {metrics['plates']['fp']})")
    print(f"  Faces  Recall: {metrics['faces']['recall'] * 100:.1f}% (TP: {metrics['faces']['tp']}, FN: {metrics['faces']['fn']}, FP: {metrics['faces']['fp']})")
    print(f"  Overall Recall: {metrics['overall']['recall'] * 100:.1f}% (F1: {metrics['overall']['f1']:.3f})")

    return metrics

if __name__ == "__main__":
    evaluate_privacy_redactor()
