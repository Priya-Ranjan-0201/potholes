"""ScamRoad Real-Time AI Inference API Endpoint.
Executes multi-model ONNX Runtime deep learning inference combining the 70/30 ensemble:
- 70% Weightage: Kodjaoglanian D-FINE Large DETR, PyResearch YOLOv12s, keremberke YOLOv8-Seg, jhasuman Geometry
- 30% Weightage: Fine-tuned YOLO11n-INT8 edge detector + RDD2022 Distress Multi-Class crack engine
- Semantic Scene Exclusion: COCO-trained YOLOv11n ONNX blocker eliminates pedestrians, vehicles, and road signs
Adheres strictly to Rule R2 (No fake AI) and Rule R4 (No uncalibrated physical claims).
"""

import os
import time
from typing import List, Optional

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from pydantic import BaseModel

router = APIRouter()

# Global persistent engine cache to eliminate cold startup latency on repeated inference
_ENGINE_CACHE: dict = {}

# COCO classes representing non-road foreground obstacles / traffic / signs
_OBSTACLE_CLASSES = frozenset({0, 1, 2, 3, 5, 7, 9, 11, 14, 15, 16, 17, 18, 19})
_VEHICLE_CLASSES = frozenset({2, 5, 7})


class DetectionBox(BaseModel):
    id: str
    label: str
    confidence: float
    box: List[float]  # [x%, y%, w%, h%]
    polygon: Optional[List[List[float]]] = None  # [[x%, y%], ...] non-intersecting contour
    severity: str
    score: int
    areaPx: int
    action: str
    is_calibrated: bool = False
    measurement_method: str = "uncalibrated_pixel_area"
    unit: str = "px_relative_pct"
    wheel_path_risk: bool = False
    depth_indicator: str = "Medium"
    model_source: str = "Ensemble (70% External + 30% Edge)"


class InferenceResponse(BaseModel):
    status: str
    image_width: int
    image_height: int
    total_defects: int
    pothole_count: int
    crack_count: int
    max_severity: str
    overall_health_score: int
    detections: List[DetectionBox]
    engine: str = "70/30 Hybrid Ensemble (D-FINE + YOLOv12 + YOLOv8-Seg / YOLO11n-INT8)"
    latency_ms: float = 0.0


def compute_iou_xyxy(b1, b2) -> float:
    """Compute Intersection-over-Union between two [x1, y1, x2, y2] bounding boxes."""
    x_a = max(b1[0], b2[0])
    y_a = max(b1[1], b2[1])
    x_b = min(b1[2], b2[2])
    y_b = min(b1[3], b2[3])
    inter = max(0.0, x_b - x_a) * max(0.0, y_b - y_a)
    area1 = max(0.0, b1[2] - b1[0]) * max(0.0, b1[3] - b1[1])
    area2 = max(0.0, b2[2] - b2[0]) * max(0.0, b2[3] - b2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0.0


def compute_iom_xyxy(b1, b2) -> float:
    """Compute Intersection-over-Minimum-Area (containment ratio) between two [x1, y1, x2, y2] boxes."""
    x_a = max(b1[0], b2[0])
    y_a = max(b1[1], b2[1])
    x_b = min(b1[2], b2[2])
    y_b = min(b1[3], b2[3])
    inter = max(0.0, x_b - x_a) * max(0.0, y_b - y_a)
    area1 = max(0.0, b1[2] - b1[0]) * max(0.0, b1[3] - b1[1])
    area2 = max(0.0, b2[2] - b2[0]) * max(0.0, b2[3] - b2[1])
    min_area = min(area1, area2)
    return inter / min_area if min_area > 0 else 0.0


def _get_ort_session(cache_key: str, path: str):
    """Load and cache an ONNX Runtime CPU session safely."""
    if cache_key in _ENGINE_CACHE:
        return _ENGINE_CACHE[cache_key]
    if not os.path.exists(path):
        return None
    try:
        import onnxruntime as ort

        sess_opts = ort.SessionOptions()
        sess_opts.enable_cpu_mem_arena = False
        sess = ort.InferenceSession(path, sess_options=sess_opts, providers=["CPUExecutionProvider"])
        _ENGINE_CACHE[cache_key] = sess
        return sess
    except Exception as e:
        print(f"[AI ENGINE] Error loading {cache_key}: {e}", flush=True)
        return None


def get_authoritative_engine(conf_thresh: float = 0.25, iou_thresh: float = 0.35):
    """Retrieve or initialize the fine-tuned YOLO11n INT8 ONNX inference engine."""
    from edge.agent.infer import EdgeInferenceEngine

    onnx_candidates = [
        "runs/export/best.onnx",
        "runs/export/best_yolo11_int8.onnx",
        "runs/export/best_int8.onnx",
    ]
    selected_path = next((p for p in onnx_candidates if os.path.exists(p)), None)
    if not selected_path:
        return None

    if selected_path in _ENGINE_CACHE:
        eng = _ENGINE_CACHE[selected_path]
        eng.conf_threshold = conf_thresh
        eng.iou_threshold = iou_thresh
        return eng

    try:
        eng = EdgeInferenceEngine(
            model_path=selected_path,
            conf_threshold=conf_thresh,
            iou_threshold=iou_thresh,
        )
        _ENGINE_CACHE[selected_path] = eng
        return eng
    except Exception:
        return None


def get_crack_engine(conf_thresh: float = 0.28, iou_thresh: float = 0.35):
    """Retrieve or initialize the multi-class crack model (alligator, longitudinal, transverse)."""
    from edge.agent.infer import EdgeInferenceEngine

    selected_path = "ml/runs/pothole_yolov8n/weights/best.onnx"
    if not os.path.exists(selected_path):
        return None

    if selected_path in _ENGINE_CACHE:
        eng = _ENGINE_CACHE[selected_path]
        eng.conf_threshold = conf_thresh
        eng.iou_threshold = iou_thresh
        return eng

    try:
        eng = EdgeInferenceEngine(
            model_path=selected_path,
            conf_threshold=conf_thresh,
            iou_threshold=iou_thresh,
        )
        _ENGINE_CACHE[selected_path] = eng
        return eng
    except Exception:
        return None


def get_segmentation_engine():
    """Retrieve or initialize the YOLOv8n pothole segmentation engine."""
    if "yolov8n_seg" in _ENGINE_CACHE:
        return _ENGINE_CACHE["yolov8n_seg"]

    from ultralytics import YOLO

    candidates = [
        "ml/weights/yolov8n_seg_pothole.onnx",
        "ml/weights/yolov8n_seg_pothole.pt",
    ]
    selected = next((p for p in candidates if os.path.exists(p)), None)
    if not selected:
        return None

    try:
        model = YOLO(selected)
        _ENGINE_CACHE["yolov8n_seg"] = model
        return model
    except Exception as e:
        print(f"[AI ENGINE] Error loading segmentation engine: {e}", flush=True)
        return None


def detect_non_road_obstacles(img: np.ndarray, conf_thresh: float = 0.23) -> List[List[float]]:
    """Detect people, bicycles, motorcycles, cars, buses, trucks, and road signs via COCO ONNX.

    Returns exclusion boxes in pixel [x1, y1, x2, y2]. Uses a lower confidence threshold (0.13)
    only for partially cropped objects touching outer image borders, and trims bottom 7% of
    4-wheel vehicles so potholes touching tire edges remain detectable while bodies/roofs are masked.
    """
    sess = _get_ort_session("coco_blocker", "ml/weights/coco_scene_blocker.onnx")
    if sess is None:
        return []

    h, w = img.shape[:2]
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    inp = np.transpose(cv2.resize(rgb, (640, 640)).astype(np.float32) / 255.0, (2, 0, 1))[None, ...]

    try:
        out = sess.run(None, {"images": inp})[0][0]  # (84, 8400)
        cls_scores = out[4:, :]
        cls_ids = np.argmax(cls_scores, axis=0)
        confs = np.max(cls_scores, axis=0)

        keep_mask = confs >= 0.13
        idxs = np.where(keep_mask)[0]
        if len(idxs) == 0:
            return []

        idxs = idxs[np.argsort(-confs[idxs])]
        sx, sy = w / 640.0, h / 640.0
        obstacles: List[List[float]] = []

        for idx in idxs:
            cid = int(cls_ids[idx])
            if cid not in _OBSTACLE_CLASSES:
                continue
            cf = float(confs[idx])
            cx, cy, bw, bh = out[0, idx], out[1, idx], out[2, idx], out[3, idx]
            x1 = max(0.0, (cx - bw / 2.0) * sx)
            y1 = max(0.0, (cy - bh / 2.0) * sy)
            x2 = min(float(w), (cx + bw / 2.0) * sx)
            y2 = min(float(h), (cy + bh / 2.0) * sy)
            on_border = (y2 >= h * 0.94) or (x1 <= w * 0.03) or (x2 >= w * 0.97) or (y1 <= h * 0.03)
            if cf < conf_thresh and not (on_border and cid in {0, 1, 2, 3, 5, 7}):
                continue
            if cid in _VEHICLE_CLASSES:
                y2 = max(y1 + 2.0, y2 - 0.07 * (y2 - y1))
            box = [float(x1), float(y1), float(x2), float(y2)]
            if not any(compute_iou_xyxy(box, prev) > 0.45 for prev in obstacles):
                obstacles.append(box)
        return obstacles
    except Exception as e:
        print(f"[AI INFER] Scene blocker warning: {e}", flush=True)
        return []


def overlaps_obstacle(box: List[float], obstacles: List[List[float]], iom_thresh: float = 0.30) -> bool:
    """Return True if candidate defect center lies inside an obstacle or overlaps above threshold."""
    if not obstacles:
        return False
    cx = (box[0] + box[2]) / 2.0
    cy = (box[1] + box[3]) / 2.0
    for obs in obstacles:
        if obs[0] <= cx <= obs[2] and obs[1] <= cy <= obs[3]:
            return True
        if compute_iom_xyxy(box, obs) > iom_thresh:
            return True
    return False


def _rounded_box_polygon(x1: float, y1: float, x2: float, y2: float, w: int, h: int) -> List[List[float]]:
    """Build a clean chamfered octagon perimeter inside [x1, y1, x2, y2]."""
    bw, bh = max(1.0, x2 - x1), max(1.0, y2 - y1)
    return [
        [round(float((x1 + bw * 0.14) / w * 100), 2), round(float(y1 / h * 100), 2)],
        [round(float((x2 - bw * 0.14) / w * 100), 2), round(float(y1 / h * 100), 2)],
        [round(float(x2 / w * 100), 2), round(float((y1 + bh * 0.14) / h * 100), 2)],
        [round(float(x2 / w * 100), 2), round(float((y2 - bh * 0.14) / h * 100), 2)],
        [round(float((x2 - bw * 0.14) / w * 100), 2), round(float(y2 / h * 100), 2)],
        [round(float((x1 + bw * 0.14) / w * 100), 2), round(float(y2 / h * 100), 2)],
        [round(float(x1 / w * 100), 2), round(float((y2 - bh * 0.14) / h * 100), 2)],
        [round(float(x1 / w * 100), 2), round(float((y1 + bh * 0.14) / h * 100), 2)],
    ]


def _points_to_simple_hull_pct(pts: np.ndarray, w: int, h: int) -> Optional[List[List[float]]]:
    """Convert raw contour points to a strictly non-self-intersecting simplified convex hull."""
    if len(pts) < 3:
        return None
    hull = cv2.convexHull(pts.astype(np.float32))
    eps = max(1.5, 0.025 * cv2.arcLength(hull, True))
    approx = cv2.approxPolyDP(hull, eps, True)
    poly = [
        [round(float(np.clip(p[0][0] / w * 100, 0.0, 100.0)), 2), round(float(np.clip(p[0][1] / h * 100, 0.0, 100.0)), 2)]
        for p in approx
    ]
    return poly if len(poly) >= 3 else None


def extract_defect_polygon(img: np.ndarray, bx: list) -> List[List[float]]:
    """Extract a smooth, non-self-intersecting convex hull contour inside ROI."""
    h, w = img.shape[:2]
    x1, y1 = int(max(0, bx[0])), int(max(0, bx[1]))
    x2, y2 = int(min(w, bx[2])), int(min(h, bx[3]))
    if (x2 - x1) < 12 or (y2 - y1) < 12:
        return _rounded_box_polygon(x1, y1, x2, y2, w, h)

    roi = img[y1:y2, x1:x2]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    kernel = np.ones((5, 5), np.uint8)
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        largest = max(contours, key=cv2.contourArea)
        roi_area = (x2 - x1) * (y2 - y1)
        if cv2.contourArea(largest) > max(24.0, roi_area * 0.12):
            shifted = largest.reshape(-1, 2).astype(np.float32)
            shifted[:, 0] += x1
            shifted[:, 1] += y1
            poly = _points_to_simple_hull_pct(shifted, w, h)
            if poly:
                return poly
    return _rounded_box_polygon(x1, y1, x2, y2, w, h)


def predict_dfine_potholes(img: np.ndarray, conf_thresh: float = 0.25) -> List[dict]:
    """Run inference using the D-FINE Large Transformer with geometry validation."""
    sess = _get_ort_session("dfine_large", "ml/weights/pavimentos_dfine_l.onnx")
    if sess is None:
        return []
    h, w = img.shape[:2]
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    inp = cv2.resize(rgb, (640, 640)).astype(np.float32) / 255.0
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    inp = np.transpose((inp - mean) / std, (2, 0, 1))[None, ...]

    try:
        logits, boxes = sess.run(None, {"pixel_values": inp})
        probs = 1.0 / (1.0 + np.exp(-logits[0, :, 0]))
        indices = np.where(probs >= conf_thresh)[0]
        results = []
        for idx in indices:
            cx, cy, bw, bh = boxes[0, idx]
            x1 = max(0.0, (cx - bw / 2.0) * w)
            y1 = max(0.0, (cy - bh / 2.0) * h)
            x2 = min(float(w), (cx + bw / 2.0) * w)
            y2 = min(float(h), (cy + bh / 2.0) * h)
            box_w, box_h = x2 - x1, y2 - y1
            if box_w < 6 or box_h < 6:
                continue
            aspect = box_w / max(1.0, box_h)
            if aspect < 0.14 or aspect > 6.5:
                continue
            if (box_w / w > 0.85) or (box_h / h > 0.85):
                continue
            bx = [float(x1), float(y1), float(x2), float(y2)]
            results.append({
                "box": bx,
                "conf": float(probs[idx]),
                "poly": extract_defect_polygon(img, bx),
                "source": "D-FINE Large (70% Weight)",
            })
        return results
    except Exception as e:
        print(f"[AI INFER] D-FINE warning: {e}", flush=True)
        return []


def predict_pyresearch_potholes(img: np.ndarray, conf_thresh: float = 0.25) -> List[dict]:
    """Run inference using PyResearch YOLOv12s ONNX engine."""
    sess = _get_ort_session("pyresearch_yolo", "ml/weights/pyresearch_pothole_best.onnx")
    if sess is None:
        return []
    h, w = img.shape[:2]
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    inp = np.transpose(cv2.resize(rgb, (640, 640)).astype(np.float32) / 255.0, (2, 0, 1))[None, ...]

    try:
        out = sess.run(None, {"images": inp})[0][0]
        cx, cy, bw, bh, confs = out[0], out[1], out[2], out[3], out[4]
        sx, sy = w / 640.0, h / 640.0
        indices = np.where(confs >= conf_thresh)[0]
        sorted_indices = indices[np.argsort(-confs[indices])]
        selected = []
        for idx in sorted_indices:
            x1 = max(0.0, (cx[idx] - bw[idx] / 2.0) * sx)
            y1 = max(0.0, (cy[idx] - bh[idx] / 2.0) * sy)
            x2 = min(float(w), (cx[idx] + bw[idx] / 2.0) * sx)
            y2 = min(float(h), (cy[idx] + bh[idx] / 2.0) * sy)
            box_w, box_h = x2 - x1, y2 - y1
            if box_w < 6 or box_h < 6:
                continue
            if (box_w / w > 0.85) or (box_h / h > 0.85):
                continue
            bx = [float(x1), float(y1), float(x2), float(y2)]
            if any(compute_iou_xyxy(bx, s["box"]) > 0.40 for s in selected):
                continue
            selected.append({
                "box": bx,
                "conf": float(confs[idx]),
                "poly": extract_defect_polygon(img, bx),
                "source": "PyResearch YOLOv12 (70% Weight)",
            })
        return selected
    except Exception as e:
        print(f"[AI INFER] PyResearch warning: {e}", flush=True)
        return []


def predict_segmentation_potholes(img: np.ndarray, conf_thresh: float, iou_thresh: float) -> List[dict]:
    """Run keremberke YOLOv8n instance segmentation with smooth convex contour extraction."""
    seg_engine = get_segmentation_engine()
    if seg_engine is None:
        return []

    h, w = img.shape[:2]
    results = []
    try:
        seg_res = seg_engine.predict(img, conf=max(0.20, conf_thresh * 0.8), iou=iou_thresh, verbose=False)[0]
        if seg_res.boxes is not None:
            boxes_np = seg_res.boxes.xyxy.cpu().numpy()
            confs_np = seg_res.boxes.conf.cpu().numpy()
            masks_xy = seg_res.masks.xy if seg_res.masks is not None else []
            for i, bx in enumerate(boxes_np):
                bw, bh = bx[2] - bx[0], bx[3] - bx[1]
                if bw < 6 or bh < 6 or (bw / w > 0.85) or (bh / h > 0.85):
                    continue
                poly = None
                if i < len(masks_xy) and len(masks_xy[i]) >= 3:
                    poly = _points_to_simple_hull_pct(np.array(masks_xy[i], dtype=np.float32), w, h)
                bx_list = [float(x) for x in bx]
                results.append({
                    "box": bx_list,
                    "conf": float(confs_np[i]),
                    "poly": poly or extract_defect_polygon(img, bx_list),
                    "matched": False,
                    "source": "YOLOv8-Seg (70% Weight)",
                })
    except Exception as e:
        print(f"[AI INFER] Segmentation pass warning: {e}", flush=True)
    return results


def evaluate_depth(img: np.ndarray, box: tuple) -> str:
    """Estimate surface cavity depth from central luminance depression."""
    x1, y1, x2, y2 = [int(v) for v in box]
    h, w = img.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    if (x2 - x1) < 12 or (y2 - y1) < 12:
        return "Medium"

    roi = img[y1:y2, x1:x2]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    rh, rw = gray.shape
    center_core = gray[int(rh * 0.25) : int(rh * 0.75), int(rw * 0.25) : int(rw * 0.75)]
    if center_core.size == 0:
        return "Medium"
    mean_core = float(np.mean(center_core))
    mean_border = float(np.mean(gray[: max(1, int(rh * 0.15)), :]) + np.mean(gray[int(rh * 0.85) :, :])) / 2.0
    contrast_diff = mean_border - mean_core
    if contrast_diff > 16:
        return "Deep"
    if contrast_diff > 5:
        return "Medium"
    return "Shallow"


def _is_false_pothole_surface(
    bx: List[float],
    conf_val: float,
    votes: int,
    img: np.ndarray,
    gray_img: np.ndarray,
    hsv_img: np.ndarray,
    obstacles: List[List[float]],
) -> bool:
    """Reject vehicles, pedestrians, sky bands, dashboards, and bright wooden sticks/debris."""
    h, w = img.shape[:2]
    bw = max(1.0, bx[2] - bx[0])
    bh = max(1.0, bx[3] - bx[1])
    cx = (bx[0] + bx[2]) / 2.0
    cy = (bx[1] + bx[3]) / 2.0

    # 1. Semantic obstacle shield (cars, SUVs, bikes, pedestrians, signs)
    if overlaps_obstacle(bx, obstacles):
        return True

    # 2. Extreme upper horizon / sky / distant banner rejection
    if cy < (h * 0.04) or bx[1] < (h * 0.01):
        return True
    if cy < (h * 0.30) and ((bw / w > 0.48) or (bh / h > 0.42)):
        return True

    # 3. Realistic geometry & dashboard hood bar guard (while allowing large foreground craters <= 85%)
    aspect = max(bw / bh, bh / bw)
    if aspect > 8.5:
        return True
    if (bw / w > 0.86) or (bh / h > 0.86):
        return True
    if bx[3] > (h * 0.95) and (bw / w > 0.80):
        return True
    if (bw / w > 0.85) and (bh / h < 0.03):
        return True

    x1_c, y1_c = int(max(0, bx[0])), int(max(0, bx[1]))
    x2_c, y2_c = int(min(w, bx[2])), int(min(h, bx[3]))
    if (x2_c - x1_c) < 6 or (y2_c - y1_c) < 6:
        return True

    # 4. Painted vehicle surface / colorful sign check in upper corridor
    patch_hsv = hsv_img[y1_c:y2_c, x1_c:x2_c]
    patch_sat = float(np.mean(patch_hsv[:, :, 1]))
    if cy < (h * 0.38) and patch_sat > 110.0:
        return True

    # 5. Bright bottom-edge vehicle hood glare, raised twigs/debris, & flat crack-tile checks
    roi_gray = gray_img[y1_c:y2_c, x1_c:x2_c]
    rh, rw = roi_gray.shape
    if bx[3] > (h * 0.96) and aspect > 2.2 and (
        float(np.mean(roi_gray)) > 185.0 or (bx[3] > h * 0.98 and float(np.percentile(roi_gray, 80)) > 210.0)
    ):
        return True  # Bright white vehicle roof/hood clipped at bottom frame edge
    core = roi_gray[int(rh * 0.25) : int(rh * 0.75), int(rw * 0.25) : int(rw * 0.75)]
    if core.size > 0 and rh >= 4:
        core_mean = float(np.mean(core))
        border_mean = float(
            np.mean(roi_gray[: max(1, int(rh * 0.15)), :]) + np.mean(roi_gray[int(rh * 0.85) :, :])
        ) / 2.0
        patch_hue = float(np.mean(patch_hsv[:, :, 0]))

        # Bright warm wood/twig/cardboard sitting on dark pavement (uncorroborated strip)
        if votes <= 1 and conf_val < 0.65 and aspect >= 2.1:
            if (core_mean - border_mean) > 8.0 and patch_sat > 35.0 and (5.0 <= patch_hue <= 32.0):
                return True

        # Low-confidence uncorroborated flat bright dry/clay glare (preserves darker waterlogged puddles)
        if conf_val < 0.28 and votes <= 1 and (border_mean - core_mean) < -12.0 and patch_sat > 55.0:
            return True

    return False


@router.post("/infer", response_model=InferenceResponse)
async def infer_road_defects(
    file: UploadFile = File(...),
    conf_thresh: float = Query(0.28, ge=0.05, le=0.95),
    iou_thresh: float = Query(0.35, ge=0.1, le=0.9),
):
    """Run real-time 70/30 ensemble road defect inference with semantic obstacle exclusion."""
    start_t = time.perf_counter()
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            try:
                import io
                from PIL import Image

                pil_img = Image.open(io.BytesIO(contents)).convert("RGB")
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Unsupported image file format: {str(e)}")

        if img is None or img.size == 0:
            raise HTTPException(status_code=400, detail="Invalid or unreadable image file format")

        h, w = img.shape[:2]
        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        engine = get_authoritative_engine(conf_thresh=max(0.16, conf_thresh * 0.65), iou_thresh=iou_thresh)
        if engine is None:
            raise HTTPException(status_code=503, detail="No trained YOLO11n ONNX model found in runs/export/.")

        # 0. Semantic Scene Exclusion (people, cars, bikes, trucks, stop signs)
        obstacles = detect_non_road_obstacles(img, conf_thresh=0.23)

        # 1. 70% Weightage Models (D-FINE Large + PyResearch YOLOv12 + keremberke YOLOv8-Seg)
        dfine_boxes = predict_dfine_potholes(img, conf_thresh=max(0.24, conf_thresh * 0.85))
        pyres_boxes = predict_pyresearch_potholes(img, conf_thresh=max(0.22, conf_thresh * 0.80))
        seg_boxes = predict_segmentation_potholes(img, conf_thresh=conf_thresh, iou_thresh=iou_thresh)

        new_70_candidates = []
        all_70_raw = sorted(
            [c for c in (dfine_boxes + pyres_boxes + seg_boxes) if not overlaps_obstacle(c["box"], obstacles)],
            key=lambda x: x["conf"],
            reverse=True,
        )
        for cand in all_70_raw:
            matched = False
            for ec in new_70_candidates:
                if compute_iou_xyxy(cand["box"], ec["box"]) > 0.35:
                    ec["conf"] = max(ec["conf"], cand["conf"])
                    ec["votes"] += 1
                    if "YOLOv8-Seg" in cand.get("source", "") and cand.get("poly"):
                        c_area = (cand["box"][2] - cand["box"][0]) * (cand["box"][3] - cand["box"][1])
                        e_area = (ec["box"][2] - ec["box"][0]) * (ec["box"][3] - ec["box"][1])
                        if c_area <= e_area * 1.4:
                            ec["poly"] = cand["poly"]
                    ec["source"] = "Ensemble (70% D-FINE/PyResearch/Seg)"
                    matched = True
                    break
            if not matched:
                cand_copy = dict(cand)
                cand_copy["matched"] = False
                cand_copy["votes"] = 1
                new_70_candidates.append(cand_copy)

        # 2. 30% Calibrated Edge Engine (YOLO11n unified multi-condition pothole class only)
        raw_potholes = [
            p
            for p in engine.predict(img)
            if (getattr(p, "class_id", 0) == 0 or "POTHOLE" in str(getattr(p, "class_name", "")).upper())
        ]
        base_boxes = [
            {
                "box": [float(x) for x in p.bbox_xyxy],
                "conf": float(p.confidence),
                "matched": False,
            }
            for p in raw_potholes
            if not overlaps_obstacle([float(x) for x in p.bbox_xyxy], obstacles)
        ]

        # 3. 70/30 Mathematical Ensemble Fusion
        fused_potholes = []
        for nb in new_70_candidates:
            best_b, best_score = None, 0.0
            nb_area = max(1.0, (nb["box"][2] - nb["box"][0]) * (nb["box"][3] - nb["box"][1]))
            for bb in base_boxes:
                if bb["matched"]:
                    continue
                bb_area = max(1.0, (bb["box"][2] - bb["box"][0]) * (bb["box"][3] - bb["box"][1]))
                iou = compute_iou_xyxy(nb["box"], bb["box"])
                iom = compute_iom_xyxy(nb["box"], bb["box"])
                area_ratio = min(nb_area, bb_area) / max(nb_area, bb_area)
                if iou > 0.20 or (iom > 0.60 and area_ratio > 0.35):
                    score = iou + 0.3 * iom
                    if score > best_score:
                        best_score, best_b = score, bb

            if best_b is not None:
                nb["matched"] = True
                best_b["matched"] = True
                total_votes = nb["votes"] + 1
                cf = 0.70 * nb["conf"] + 0.30 * best_b["conf"]
                if total_votes >= 3:
                    cf = min(0.96, cf * 1.15)
                elif total_votes == 2:
                    cf = min(0.94, cf * 1.10)

                bb_area = max(1.0, (best_b["box"][2] - best_b["box"][0]) * (best_b["box"][3] - best_b["box"][1]))
                shrunk_to_base = (bb_area < nb_area * 0.80) and (bb_area >= nb_area * 0.35)
                bx = best_b["box"] if shrunk_to_base else (nb["box"] if nb_area < bb_area * 0.80 else [
                    min(nb["box"][0], best_b["box"][0]),
                    min(nb["box"][1], best_b["box"][1]),
                    max(nb["box"][2], best_b["box"][2]),
                    max(nb["box"][3], best_b["box"][3]),
                ])
                if cf >= conf_thresh:
                    bx_x1p, bx_y1p = (bx[0] / w) * 100, (bx[1] / h) * 100
                    bx_x2p, bx_y2p = (bx[2] / w) * 100, (bx[3] / h) * 100
                    raw_poly = extract_defect_polygon(img, bx) if shrunk_to_base else (nb.get("poly") or extract_defect_polygon(img, bx))
                    clipped_poly = [
                        [round(float(min(bx_x2p, max(bx_x1p, px))), 2), round(float(min(bx_y2p, max(bx_y1p, py))), 2)]
                        for px, py in raw_poly
                    ]
                    fused_potholes.append({
                        "box": bx,
                        "conf": cf,
                        "votes": total_votes,
                        "poly": clipped_poly,
                        "source": "Ensemble (70% D-FINE/PyResearch/Seg + 30% Base)",
                    })
            else:
                # Unmatched 70% candidate: gate noisy solo D-FINE/Seg strictly while honoring multi-vote & clean PyResearch
                src_name = str(nb.get("source", ""))
                if nb["votes"] >= 2:
                    min_single = max(0.22, conf_thresh * 0.80)
                    cf = min(0.94, 0.92 * nb["conf"])
                elif "PyResearch" in src_name:
                    min_single = max(0.25, conf_thresh * 0.95)
                    cf = min(0.90, 0.88 * nb["conf"])
                else:
                    min_single = max(0.42, conf_thresh + 0.14)
                    cf = min(0.90, 0.85 * nb["conf"])
                if nb["conf"] >= min_single and cf >= max(0.24, conf_thresh * 0.90):
                    fused_potholes.append({
                        "box": nb["box"],
                        "conf": cf,
                        "votes": nb["votes"],
                        "poly": nb.get("poly") or extract_defect_polygon(img, nb["box"]),
                        "source": src_name or "70% New Models",
                    })

        for bb in base_boxes:
            if not bb["matched"]:
                # Calibrated YOLO11n FP32 has 0/26 clean-road FPs; retain valid solo potholes above threshold
                if bb["conf"] >= max(0.24, conf_thresh * 0.92):
                    cf = round(min(0.92, bb["conf"] * 1.02), 4)
                    if cf >= max(0.25, conf_thresh * 0.95):
                        fused_potholes.append({
                            "box": bb["box"],
                            "conf": cf,
                            "votes": 1,
                            "poly": extract_defect_polygon(img, bb["box"]),
                            "source": "YOLO11n (Unified Multi-Condition)",
                        })

        # Sort high-confidence/high-consensus first and strictly deduplicate nested overlaps
        fused_potholes.sort(key=lambda item: (item["votes"], item["conf"]), reverse=True)
        dedup_potholes = []
        for d in fused_potholes:
            bx = d["box"]
            if _is_false_pothole_surface(bx, d["conf"], d["votes"], img, gray_img, hsv_img, obstacles):
                continue
            if any(
                compute_iou_xyxy(bx, prev["box"]) > 0.30 or compute_iom_xyxy(bx, prev["box"]) > 0.55
                for prev in dedup_potholes
            ):
                continue
            dedup_potholes.append(d)

        detections: List[DetectionBox] = []
        accepted_pothole_boxes: List[List[float]] = []

        for d in dedup_potholes:
            bx = d["box"]
            bw = max(1.0, bx[2] - bx[0])
            bh = max(1.0, bx[3] - bx[1])
            cx = (bx[0] + bx[2]) / 2.0
            cx_norm = cx / float(w)
            wheel_path_risk = bool((0.16 <= cx_norm <= 0.36) or (0.64 <= cx_norm <= 0.84))
            depth_indicator = evaluate_depth(img, tuple(bx))

            area_px = int(bw * bh)
            area_ratio = area_px / max(1, w * h)
            score = min(
                100,
                max(
                    15,
                    45
                    + min(40, int(area_ratio * 400))
                    + (10 if wheel_path_risk else 0)
                    + (10 if depth_indicator == "Deep" else (5 if depth_indicator == "Medium" else 0)),
                ),
            )
            severity = "Critical" if score >= 70 else ("Severe" if score >= 50 else "Moderate")
            action = "Immediate 24-hour asphalt compaction and sealing"
            if wheel_path_risk:
                action += " (active wheel-path hazard)"

            accepted_pothole_boxes.append(bx)
            detections.append(
                DetectionBox(
                    id=f"det-{len(detections) + 1}",
                    label="POTHOLE",
                    confidence=round(float(d["conf"]), 3),
                    box=[round((bx[0] / w) * 100, 1), round((bx[1] / h) * 100, 1), round((bw / w) * 100, 1), round((bh / h) * 100, 1)],
                    polygon=d["poly"],
                    severity=severity,
                    score=score,
                    areaPx=area_px,
                    action=action,
                    wheel_path_risk=wheel_path_risk,
                    depth_indicator=depth_indicator,
                    model_source=d["source"],
                )
            )

        # 4. Multi-class Crack Detection (RDD2022 Distress Multi-Class)
        crack_floor = max(0.30, conf_thresh)
        crack_engine = get_crack_engine(conf_thresh=crack_floor, iou_thresh=iou_thresh)
        raw_cracks = crack_engine.predict(img) if crack_engine else []

        valid_cracks = []
        for c in raw_cracks:
            raw_cls = getattr(c, "class_name", "").upper()
            if "CRACK" not in raw_cls:
                continue

            bx = [float(v) for v in c.bbox_xyxy]
            bw = max(1.0, bx[2] - bx[0])
            bh = max(1.0, bx[3] - bx[1])
            cy = (bx[1] + bx[3]) / 2.0

            # Exclude upper-horizon false alarms, obstacles, and oversized low-conf zones
            if cy < (h * 0.35):
                continue
            if overlaps_obstacle(bx, obstacles, iom_thresh=0.18):
                continue
            if (bw / w > 0.65) and (bh / h > 0.45) and float(c.confidence) < 0.55:
                continue
            if (bw / w > 0.92) and (bh / h > 0.85):
                continue

            x1_c, y1_c = int(max(0, bx[0])), int(max(0, bx[1]))
            x2_c, y2_c = int(min(w, bx[2])), int(min(h, bx[3]))
            if (x2_c > x1_c + 4) and (y2_c > y1_c + 4):
                patch_sat = float(np.mean(hsv_img[y1_c:y2_c, x1_c:x2_c, 1]))
                if cy < (h * 0.45) and patch_sat > 110.0:
                    continue

            # Suppress cracks overlapping OR trapped inside an authoritative pothole crater
            if any(
                compute_iou_xyxy(bx, p_bx) > 0.25 or compute_iom_xyxy(bx, p_bx) > 0.40
                for p_bx in accepted_pothole_boxes
            ):
                continue

            valid_cracks.append({
                "label": raw_cls,
                "confidence": float(c.confidence),
                "box": bx,
            })

        # Iterative clustering for nearby/overlapping crack distress zones
        crack_clusters = [[vc] for vc in valid_cracks]
        merged = True
        while merged:
            merged = False
            new_clusters = []
            used = [False] * len(crack_clusters)
            for i in range(len(crack_clusters)):
                if used[i]:
                    continue
                c1 = crack_clusters[i]
                for j in range(i + 1, len(crack_clusters)):
                    if used[j]:
                        continue
                    c2 = crack_clusters[j]
                    has_overlap = any(
                        compute_iou_xyxy(b1["box"], b2["box"]) > 0.10
                        or compute_iom_xyxy(b1["box"], b2["box"]) > 0.25
                        for b1 in c1
                        for b2 in c2
                    )
                    if has_overlap:
                        c1.extend(c2)
                        used[j] = True
                        merged = True
                new_clusters.append(c1)
            crack_clusters = new_clusters

        for cl in crack_clusters:
            min_x = min(m["box"][0] for m in cl)
            min_y = min(m["box"][1] for m in cl)
            max_x = max(m["box"][2] for m in cl)
            max_y = max(m["box"][3] for m in cl)
            max_conf = max(m["confidence"] for m in cl)

            has_alligator = any("ALLIGATOR" in m["label"] for m in cl) or len(cl) >= 2
            final_label = "CRACK_ALLIGATOR" if has_alligator else cl[0]["label"]

            bw = max(1.0, max_x - min_x)
            bh = max(1.0, max_y - min_y)
            cx_norm = ((min_x + max_x) / 2.0) / float(w)
            wheel_path_risk = bool((0.16 <= cx_norm <= 0.36) or (0.64 <= cx_norm <= 0.84))

            area_px = int(bw * bh)
            area_ratio = area_px / max(1, w * h)
            is_alligator = "ALLIGATOR" in final_label
            score = min(100, max(15, (40 if is_alligator else 25) + min(35, int(area_ratio * 300)) + (8 if wheel_path_risk else 0)))
            severity = "Critical" if score >= 70 else ("Severe" if score >= 45 else "Moderate")
            action = (
                "Pavement milling and asphalt resurfacing overlay (fatigue cracking)"
                if is_alligator
                else "Hot-pour rubberized bitumen crack sealing"
            )

            detections.append(
                DetectionBox(
                    id=f"det-{len(detections) + 1}",
                    label=final_label,
                    confidence=round(float(max_conf), 3),
                    box=[round((min_x / w) * 100, 1), round((min_y / h) * 100, 1), round((bw / w) * 100, 1), round((bh / h) * 100, 1)],
                    polygon=extract_defect_polygon(img, [min_x, min_y, max_x, max_y]),
                    severity=severity,
                    score=score,
                    areaPx=area_px,
                    action=action,
                    wheel_path_risk=wheel_path_risk,
                    depth_indicator="Shallow",
                    model_source="RDD2022 Distress Multi-Class",
                )
            )

        pothole_cnt = sum(1 for d in detections if "POTHOLE" in d.label)
        crack_cnt = sum(1 for d in detections if "CRACK" in d.label)

        max_severity = "Minor"
        if any(d.severity == "Critical" for d in detections):
            max_severity = "Critical"
        elif any(d.severity == "Severe" for d in detections):
            max_severity = "Severe"
        elif len(detections) > 0:
            max_severity = "Moderate"

        overall_health = max(10, 100 - len(detections) * 12) if detections else 100
        latency_ms = round((time.perf_counter() - start_t) * 1000, 1)

        return InferenceResponse(
            status="success",
            image_width=w,
            image_height=h,
            total_defects=len(detections),
            pothole_count=pothole_cnt,
            crack_count=crack_cnt,
            max_severity=max_severity,
            overall_health_score=overall_health,
            detections=detections,
            engine="70/30 Hybrid Ensemble (D-FINE + YOLOv12 + YOLOv8-Seg / YOLO11n-INT8)",
            latency_ms=latency_ms,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@router.get("/models/evaluation", summary="Get Model Evaluation Metrics")
async def get_model_evaluation():
    """Retrieve full AI model evaluation metrics, confusion matrix, calibration, and failure cases."""
    import json

    metrics_path = "ml/runs/metrics.json"
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Model evaluation metrics not generated yet.")
    with open(metrics_path, encoding="utf-8") as f:
        data = json.load(f)
    return data
