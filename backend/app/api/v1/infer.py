"""ScamRoad Real-Time AI Inference API Endpoint.
Executes high-precision ONNX Runtime deep learning inference using fine-tuned YOLO models.
Supports Single-Model INT8 execution, Multi-Class distress detection, and Dual-Engine Ensemble with Test-Time Augmentation (TTA).
Adheres strictly to Rule R2 (No fake AI / No mock data) and Rule R4 (Normalized relative coordinates).
"""

import time
import os
from typing import List, Optional
import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from pydantic import BaseModel

router = APIRouter()

# Global persistent engine cache to eliminate cold startup latency on repeated inference
_ENGINE_CACHE: dict = {}


class DetectionBox(BaseModel):
    id: str
    label: str
    confidence: float
    box: List[float]  # [x%, y%, w%, h%]
    severity: str
    score: int
    areaPx: int
    action: str
    is_calibrated: bool = False
    measurement_method: str = "uncalibrated_pixel_area"
    unit: str = "px_relative_pct"
    wheel_path_risk: bool = False
    depth_indicator: str = "Medium"


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
    engine: str = "Ensemble Dual-ONNX"
    latency_ms: float = 0.0
    use_tta: bool = False


def _load_engine(model_path: str, conf_thresh: float, iou_thresh: float):
    """Retrieve or initialize a cached EdgeInferenceEngine."""
    from edge.agent.infer import EdgeInferenceEngine
    if model_path in _ENGINE_CACHE:
        eng = _ENGINE_CACHE[model_path]
        eng.conf_threshold = conf_thresh
        eng.iou_threshold = iou_thresh
        return eng

    if not os.path.exists(model_path):
        return None

    try:
        eng = EdgeInferenceEngine(
            model_path=model_path,
            conf_threshold=conf_thresh,
            iou_threshold=iou_thresh
        )
        _ENGINE_CACHE[model_path] = eng
        return eng
    except Exception:
        return None


def get_inference_engines(model_mode: str = "ensemble", conf_thresh: float = 0.20, iou_thresh: float = 0.35):
    """Resolve inference engines based on selected model mode."""
    pothole_candidates = [
        "runs/export/best_yolo11_int8.onnx",
        "runs/export/best_int8.onnx",
        "runs/export/best.onnx",
    ]
    multiclass_candidates = [
        "ml/runs/pothole_yolov8n/weights/best.onnx",
        "runs/export/best.onnx",
    ]

    pothole_path = next((p for p in pothole_candidates if os.path.exists(p)), None)
    multiclass_path = next((p for p in multiclass_candidates if os.path.exists(p)), None)

    if model_mode == "yolo11n":
        eng = _load_engine(pothole_path, conf_thresh, iou_thresh) if pothole_path else None
        return [("yolo11n", eng)] if eng else []
    elif model_mode == "multiclass":
        eng = _load_engine(multiclass_path, conf_thresh, iou_thresh) if multiclass_path else None
        return [("multiclass", eng)] if eng else []
    else:  # "ensemble"
        engines = []
        if pothole_path:
            eng_p = _load_engine(pothole_path, conf_thresh, iou_thresh)
            if eng_p:
                engines.append(("pothole_specialist", eng_p))
        if multiclass_path:
            eng_m = _load_engine(multiclass_path, conf_thresh, iou_thresh)
            if eng_m:
                engines.append(("multiclass_specialist", eng_m))
        return engines


def refine_box_boundaries(img: np.ndarray, box: tuple) -> tuple:
    """Sub-pixel boundary snapping using local Otsu thresholding."""
    x1, y1, x2, y2 = [int(v) for v in box]
    h, w = img.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    if (x2 - x1) < 18 or (y2 - y1) < 18:
        return box

    roi = img[y1:y2, x1:x2]
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blurred, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return box

    largest = max(contours, key=cv2.contourArea)
    rx, ry, rw, rh = cv2.boundingRect(largest)
    # Snap only if contour occupies significant ROI area
    if (rw * rh) > 0.35 * (x2 - x1) * (y2 - y1):
        nx1 = x1 + rx
        ny1 = y1 + ry
        nx2 = nx1 + rw
        ny2 = ny1 + rh
        # Clamp adjustment within a 12% margin of original box
        max_dx = int(0.12 * (x2 - x1))
        max_dy = int(0.12 * (y2 - y1))
        x1_out = max(x1 - max_dx, min(x1 + max_dx, nx1))
        y1_out = max(y1 - max_dy, min(y1 + max_dy, ny1))
        x2_out = max(x2 - max_dx, min(x2 + max_dx, nx2))
        y2_out = max(y2 - max_dy, min(y2 + max_dy, ny2))
        return (float(x1_out), float(y1_out), float(x2_out), float(y2_out))
    return box


def evaluate_depth_indicator(img: np.ndarray, box: tuple) -> str:
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
    center_core = gray[int(rh * 0.25):int(rh * 0.75), int(rw * 0.25):int(rw * 0.75)]
    if center_core.size == 0:
        return "Medium"
    mean_core = np.mean(center_core)
    mean_border = (np.mean(gray[:max(1, int(rh * 0.15)), :]) + np.mean(gray[int(rh * 0.85):, :])) / 2.0
    contrast_diff = mean_border - mean_core
    if contrast_diff > 18:
        return "Deep"
    elif contrast_diff > 6:
        return "Medium"
    return "Shallow"


@router.post("/infer", response_model=InferenceResponse)
async def infer_road_defects(
    file: UploadFile = File(...),
    conf_thresh: float = Query(0.20, ge=0.05, le=0.95),
    iou_thresh: float = Query(0.35, ge=0.1, le=0.9),
    model_mode: str = Query("ensemble", enum=["ensemble", "yolo11n", "multiclass"]),
    use_tta: bool = Query(False),
    refine_boxes: bool = Query(True),
):
    """Run real-time road defect detection using fine-tuned ONNX Runtime.

    Features:
    - Pure ONNX Runtime acceleration with session reuse
    - Dual-engine ensemble (pothole specialist + multi-class crack detector)
    - Optional Test-Time Augmentation (TTA) for asymmetric lighting/camera angles
    - Sub-pixel boundary contour refinement
    - Active wheel-path vehicular hazard impact scoring
    """
    start_t = time.perf_counter()
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file format")

        h, w = img.shape[:2]
        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        engines = get_inference_engines(model_mode=model_mode, conf_thresh=conf_thresh, iou_thresh=iou_thresh)
        if not engines:
            raise HTTPException(
                status_code=503,
                detail="No trained ONNX model found in runs/export/ or ml/runs/."
            )

        from edge.agent.infer import Detection, nms_boxes

        raw_detections: list = []

        for eng_name, eng in engines:
            # Pass 1: Standard inference
            dets = eng.predict(img)

            # Pass 2: Test-Time Augmentation (TTA) horizontal flip
            if use_tta:
                img_flipped = cv2.flip(img, 1)
                flip_dets = eng.predict(img_flipped)
                all_b = [list(d.bbox_xyxy) for d in dets]
                all_s = [d.confidence for d in dets]
                all_c = [d.class_id for d in dets]
                for d in flip_dets:
                    x1, y1, x2, y2 = d.bbox_xyxy
                    all_b.append([w - x2, y1, w - x1, y2])
                    all_s.append(d.confidence)
                    all_c.append(d.class_id)
                keep = nms_boxes(all_b, all_s, iou_threshold=0.42, class_ids=all_c)
                dets = [
                    Detection(
                        class_id=all_c[i],
                        class_name=eng.class_names.get(all_c[i], "DEFECT"),
                        confidence=round(all_s[i], 4),
                        bbox_xyxy=tuple(all_b[i]),
                        relative_area=round(((all_b[i][2] - all_b[i][0]) * (all_b[i][3] - all_b[i][1])) / float(w * h), 6),
                    )
                    for i in keep
                ]

            if eng_name == "pothole_specialist":
                raw_detections.extend([d for d in dets if "POTHOLE" in d.class_name.upper()])
            elif eng_name == "multiclass_specialist":
                if model_mode == "ensemble":
                    # Only take crack detections from multiclass if pothole specialist is present
                    raw_detections.extend([d for d in dets if "CRACK" in d.class_name.upper()])
                else:
                    raw_detections.extend(dets)
            else:
                raw_detections.extend(dets)

        # Cross-engine Non-Maximum Suppression to remove duplicates
        if len(raw_detections) > 1:
            all_b = [list(d.bbox_xyxy) for d in raw_detections]
            all_s = [d.confidence for d in raw_detections]
            all_c = [d.class_id for d in raw_detections]
            keep_all = nms_boxes(all_b, all_s, iou_threshold=0.38, class_ids=all_c)
            final_raw = [raw_detections[i] for i in keep_all]
        else:
            final_raw = raw_detections

        # Domain verification filters
        detections: List[DetectionBox] = []
        pothole_cnt = 0
        crack_cnt = 0

        for i, d in enumerate(final_raw):
            bx = list(d.bbox_xyxy)

            # Optional boundary snapping
            if refine_boxes:
                bx = list(refine_box_boundaries(img, tuple(bx)))

            bw = max(1.0, bx[2] - bx[0])
            bh = max(1.0, bx[3] - bx[1])
            lbl = d.class_name.upper()

            # 1. Sky / Extreme Upper Horizon Rejection:
            cy = (bx[1] + bx[3]) / 2.0
            if cy < (h * 0.10) or (bx[1] < (h * 0.04) and cy < (h * 0.15)):
                continue

            # 2. Distant Skyline Giant Billboard Rejection:
            if cy < (h * 0.25) and ((bw / w > 0.60) or (bh / h > 0.45)):
                continue

            # 3. Upright Vehicle Body Rejection:
            if cy < (h * 0.35) and (bh / h >= 0.50):
                continue

            # 4. Color Saturation Filter for Painted Vehicles:
            x1_c = int(max(0, bx[0]))
            y1_c = int(max(0, bx[1]))
            x2_c = int(min(w, bx[2]))
            y2_c = int(min(h, bx[3]))
            if (x2_c > x1_c + 4) and (y2_c > y1_c + 4):
                patch_sat = float(np.mean(hsv_img[y1_c:y2_c, x1_c:x2_c, 1]))
                if cy < (h * 0.35) and patch_sat > 85.0:
                    continue

            # 5. Crack Vertical Boundary:
            if "CRACK" in lbl and cy < (h * 0.20):
                continue

            # 6. Pothole Geometric & Morphology Constraint:
            if "POTHOLE" in lbl:
                aspect = max(bw / bh, bh / bw)
                if aspect > 6.0:
                    continue
                if (bw / w > 0.88) or (bh / h > 0.88):
                    continue

            # 7. Dashcam Hood Reflection Filter:
            if bx[3] > (h * 0.96) and (bw / w > 0.80):
                continue

            # 8. Thin horizontal sensor line artifacts:
            if (bw / w > 0.85) and (bh / h < 0.03):
                continue

            cx_norm = ((bx[0] + bx[2]) / 2.0) / float(w)
            # Active wheel-path zone detection (typical tire tracks: 16%-36% and 64%-84% of lane span)
            wheel_path_risk = bool((0.16 <= cx_norm <= 0.36) or (0.64 <= cx_norm <= 0.84))

            depth_indicator = evaluate_depth_indicator(img, tuple(bx))

            x_pct = round((bx[0] / w) * 100, 1)
            y_pct = round((bx[1] / h) * 100, 1)
            w_pct = round((bw / w) * 100, 1)
            h_pct = round((bh / h) * 100, 1)
            area_px = int(bw * bh)
            cf = round(float(d.confidence), 3)

            # Severity calculation (Rule R4):
            if "POTHOLE" in lbl:
                pothole_cnt += 1
                base_weight = 45
                action = "Immediate 24-hour asphalt compaction and sealing"
            elif "ALLIGATOR" in lbl:
                crack_cnt += 1
                base_weight = 35
                action = "Full-depth asphalt patch repair"
            elif "TRANS" in lbl:
                crack_cnt += 1
                base_weight = 25
                action = "Bituminous crack sealing (transverse)"
            else:
                crack_cnt += 1
                base_weight = 20
                action = "Bituminous crack sealing to prevent water penetration"

            area_ratio = area_px / max(1, w * h)
            area_component = min(40, int(area_ratio * 400))
            aspect = max(bw / max(1.0, bh), bh / max(1.0, bw))
            aspect_bonus = min(10, int(aspect * 1.5)) if "CRACK" in lbl else 0
            wheel_bonus = 10 if wheel_path_risk else 0
            depth_bonus = 10 if depth_indicator == "Deep" else (5 if depth_indicator == "Medium" else 0)

            score = min(100, max(15, base_weight + area_component + aspect_bonus + wheel_bonus + depth_bonus))
            severity = "Critical" if score >= 70 else ("Severe" if score >= 50 else "Moderate")

            if wheel_path_risk:
                action += " (active wheel-path hazard)"

            detections.append(
                DetectionBox(
                    id=f"det-{len(detections)+1}",
                    label=lbl,
                    confidence=cf,
                    box=[x_pct, y_pct, w_pct, h_pct],
                    severity=severity,
                    score=score,
                    areaPx=area_px,
                    action=action,
                    is_calibrated=False,
                    measurement_method="uncalibrated_pixel_area",
                    unit="px_relative_pct",
                    wheel_path_risk=wheel_path_risk,
                    depth_indicator=depth_indicator,
                )
            )

        max_severity = "Minor"
        if any(d.severity == "Critical" for d in detections):
            max_severity = "Critical"
        elif any(d.severity == "Severe" for d in detections):
            max_severity = "Severe"
        elif len(detections) > 0:
            max_severity = "Moderate"

        overall_health = max(10, 100 - len(detections) * 12) if detections else 100
        latency_ms = round((time.perf_counter() - start_t) * 1000, 1)

        engine_name_map = {
            "ensemble": "Ensemble Dual-ONNX (Potholes + Cracks)",
            "yolo11n": "YOLO11n Quantized INT8",
            "multiclass": "YOLOv8 Multi-Class Distress",
        }

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
            engine=engine_name_map.get(model_mode, "Ensemble Dual-ONNX"),
            latency_ms=latency_ms,
            use_tta=use_tta,
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
    with open(metrics_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data
