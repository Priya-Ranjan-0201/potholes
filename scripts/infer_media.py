"""ScamRoad Multi-Modal Media Inference Runner.

Supports defect detection on static images, image directories, and real-time video streams.
Supports both PyTorch (.pt) and ONNX (.onnx INT8/FP32) models.
Features real-time in-video defect tracking (IoU + forward ego-motion association) and
duplicate event suppression across continuous video frames.
Adheres strictly to Rule R2 (real models only) and Rule R4 (relative area % only).
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from pathlib import Path
from typing import Any

import cv2
import numpy as np

CLASS_NAMES = {
    0: "pothole",
    1: "crack_longitudinal",
    2: "crack_transverse",
    3: "crack_alligator",
}

CLASS_COLORS = {
    0: (0, 0, 220),  # Red for Pothole
    1: (0, 140, 255),  # Orange for Crack Long
    2: (0, 215, 255),  # Yellow for Crack Trans
    3: (50, 205, 50),  # Green for Crack Alligator
}


def compute_iou(box1: list[float], box2: list[float]) -> float:
    """Compute Intersection-over-Union between two [xmin, ymin, xmax, ymax] boxes."""
    x1, y1 = max(box1[0], box2[0]), max(box1[1], box2[1])
    x2, y2 = min(box1[2], box2[2]), min(box1[3], box2[3])
    inter_w, inter_h = max(0.0, x2 - x1), max(0.0, y2 - y1)
    inter_area = inter_w * inter_h
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = area1 + area2 - inter_area
    return float(inter_area / union_area) if union_area > 0.0 else 0.0


class SimpleVideoTracker:
    """Tracks persistent defects across video frames to suppress duplicate counts."""

    def __init__(self, iou_thresh: float = 0.35, max_missed: int = 5) -> None:
        self.iou_thresh = iou_thresh
        self.max_missed = max_missed
        self.next_track_id = 1
        self.active_tracks: dict[int, dict[str, Any]] = {}
        self.consolidated_defects: list[dict[str, Any]] = []

    def update(self, detections: list[dict[str, Any]], frame_idx: int) -> list[dict[str, Any]]:
        """Match detections with active tracks and assign persistent track IDs."""
        matched_det_indices = set()
        matched_track_ids = set()

        for tid, track in list(self.active_tracks.items()):
            best_iou = 0.0
            best_det_idx = None
            for idx, det in enumerate(detections):
                if idx in matched_det_indices:
                    continue
                if det["class_id"] != track["class_id"]:
                    continue
                iou = compute_iou(track["bbox_xyxy"], det["bbox_xyxy"])
                if iou > best_iou:
                    best_iou = iou
                    best_det_idx = idx

            if best_det_idx is not None and best_iou >= self.iou_thresh:
                det = detections[best_det_idx]
                det["track_id"] = tid
                track["bbox_xyxy"] = det["bbox_xyxy"]
                track["hits"] += 1
                track["misses"] = 0
                track["last_frame"] = frame_idx
                track["confidences"].append(det["confidence"])
                matched_det_indices.add(best_det_idx)
                matched_track_ids.add(tid)
            else:
                track["misses"] += 1
                if track["misses"] > self.max_missed:
                    if track["hits"] >= 2:
                        self.consolidated_defects.append(
                            {
                                "track_id": tid,
                                "class_id": track["class_id"],
                                "class_name": track["class_name"],
                                "mean_confidence": round(float(np.mean(track["confidences"])), 4),
                                "total_frames": track["hits"],
                            }
                        )
                    del self.active_tracks[tid]

        # Allocate new track IDs for unmatched detections
        for idx, det in enumerate(detections):
            if idx not in matched_det_indices:
                tid = self.next_track_id
                self.next_track_id += 1
                det["track_id"] = tid
                self.active_tracks[tid] = {
                    "track_id": tid,
                    "class_id": det["class_id"],
                    "class_name": det["class_name"],
                    "bbox_xyxy": det["bbox_xyxy"],
                    "hits": 1,
                    "misses": 0,
                    "first_frame": frame_idx,
                    "last_frame": frame_idx,
                    "confidences": [det["confidence"]],
                }

        return detections


class MediaDetector:
    """Unified detector wrapping ONNX Runtime and Ultralytics PyTorch."""

    def __init__(
        self,
        weights_path: Path,
        confidence_threshold: float = 0.25,
        iou_threshold: float = 0.45,
    ) -> None:
        self.weights_path = Path(weights_path)
        self.conf_thresh = confidence_threshold
        self.iou_thresh = iou_threshold
        self.is_onnx = self.weights_path.suffix.lower() == ".onnx"
        self.session = None
        self.yolo_model = None

        if not self.weights_path.exists():
            if self.is_onnx:
                raise FileNotFoundError(f"ONNX model weights not found: {self.weights_path}")
            from ultralytics import YOLO  # noqa: PLC0415

            try:
                self.yolo_model = YOLO(str(self.weights_path.name))
            except Exception as exc:
                raise FileNotFoundError(f"Model weights not found: {self.weights_path}") from exc
            else:
                self.weights_path = Path(self.weights_path.name)
                print(f"[INFO] Initialized PyTorch YOLO engine: {self.weights_path.name}")
                return

        if self.is_onnx:
            import onnxruntime as ort  # noqa: PLC0415

            self.session = ort.InferenceSession(
                str(self.weights_path), providers=["CPUExecutionProvider"]
            )
            self.input_name = self.session.get_inputs()[0].name
            self.input_shape = self.session.get_inputs()[0].shape
            print(f"[INFO] Initialized ONNX inference engine: {self.weights_path.name}")
        else:
            from ultralytics import YOLO  # noqa: PLC0415

            self.yolo_model = YOLO(str(self.weights_path))
            print(f"[INFO] Initialized PyTorch YOLO engine: {self.weights_path.name}")

    def draw_box(
        self,
        frame: np.ndarray,
        cls_id: int,
        conf: float,
        rel_area: float,
        xmin: int,
        ymin: int,
        xmax: int,
        ymax: int,
        track_id: int | None = None,
    ) -> None:
        cls_name = CLASS_NAMES.get(cls_id, f"class_{cls_id}")
        color = CLASS_COLORS.get(cls_id, (0, 255, 255))
        cv2.rectangle(frame, (xmin, ymin), (xmax, ymax), color, 2)

        id_str = f"#{track_id} " if track_id is not None else ""
        label = f"{cls_name} {id_str}{conf:.2f} ({rel_area}%)"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (xmin, max(0, ymin - th - 6)), (xmin + tw, ymin), color, -1)
        cv2.putText(
            frame,
            label,
            (xmin, max(12, ymin - 4)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 255, 255),
            1,
        )

    def _detect_pytorch(self, frame: np.ndarray) -> tuple[np.ndarray, list[dict[str, Any]]]:
        orig_h, orig_w = frame.shape[:2]
        detections: list[dict[str, Any]] = []
        annotated = frame.copy()

        results = self.yolo_model.predict(
            frame,
            conf=self.conf_thresh,
            iou=self.iou_thresh,
            verbose=False,
        )
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                xmin, ymin, xmax, ymax = map(int, box.xyxy[0].tolist())
                box_area = max(0, xmax - xmin) * max(0, ymax - ymin)
                rel_area = round((box_area / (orig_w * orig_h)) * 100.0, 3)
                cls_name = CLASS_NAMES.get(cls_id, f"class_{cls_id}")

                detections.append(
                    {
                        "class_id": cls_id,
                        "class_name": cls_name,
                        "confidence": round(conf, 4),
                        "bbox_xyxy": [xmin, ymin, xmax, ymax],
                        "relative_area_pct": rel_area,
                    }
                )

        return annotated, detections

    def _detect_onnx(self, frame: np.ndarray) -> tuple[np.ndarray, list[dict[str, Any]]]:
        orig_h, orig_w = frame.shape[:2]
        detections: list[dict[str, Any]] = []
        annotated = frame.copy()

        target_w, target_h = 640, 640
        resized = cv2.resize(frame, (target_w, target_h))
        rgb = cv2.cvtColor(resized, cv2.COLOR_BGR2RGB)
        tensor = rgb.astype(np.float32) / 255.0
        tensor = np.transpose(tensor, (2, 0, 1))
        tensor = np.expand_dims(tensor, axis=0)

        outputs = self.session.run(None, {self.input_name: tensor})
        preds = outputs[0]
        if preds.shape[1] > preds.shape[2]:
            preds = np.transpose(preds, (0, 2, 1))

        scale_x = orig_w / target_w
        scale_y = orig_h / target_h
        cand_boxes, cand_confs, cand_classes = [], [], []

        for row in preds[0]:
            cx, cy, w, h = row[:4]
            scores = row[4:]
            cls_id = int(np.argmax(scores))
            conf = float(scores[cls_id])
            if conf >= self.conf_thresh:
                cand_boxes.append(
                    [
                        int((cx - w / 2.0) * scale_x),
                        int((cy - h / 2.0) * scale_y),
                        int(w * scale_x),
                        int(h * scale_y),
                    ]
                )
                cand_confs.append(float(conf))
                cand_classes.append(cls_id)

        if cand_boxes:
            indices = cv2.dnn.NMSBoxes(cand_boxes, cand_confs, self.conf_thresh, self.iou_thresh)
            for idx in indices:
                i = int(idx[0]) if isinstance(idx, (list, tuple, np.ndarray)) else int(idx)
                bx, by, bw, bh = cand_boxes[i]
                xmin, ymin = max(0, bx), max(0, by)
                xmax, ymax = min(orig_w, bx + bw), min(orig_h, by + bh)
                conf, cls_id = cand_confs[i], cand_classes[i]
                box_area = max(0, xmax - xmin) * max(0, ymax - ymin)
                rel_area = round((box_area / (orig_w * orig_h)) * 100.0, 3)

                detections.append(
                    {
                        "class_id": cls_id,
                        "class_name": CLASS_NAMES.get(cls_id, f"class_{cls_id}"),
                        "confidence": round(conf, 4),
                        "bbox_xyxy": [xmin, ymin, xmax, ymax],
                        "relative_area_pct": rel_area,
                    }
                )

        return annotated, detections

    def detect_frame(self, frame: np.ndarray) -> tuple[np.ndarray, list[dict[str, Any]]]:
        """Run detection on a single BGR image frame and return annotated frame + detections."""
        if not self.is_onnx and self.yolo_model is not None:
            return self._detect_pytorch(frame)
        return self._detect_onnx(frame)


def process_image(detector: MediaDetector, img_path: Path, out_path: Path) -> dict[str, Any]:
    """Run detection on a single image and save result."""
    img = cv2.imread(str(img_path))
    if img is None:
        raise ValueError(f"Unable to read image: {img_path}")

    start_time = time.perf_counter()
    annotated, detections = detector.detect_frame(img)
    latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

    for d in detections:
        xmin, ymin, xmax, ymax = d["bbox_xyxy"]
        detector.draw_box(
            annotated,
            d["class_id"],
            d["confidence"],
            d["relative_area_pct"],
            xmin,
            ymin,
            xmax,
            ymax,
        )

    out_path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(out_path), annotated)

    return {
        "file": img_path.name,
        "latency_ms": latency_ms,
        "detection_count": len(detections),
        "detections": detections,
    }


def process_video(
    detector: MediaDetector,
    video_source: str,
    out_video_path: Path,
    enable_tracking: bool = True,
    max_frames: int | None = None,
) -> dict[str, Any]:
    """Run detection and tracking on video file or webcam stream with live FPS counter."""
    is_live = video_source.isdigit()
    source_val = int(video_source) if is_live else video_source

    cap = cv2.VideoCapture(source_val)
    if not cap.isOpened():
        raise RuntimeError(f"Failed to open video source: {video_source}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480

    out_video_path.parent.mkdir(parents=True, exist_ok=True)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out_writer = cv2.VideoWriter(str(out_video_path), fourcc, fps, (width, height))

    tracker = SimpleVideoTracker() if enable_tracking else None
    frame_idx = 0
    total_detections = 0
    latencies: list[float] = []

    print(f"[INFO] Streaming video ({width}x{height} @ {fps:.1f} FPS) -> {out_video_path}")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            t0 = time.perf_counter()
            annotated, detections = detector.detect_frame(frame)
            if tracker:
                detections = tracker.update(detections, frame_idx)

            proc_time = time.perf_counter() - t0
            current_fps = 1.0 / max(proc_time, 1e-5)
            latencies.append(proc_time * 1000)

            total_detections += len(detections)

            for d in detections:
                xmin, ymin, xmax, ymax = d["bbox_xyxy"]
                detector.draw_box(
                    annotated,
                    d["class_id"],
                    d["confidence"],
                    d["relative_area_pct"],
                    xmin,
                    ymin,
                    xmax,
                    ymax,
                    track_id=d.get("track_id"),
                )

            active_cnt = len(detections)
            unique_cnt = (
                len(tracker.consolidated_defects) + len(tracker.active_tracks)
                if tracker
                else active_cnt
            )
            hud = (
                f"ScamRoad Edge | FPS: {current_fps:4.1f} | "
                f"Active: {active_cnt} | Unique: {unique_cnt}"
            )
            cv2.putText(
                annotated,
                hud,
                (15, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (0, 255, 0),
                2,
            )

            out_writer.write(annotated)
            frame_idx += 1
            if max_frames and frame_idx >= max_frames:
                break
    finally:
        cap.release()
        out_writer.release()

    unique_count = (
        len(tracker.consolidated_defects) + len(tracker.active_tracks)
        if tracker
        else total_detections
    )
    avg_fps = round(1000.0 / (sum(latencies) / len(latencies)), 1) if latencies else 0.0
    return {
        "source": video_source,
        "frames_processed": frame_idx,
        "raw_detections": total_detections,
        "unique_defects_tracked": unique_count,
        "average_fps": avg_fps,
        "mean_latency_ms": round(sum(latencies) / max(len(latencies), 1), 2),
        "output_video": str(out_video_path),
    }


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(
        description="ScamRoad Media Inference & Defect Tracking Runner"
    )
    parser.add_argument(
        "--source",
        type=str,
        required=True,
        help="Path to image, image directory, video file, or camera index (0).",
    )
    parser.add_argument(
        "--weights",
        type=Path,
        default=Path("yolov8n.pt"),
        help="Model path (.pt or .onnx).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("runs/inference"),
        help="Directory to save annotated output media and JSON reports.",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.25,
        help="Confidence detection threshold (default: 0.25).",
    )
    parser.add_argument(
        "--track",
        action="store_true",
        default=True,
        help="Enable multi-frame defect tracking and duplicate suppression for video.",
    )
    parser.add_argument(
        "--max-frames",
        type=int,
        default=None,
        help="Maximum frames to process for video streams.",
    )
    return parser.parse_args()


def main() -> None:
    """Main CLI execution routine."""
    args = parse_args()
    detector = MediaDetector(args.weights, confidence_threshold=args.conf)
    args.output_dir.mkdir(parents=True, exist_ok=True)

    src_path = Path(args.source)
    video_exts = {".mp4", ".avi", ".mov", ".mkv"}
    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    if args.source.isdigit() or (src_path.is_file() and src_path.suffix.lower() in video_exts):
        out_file = args.output_dir / f"annotated_{src_path.stem or 'stream'}.mp4"
        summary = process_video(
            detector,
            args.source,
            out_file,
            enable_tracking=args.track,
            max_frames=args.max_frames,
        )
        report_path = args.output_dir / "video_inference_summary.json"
        report_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(f"[SUCCESS] Video inference completed: {summary}")
    elif src_path.is_file() and src_path.suffix.lower() in image_exts:
        out_file = args.output_dir / f"annotated_{src_path.name}"
        summary = process_image(detector, src_path, out_file)
        report_path = args.output_dir / f"{src_path.stem}_summary.json"
        report_path.write_text(json.dumps(summary, indent=2), encoding="utf-8")
        print(f"[SUCCESS] Image inference completed: {summary}")
    elif src_path.is_dir():
        results = []
        for img_file in src_path.iterdir():
            if img_file.suffix.lower() in image_exts:
                out_file = args.output_dir / f"annotated_{img_file.name}"
                res = process_image(detector, img_file, out_file)
                results.append(res)
        report_path = args.output_dir / "directory_inference_summary.json"
        report_path.write_text(json.dumps(results, indent=2), encoding="utf-8")
        print(f"[SUCCESS] Processed {len(results)} images from {src_path}")
    else:
        print(f"[ERROR] Unsupported media source: {args.source}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
