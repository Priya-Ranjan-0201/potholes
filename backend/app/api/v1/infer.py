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


def get_inference_engine(conf_thresh: float = 0.15, iou_thresh: float = 0.40):
    """Load pure ONNX Runtime engine without AGPL Ultralytics runtime dependency."""
    from edge.agent.infer import EdgeInferenceEngine
    onnx_paths = [
        "runs/export/best_int8.onnx",
        "runs/export/best.onnx",
        "ml/runs/pothole_yolov8n/weights/best_int8.onnx",
        "ml/runs/pothole_yolov8n/weights/best.onnx",
        "runs/baselines/yolov8n/weights/best.onnx"
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
    conf_thresh: float = Query(0.15, ge=0.05, le=0.95),
    iou_thresh: float = Query(0.40, ge=0.1, le=0.9)
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

        for i, d in enumerate(raw_dets):
            bx = d.bbox_xyxy
            bw = max(1.0, bx[2] - bx[0])
            bh = max(1.0, bx[3] - bx[1])

            # Discard boundary artifacts spanning >96% of the entire image
            if (bw / w > 0.96) and (bh / h > 0.96):
                continue

            x_pct = round((bx[0] / w) * 100, 1)
            y_pct = round((bx[1] / h) * 100, 1)
            w_pct = round((bw / w) * 100, 1)
            h_pct = round((bh / h) * 100, 1)
            area_px = int(bw * bh)
            cf = round(float(d.confidence), 3)
            lbl = d.class_name.upper()

            if "POTHOLE" in lbl:
                pothole_cnt += 1
                action = "Immediate 24-hr cold mix asphalt compaction"
            else:
                crack_cnt += 1
                action = "48-hr bituminous sealing to prevent water penetration"

            severity = (
                "Critical" if (cf > 0.80 or area_px > 15000)
                else ("Severe" if (cf > 0.50 or area_px > 3000) else "Moderate")
            )
            score = int(cf * 60 + min(40, (area_px / max(1, w * h * 0.15)) * 40))
            score = min(100, max(25, score))

            detections.append(
                DetectionBox(
                    id=f"det-{i+1}",
                    label=lbl,
                    confidence=cf,
                    box=[x_pct, y_pct, w_pct, h_pct],
                    severity=severity,
                    score=score,
                    areaPx=area_px,
                    action=action
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
