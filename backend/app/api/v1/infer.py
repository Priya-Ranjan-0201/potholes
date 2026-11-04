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
                return EdgeInferenceEngine(model_path=p, conf_threshold=0.15, iou_threshold=0.35)
            except Exception:
                continue
    return None


@router.post("/infer", response_model=InferenceResponse)
async def infer_road_defects(
    file: UploadFile = File(...),
    conf_thresh: float = Query(0.15, ge=0.05, le=0.95),
    iou_thresh: float = Query(0.30, ge=0.1, le=0.9)
):
    """Run real-time defect detection on an uploaded image using pure ONNX Runtime + Bilateral Cavity Morphology."""
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file format")

        h, w = img.shape[:2]
        candidates = []

        # 1. Perspective Road Corridor Mask
        # Drivable road corridor tapers towards vanishing point/horizon (16-18% height)
        # Discards background trees, forest banks, sky, and power lines.
        road_mask = np.zeros((h, w), dtype=np.uint8)
        corridor_pts = np.array([
            [int(w * 0.30), int(h * 0.16)],
            [int(w * 0.70), int(h * 0.16)],
            [int(w * 0.94), int(h * 0.98)],
            [int(w * 0.06), int(h * 0.98)]
        ], np.int32)
        cv2.fillPoly(road_mask, [corridor_pts], 255)

        # 2. Pure ONNX Runtime Inference
        engine = get_inference_engine()
        if engine is not None:
            try:
                raw_dets = engine.predict(img)
                for d in raw_dets:
                    bx = d.bbox_xyxy
                    bw_b = bx[2] - bx[0]
                    bh_b = bx[3] - bx[1]

                    # Verify center of box is inside drivable road corridor
                    cx = int((bx[0] + bx[2]) / 2)
                    cy = int((bx[1] + bx[3]) / 2)
                    if not (0 <= cy < h and 0 <= cx < w and road_mask[cy, cx] > 0):
                        continue

                    # Filter out oversized boxes spanning beyond lanes
                    if bw_b > w * 0.65 or bh_b > h * 0.55:
                        continue
                    if cy < h * 0.16:
                        continue

                    label = d.class_name
                    conf = float(d.confidence)
                    aspect = bw_b / max(1.0, bh_b)

                    # Suppress false-positive crack detections on dirt surfaces & trees
                    # Cracks must be high-confidence or long thin fissures (aspect > 2.2 or < 0.45)
                    if "CRACK" in label.upper():
                        if conf < 0.45:
                            continue
                        if 0.55 <= aspect <= 1.85 and conf < 0.88:
                            continue

                    # Suppress flat clipping artifacts or tall vertical splinters for potholes
                    if "POTHOLE" in label.upper():
                        if aspect > 3.0 or aspect < 0.35:
                            continue

                    candidates.append({
                        "label": label,
                        "conf": round(conf, 3),
                        "box_xywh": [float(bx[0]), float(bx[1]), float(bw_b), float(bh_b)],
                        "area": int(bw_b * bh_b),
                    })
            except Exception as e:
                pass

        # 3. Bilateral Multi-Scale Depression Cavity Extractor (Real Potholes & Craters)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        filtered = cv2.bilateralFilter(gray, d=11, sigmaColor=50, sigmaSpace=50)

        for k_size in [(25, 19), (35, 25), (45, 31)]:
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, k_size)
            blackhat = cv2.morphologyEx(filtered, cv2.MORPH_BLACKHAT, kernel)
            blackhat_masked = cv2.bitwise_and(blackhat, blackhat, mask=road_mask)

            thresh = cv2.adaptiveThreshold(
                blackhat_masked, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY, 31, -3
            )
            thresh = cv2.bitwise_and(thresh, thresh, mask=road_mask)
            c_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 7))
            closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, c_kernel)

            cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            for c in cnts:
                area = cv2.contourArea(c)
                if area < 75 or area > (w * h * 0.08):
                    continue
                x, y, cbw, cbh = cv2.boundingRect(c)
                if y < int(h * 0.16) or (y + cbh) > int(h * 0.98):
                    continue
                aspect = cbw / float(cbh)
                if 0.45 <= aspect <= 2.8:
                    roi = blackhat_masked[y:y+cbh, x:x+cbw]
                    mean_intensity = float(np.mean(roi[roi > 0])) if np.any(roi > 0) else 0.0
                    if mean_intensity > 12.0:
                        cf = min(0.95, max(0.72, 0.65 + (mean_intensity / 55.0) * 0.28))
                        candidates.append({
                            "label": "POTHOLE",
                            "conf": round(cf, 3),
                            "box_xywh": [float(x), float(y), float(cbw), float(cbh)],
                            "area": int(area),
                        })

        # 4. Non-Maximum Suppression (NMS) prioritizing Potholes
        def iou(b1, b2):
            x1 = max(b1[0], b2[0])
            y1 = max(b1[1], b2[1])
            x2 = min(b1[0] + b1[2], b2[0] + b2[2])
            y2 = min(b1[1] + b1[3], b2[1] + b2[3])
            inter = max(0, x2 - x1) * max(0, y2 - y1)
            union = (b1[2] * b1[3]) + (b2[2] * b2[3]) - inter
            return inter / union if union > 0 else 0

        # Sort so potholes and highest-confidence defects take precedence
        candidates = sorted(
            candidates,
            key=lambda c: (1 if c["label"] == "POTHOLE" else 0, c["conf"]),
            reverse=True
        )
        kept = []
        for cand in candidates:
            if any(iou(cand["box_xywh"], k["box_xywh"]) > 0.28 for k in kept):
                continue
            kept.append(cand)

        detections: List[DetectionBox] = []
        pothole_cnt = 0
        crack_cnt = 0

        for i, k in enumerate(kept[:16]):
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

            severity = "Critical" if (cf > 0.85 or area_px > 1800) else ("Severe" if (cf > 0.73 or area_px > 450) else "Moderate")
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

        overall_health = max(10, 100 - len(detections) * 8)

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
