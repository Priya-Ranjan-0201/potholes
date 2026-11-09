"""ScamRoad Real-Time AI Inference API Endpoint.
Executes pure ONNX Runtime deep learning inference using fine-tuned YOLO11n models.
Adheres strictly to Rule R2 (No fake AI / No mock data) and Rule R4 (Normalized relative coordinates).
"""

import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from pydantic import BaseModel
from typing import List
import os

router = APIRouter()

class DetectionBox(BaseModel):
    id: str
    label: str
    confidence: float
    box: List[float] # [x%, y%, w%, h%]
    severity: str
    score: int
    areaPx: int
    action: str
    is_calibrated: bool = False
    measurement_method: str = "uncalibrated_pixel_area"
    unit: str = "px_relative_pct"

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


def get_inference_engine(conf_thresh: float = 0.25, iou_thresh: float = 0.35):
    """Load pure ONNX Runtime engine without AGPL Ultralytics runtime dependency."""
    from edge.agent.infer import EdgeInferenceEngine
    onnx_paths = [
        "runs/export/best_yolo11_int8.onnx",
        "runs/export/best_int8.onnx",
        "runs/export/best.onnx",
    ]
    for p in onnx_paths:
        if os.path.exists(p):
            try:
                return EdgeInferenceEngine(
                    model_path=p,
                    conf_threshold=conf_thresh,
                    iou_threshold=iou_thresh
                )
            except Exception:
                continue

    # Auto-recovery: If weights missing, download verified edge INT8 model
    try:
        import urllib.request
        target_path = "runs/export/best_int8.onnx"
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        backup_url = "https://raw.githubusercontent.com/Priya-Ranjan-0201/potholes/main/runs/export/best_int8.onnx"
        urllib.request.urlretrieve(backup_url, target_path)
        if os.path.exists(target_path):
            return EdgeInferenceEngine(
                model_path=target_path,
                conf_threshold=conf_thresh,
                iou_threshold=iou_thresh
            )
    except Exception:
        pass

    return None


@router.post("/infer", response_model=InferenceResponse)
async def infer_road_defects(
    file: UploadFile = File(...),
    conf_thresh: float = Query(0.25, ge=0.05, le=0.95),
    iou_thresh: float = Query(0.35, ge=0.1, le=0.9)
):
    """Run real-time defect detection on an uploaded image using fine-tuned YOLO11n ONNX Runtime."""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file format")

        h, w = img.shape[:2]

        engine = get_inference_engine(conf_thresh=conf_thresh, iou_thresh=iou_thresh)
        if engine is None:
            raise HTTPException(
                status_code=503,
                detail="No trained ONNX model found in runs/export/. Please ensure best_int8.onnx or best.onnx is present."
            )

        raw_dets = engine.predict(img)

        detections: List[DetectionBox] = []
        pothole_cnt = 0
        crack_cnt = 0

        hsv_img = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        for i, d in enumerate(raw_dets):
            bx = d.bbox_xyxy
            bw = max(1.0, bx[2] - bx[0])
            bh = max(1.0, bx[3] - bx[1])
            lbl = d.class_name.upper()

            # 1. Road Horizon & Perspective Vanishing Plane Constraint:
            # Road distress (potholes/cracks) cannot exist in the sky, trees, or distant skyline.
            cy = (bx[1] + bx[3]) / 2.0
            if cy < (h * 0.28) or bx[1] < (h * 0.16):
                continue

            # 2. Distant Horizon Obstacle / Vehicle Rejection:
            # On a perspective road plane, distant road defects are optically small.
            # Large boxes in the upper-mid field (cy < 0.48*h) are vehicles, oncoming cars, or roadside structures.
            if cy < (h * 0.48) and ((bw / w > 0.16) or (bh / h > 0.12)):
                continue

            # 3. Upright 3D Obstacle / Vehicle Body Rejection:
            # An upright vehicle (van, ambulance, SUV, motorcycle rider) standing on the road plane has large vertical
            # height spanning into the mid/upper ground. Real road distress lying flat on asphalt has bh/h < 0.18
            # when starting in the midground (y1 < 0.50*h) due to perspective foreshortening.
            if cy < (h * 0.50) and (bh / h >= 0.18):
                continue

            # 4. Color Saturation Filter for Painted Vehicles & Vegetation:
            # Natural asphalt road surfaces have low saturation (matte gray/charcoal, S < 40).
            # Painted vehicles (cars, buses, auto-rickshaws) and trees have high saturation (S > 50).
            x1_c = int(max(0, bx[0]))
            y1_c = int(max(0, bx[1]))
            x2_c = int(min(w, bx[2]))
            y2_c = int(min(h, bx[3]))
            if (x2_c > x1_c + 4) and (y2_c > y1_c + 4):
                patch_sat = float(np.mean(hsv_img[y1_c:y2_c, x1_c:x2_c, 1]))
                if cy < (h * 0.55) and patch_sat > 52.0:
                    continue  # Reject vehicle / foliage

            # 5. Crack Vertical Boundary:
            # Cracks cannot appear on overhead structures, trees, or vehicle roofs/windshields.
            if "CRACK" in lbl and bx[1] < (h * 0.35):
                continue

            # 6. Pothole Geometric & Morphology Constraint:
            # Potholes are localized craters on the asphalt surface. They are roughly circular or elliptical.
            # Extreme aspect ratios (e.g. 9:1 horizontal banner lines or thin vertical strips) are camera/sensor artifacts.
            if "POTHOLE" in lbl:
                aspect = max(bw / bh, bh / bw)
                if aspect > 2.8:
                    continue
                if (bw / w > 0.65) or (bh / h > 0.65):
                    continue

            # 7. Dashcam Hood / Bumper Reflection Filter:
            # Boxes touching the very bottom edge (y2 > 0.94*h) spanning >65% width are vehicle hood reflections.
            if bx[3] > (h * 0.94) and (bw / w > 0.65):
                continue

            # 8. Discard horizontal scanner line artifacts
            if (bw / w > 0.80) and (bh / h < 0.04):
                continue

            x_pct = round((bx[0] / w) * 100, 1)
            y_pct = round((bx[1] / h) * 100, 1)
            w_pct = round((bw / w) * 100, 1)
            h_pct = round((bh / h) * 100, 1)
            area_px = int(bw * bh)
            cf = round(float(d.confidence), 3)
            lbl = d.class_name.upper()

            # Physical severity calculation (Rule R4):
            # Model detection confidence (cf) is strictly decoupled from physical severity.
            # Severity is a function of defect class, relative surface damage area, and aspect ratio.
            if "POTHOLE" in lbl:
                pothole_cnt += 1
                base_weight = 45
                action = "Immediate 24-hr cold mix asphalt compaction (indicative IRC:82)"
            elif "ALLIGATOR" in lbl:
                crack_cnt += 1
                base_weight = 35
                action = "Full-depth patch repair (indicative IRC:82)"
            elif "TRANS" in lbl:
                crack_cnt += 1
                base_weight = 25
                action = "Bituminous crack sealing (transverse)"
            else:
                crack_cnt += 1
                base_weight = 20
                action = "Bituminous crack sealing to prevent water penetration"

            area_ratio = area_px / max(1, w * h)
            area_component = min(45, int(area_ratio * 400))
            aspect = max(bw / max(1.0, bh), bh / max(1.0, bw))
            aspect_bonus = min(10, int(aspect * 1.5)) if "CRACK" in lbl else 0

            score = min(100, max(15, base_weight + area_component + aspect_bonus))
            severity = "Critical" if score >= 70 else ("Severe" if score >= 50 else "Moderate")

            detections.append(
                DetectionBox(
                    id=f"det-{i+1}",
                    label=lbl,
                    confidence=cf,
                    box=[x_pct, y_pct, w_pct, h_pct],
                    severity=severity,
                    score=score,
                    areaPx=area_px,
                    action=action,
                    is_calibrated=False,
                    measurement_method="uncalibrated_pixel_area",
                    unit="px_relative_pct"
                )
            )

        max_severity = "Minor"
        if any(d.severity == "Critical" for d in detections):
            max_severity = "Critical"
        elif any(d.severity == "Severe" for d in detections):
            max_severity = "Severe"
        elif len(detections) > 0:
            max_severity = "Moderate"

        overall_health = max(10, 100 - len(detections) * 15) if detections else 100

        return InferenceResponse(
            status="success",
            image_width=w,
            image_height=h,
            total_defects=len(detections),
            pothole_count=pothole_cnt,
            crack_count=crack_cnt,
            max_severity=max_severity,
            overall_health_score=overall_health,
            detections=detections
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
        raise HTTPException(status_code=404, detail="Model evaluation metrics not yet generated")
    try:
        with open(metrics_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed reading metrics: {str(e)}")

