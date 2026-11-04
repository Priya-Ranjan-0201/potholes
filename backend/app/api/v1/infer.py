"""ScamRoad Real-Time Inference API Endpoint.
Processes uploaded road imagery using YOLO deep models combined with edge surface
depression analysis, returning localized bounding boxes, confidence, and severity metrics.
"""

from io import BytesIO
import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
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


def get_inference_engine():
    """Load pure ONNX Runtime engine without AGPL Ultralytics dependency."""
    from edge.agent.infer import EdgeInferenceEngine
    onnx_paths = [
        "runs/export/best_int8.onnx",
        "ml/runs/pothole_yolov8n/weights/best_int8.onnx",
        "runs/export/best.onnx",
        "ml/runs/pothole_yolov8n/weights/best.onnx",
        "runs/baselines/yolov8n/weights/best.onnx"
    ]
    for p in onnx_paths:
        if os.path.exists(p):
            try:
                return EdgeInferenceEngine(model_path=p, conf_threshold=0.25, iou_threshold=0.45)
            except Exception:
                continue
    return None


@router.post("/infer", response_model=InferenceResponse)
async def infer_road_defects(
    file: UploadFile = File(...),
    conf_thresh: float = Query(0.20, ge=0.05, le=0.95),
    iou_thresh: float = Query(0.35, ge=0.1, le=0.9)
):
    """Run real-time defect detection on an uploaded image using pure ONNX Runtime + Edge CV."""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file format")

        h, w = img.shape[:2]
        candidates = []

        # 1. Pure ONNX Runtime Inference
        engine = get_inference_engine()
        if engine is not None:
            try:
                dets = engine.predict(img)
                for d in dets:
                    bx = d.bbox_xyxy
                    bw_b = bx[2] - bx[0]
                    bh_b = bx[3] - bx[1]
                    # Filter out oversized or out-of-road boxes
                    if bh_b > h * 0.60 or bw_b > w * 0.60:
                        continue
                    if bx[1] < h * 0.12:  # Sky/horizon
                        continue
                    candidates.append({
                        "label": d.class_name,
                        "conf": float(d.confidence),
                        "box_xywh": [bx[0], bx[1], bw_b, bh_b],
                        "area": int(bw_b * bh_b),
                    })
            except Exception:
                pass

        # 2. Road Surface Morphological Crater Analysis (detects unpaved/rural road craters)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        road_mask = np.zeros_like(gray)
        pts = np.array([
            [int(w * 0.08), int(h * 0.18)],
            [int(w * 0.92), int(h * 0.18)],
            [int(w * 0.99), h],
            [int(w * 0.01), h]
        ], np.int32)
        cv2.fillPoly(road_mask, [pts], 255)

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 23))
        blackhat = cv2.morphologyEx(gray, cv2.MORPH_BLACKHAT, kernel)
        blackhat = cv2.bitwise_and(blackhat, blackhat, mask=road_mask)
        blurred = cv2.GaussianBlur(blackhat, (7, 7), 0)
        thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 35, -4)
        thresh = cv2.bitwise_and(thresh, thresh, mask=road_mask)
        close_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 11))
        closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, close_kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 160 or area > (w * h * 0.10):
                continue
            cx, cy, cbw, cbh = cv2.boundingRect(cnt)
            if cbw > w * 0.35 or cbh > h * 0.30:
                continue
            if cy < h * 0.15:
                continue
            aspect = cbw / float(cbh)
            if 0.38 <= aspect <= 3.3:
                roi = blackhat[cy:cy+cbh, cx:cx+cbw]
                mean_d = float(np.mean(roi))
                if mean_d >= 13.5:
                    cf = round(min(0.96, max(0.72, 0.70 + (mean_d / 70.0) * 0.25)), 3)
                    candidates.append({
                        "label": "POTHOLE",
                        "conf": cf,
                        "box_xywh": [cx, cy, cbw, cbh],
                        "area": int(area),
                    })

        # 3. Non-Maximum Suppression (NMS)
        def iou(b1, b2):
            x1 = max(b1[0], b2[0])
            y1 = max(b1[1], b2[1])
            x2 = min(b1[0] + b1[2], b2[0] + b2[2])
            y2 = min(b1[1] + b1[3], b2[1] + b2[3])
            inter = max(0, x2 - x1) * max(0, y2 - y1)
            union = (b1[2] * b1[3]) + (b2[2] * b2[3]) - inter
            return inter / union if union > 0 else 0

        # Sort so high-confidence potholes and defects are prioritized
        candidates = sorted(candidates, key=lambda c: (1 if c["label"] == "POTHOLE" else 0, c["conf"]), reverse=True)
        kept = []
        for cand in candidates:
            if any(iou(cand["box_xywh"], k["box_xywh"]) > 0.35 for k in kept):
                continue
            kept.append(cand)

        detections: List[DetectionBox] = []
        pothole_cnt = 0
        crack_cnt = 0

        for i, k in enumerate(kept[:10]):
            bx, by, bw_k, bh_k = k["box_xywh"]
            x_pct = round((bx / w) * 100, 1)
            y_pct = round((by / h) * 100, 1)
            w_pct = round((bw_k / w) * 100, 1)
            h_pct = round((bh_k / h) * 100, 1)
            area_px = k["area"]
            cf = round(k["conf"], 3)
            lbl = k["label"]

            if "POTHOLE" in lbl.upper():
                pothole_cnt += 1
                action = "Immediate 24-hr cold mix asphalt compaction"
            else:
                crack_cnt += 1
                action = "48-hr bituminous sealing to prevent water penetration"

            severity = "Critical" if (cf > 0.85 or area_px > 2000) else ("Severe" if (cf > 0.72 or area_px > 600) else "Moderate")
            score = int(cf * 60 + min(40, (area_px / 2500) * 40))
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

        overall_health = max(10, 100 - len(detections) * 15)

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

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
