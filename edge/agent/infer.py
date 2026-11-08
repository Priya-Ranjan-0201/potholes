"""ONNX Edge inference engine for ScamRoad road-damage detection.

Executes quantized INT8 or FP32 ONNX graphs on edge hardware using onnxruntime.
Applies letterboxing, forward inference, score filtering, and Non-Maximum Suppression (NMS).
Adheres strictly to Rule R2 (No fake AI: raises ModelNotReadyError if model unavailable)
and Rule R4 (No uncalibrated physical dimensions: computes relative area % only).
"""

from __future__ import annotations

import argparse
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import ClassVar

import cv2
import numpy as np
import onnxruntime as ort
import yaml


class ModelNotReadyError(RuntimeError):
    """Raised when the specified model file cannot be found or initialized."""


@dataclass
class Detection:
    """Individual road defect detection result on a single frame."""

    class_id: int
    class_name: str
    confidence: float
    bbox_xyxy: tuple[float, float, float, float]  # (xmin, ymin, xmax, ymax) in pixels
    relative_area: float  # (box_area / frame_area), Rule R4: normalized percentage only
    calibrated: bool = False  # Always False for single camera without calibration source


def letterbox_image(
    image: np.ndarray,
    target_shape: tuple[int, int] = (640, 640),
    color: tuple[int, int, int] = (114, 114, 114),
) -> tuple[np.ndarray, float, tuple[int, int]]:
    """Resize image to target shape with padding, preserving original aspect ratio."""
    h, w = image.shape[:2]
    target_w, target_h = target_shape

    r = min(target_w / w, target_h / h)
    new_w, new_h = round(w * r), round(h * r)

    dw, dh = (target_w - new_w) / 2, (target_h - new_h) / 2
    top, bottom = round(dh - 0.1), round(dh + 0.1)
    left, right = round(dw - 0.1), round(dw + 0.1)

    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
    padded = cv2.copyMakeBorder(resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)
    return padded, r, (left, top)


def nms_boxes(
    boxes: list[tuple[float, float, float, float]],
    scores: list[float],
    iou_threshold: float = 0.45,
    class_ids: list[int] | None = None,
    iom_threshold: float = 0.60,
) -> list[int]:
    """Perform Non-Maximum Suppression on bounding boxes with nested box suppression."""
    if not boxes:
        return []

    boxes_arr = np.array(boxes, dtype=np.float32)
    scores_arr = np.array(scores, dtype=np.float32)
    classes_arr = np.array(class_ids, dtype=np.int32) if class_ids is not None else None

    x1 = boxes_arr[:, 0]
    y1 = boxes_arr[:, 1]
    x2 = boxes_arr[:, 2]
    y2 = boxes_arr[:, 3]

    areas = np.maximum(0.0, x2 - x1) * np.maximum(0.0, y2 - y1)
    order = scores_arr.argsort()[::-1]

    keep: list[int] = []
    while order.size > 0:
        i = int(order[0])
        keep.append(i)
        if order.size == 1:
            break

        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])

        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h

        union = areas[i] + areas[order[1:]] - inter
        ovr = inter / np.maximum(union, 1e-6)

        suppress = ovr > iou_threshold
        if classes_arr is not None:
            min_area = np.minimum(areas[i], areas[order[1:]])
            iom = inter / np.maximum(min_area, 1e-6)
            same_cls = (classes_arr[i] == classes_arr[order[1:]])
            suppress = suppress | (same_cls & (iom > iom_threshold))

        inds = np.where(~suppress)[0]
        order = order[inds + 1]

    return keep


class EdgeInferenceEngine:
    """Manages ONNX Runtime inference on camera frames."""

    DEFAULT_CLASSES: ClassVar[dict[int, str]] = {
        0: "POTHOLE",
        1: "CRACK_LONG",
        2: "CRACK_TRANS",
        3: "CRACK_ALLIGATOR",
    }

    def __init__(
        self,
        model_path: Path | str,
        input_size: int = 640,
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
        taxonomy_path: Path | None = None,
        device_profile: str = "generic",
    ) -> None:
        self.model_path = Path(model_path)
        self.input_size = input_size
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold
        self.class_names = dict(self.DEFAULT_CLASSES)

        if taxonomy_path and taxonomy_path.exists():
            self._load_taxonomy(taxonomy_path)

        if not self.model_path.exists():
            raise ModelNotReadyError(
                f"Model file not found at: {self.model_path}. "
                "Per Rule R2, fake/mock inference is forbidden."
            )

        # Setup ONNX Runtime session
        sess_opts = ort.SessionOptions()
        sess_opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        providers = ["CPUExecutionProvider"]
        if "CUDAExecutionProvider" in ort.get_available_providers() and device_profile != "cpu":
            providers.insert(0, "CUDAExecutionProvider")

        self.session = ort.InferenceSession(
            str(self.model_path), sess_options=sess_opts, providers=providers
        )
        self.input_name = self.session.get_inputs()[0].name
        self.output_names = [o.name for o in self.session.get_outputs()]

        # Parse class names from ONNX model metadata if present
        meta = self.session.get_modelmeta().custom_metadata_map
        if "names" in meta:
            try:
                import ast
                parsed_names = ast.literal_eval(meta["names"])
                if isinstance(parsed_names, dict):
                    self.class_names = {int(k): str(v).upper() for k, v in parsed_names.items()}
            except Exception:
                pass

    def _load_taxonomy(self, tax_path: Path) -> None:
        """Load class labels from taxonomy YAML."""
        with open(tax_path, encoding="utf-8") as f:
            tax = yaml.safe_load(f)
        for idx, item in enumerate(tax.get("classes", [])):
            code = item.get("code")
            if code:
                self.class_names[idx] = code

    def predict(self, frame: np.ndarray, roi_offset: tuple[int, int] = (0, 0)) -> list[Detection]:
        """Run object detection on an image frame.

        Args:
            frame: Input BGR image array.
            roi_offset: (x_offset, y_offset) if frame was cropped from a larger image.

        Returns:
            List of detected road defects.
        """
        orig_h, orig_w = frame.shape[:2]
        total_frame_area = float(orig_h * orig_w)

        # 1. Letterbox preprocessing
        padded, scale, (pad_left, pad_top) = letterbox_image(
            frame, (self.input_size, self.input_size)
        )
        rgb = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB)
        tensor = (rgb.astype(np.float32) / 255.0).transpose((2, 0, 1))
        tensor = np.expand_dims(tensor, axis=0)

        # 2. Forward inference
        outputs = self.session.run(self.output_names, {self.input_name: tensor})
        raw_out = outputs[0]  # Shape: [1, 4 + num_classes, num_anchors]

        if len(raw_out.shape) == 3 and raw_out.shape[1] < raw_out.shape[2]:
            raw_out = np.transpose(raw_out, (0, 2, 1))  # -> [1, anchors, 4 + classes]

        preds = raw_out[0]  # [anchors, 4 + classes]

        boxes: list[tuple[float, float, float, float]] = []
        confidences: list[float] = []
        class_ids: list[int] = []

        off_x, off_y = roi_offset

        # 3. Postprocess anchors
        for row in preds:
            cx, cy, w, h = row[:4]
            class_scores = row[4:]
            best_cls = int(np.argmax(class_scores))
            score = float(class_scores[best_cls])

            if score < self.conf_threshold:
                continue

            # Convert center-xywh to xyxy in padded coordinates
            x1_pad = cx - w / 2.0
            y1_pad = cy - h / 2.0
            x2_pad = cx + w / 2.0
            y2_pad = cy + h / 2.0

            # Invert letterbox padding & scaling to original frame
            x1 = (x1_pad - pad_left) / scale
            y1 = (y1_pad - pad_top) / scale
            x2 = (x2_pad - pad_left) / scale
            y2 = (y2_pad - pad_top) / scale

            # Clamp to frame bounds
            x1 = max(0.0, min(float(orig_w), x1)) + off_x
            y1 = max(0.0, min(float(orig_h), y1)) + off_y
            x2 = max(0.0, min(float(orig_w), x2)) + off_x
            y2 = max(0.0, min(float(orig_h), y2)) + off_y

            if (x2 - x1) >= 2.0 and (y2 - y1) >= 2.0:
                boxes.append(
                    (
                        round(float(x1), 2),
                        round(float(y1), 2),
                        round(float(x2), 2),
                        round(float(y2), 2),
                    )
                )
                confidences.append(score)
                class_ids.append(best_cls)

        if not boxes:
            return []

        # 4. Non-Maximum Suppression (Class-aware with containment filtering)
        keep_indices = nms_boxes(
            boxes,
            confidences,
            iou_threshold=self.iou_threshold,
            class_ids=class_ids,
            iom_threshold=0.60,
        )

        detections: list[Detection] = []
        for idx in keep_indices:
            b = boxes[idx]
            box_area = (b[2] - b[0]) * (b[3] - b[1])
            rel_area = round(box_area / total_frame_area, 6) if total_frame_area > 0 else 0.0

            cid = class_ids[idx]
            cname = self.class_names.get(cid, f"CLASS_{cid}")
            detections.append(
                Detection(
                    class_id=cid,
                    class_name=cname,
                    confidence=round(confidences[idx], 4),
                    bbox_xyxy=b,
                    relative_area=rel_area,
                    calibrated=False,
                )
            )

        return detections


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Edge model inference.")
    parser.add_argument(
        "--model",
        type=Path,
        default=Path("ml/runs/pothole_yolov8n/weights/best_int8.onnx"),
        help="Path to ONNX model.",
    )
    parser.add_argument("--image", type=Path, required=True, help="Path to input image.")
    parser.add_argument("--conf", type=float, default=0.25, help="Confidence threshold.")
    parser.add_argument("--iou", type=float, default=0.45, help="NMS IoU threshold.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the inference CLI."""
    args = parse_args(argv)

    if not args.image.exists():
        print(f"Error: Image not found: {args.image}", file=sys.stderr)
        sys.exit(1)

    try:
        engine = EdgeInferenceEngine(
            model_path=args.model,
            conf_threshold=args.conf,
            iou_threshold=args.iou,
        )
    except ModelNotReadyError as e:
        print(f"503 MODEL_NOT_READY: {e}", file=sys.stderr)
        sys.exit(1)

    frame = cv2.imread(str(args.image))
    t0 = time.perf_counter()
    detections = engine.predict(frame)
    latency_ms = (time.perf_counter() - t0) * 1000.0

    print(f"Inference completed in {latency_ms:.2f} ms | Found {len(detections)} defect(s):")
    for d in detections:
        print(
            f"  - [{d.class_name}] Conf: {d.confidence:.2f} | "
            f"RelArea: {d.relative_area * 100:.3f}% | Box: {d.bbox_xyxy}"
        )


if __name__ == "__main__":
    main()
