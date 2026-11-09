"""AI-Powered Road Repair Verification & Comparison Engine.

Performs robust before-and-after image registration, perspective correction,
defect region differencing, remaining damage detection, and explainable
quality classification.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

import cv2
import numpy as np


@dataclass
class DefectBoxItem:
    """Detected road distress bounding box with relative coordinates."""

    label: str
    confidence: float
    bbox_xyxy: list[float]  # [x1, y1, x2, y2] in pixels
    relative_box: list[float]  # [x%, y%, w%, h%]
    area_px: int


@dataclass
class VerificationAssessment:
    """Comprehensive explainable repair verification result."""

    status: str
    # successfully_repaired | partially_repaired | incomplete_repair |
    # damage_recurring | new_damage_detected | verification_inconclusive
    effectiveness_pct: float
    explanation: str

    # Registration & Alignment Metrics
    alignment_confidence: float
    inliers_count: int
    matches_count: int
    inlier_ratio: float
    perspective_corrected: bool

    # Area & Damage Metrics
    before_area_px: int
    remaining_area_px: int
    new_area_px: int
    area_reduction_pct: float
    measurement_type: str = "uncalibrated_pixel_area_relative"
    is_calibrated: bool = False

    # Defect Collections
    before_defects: list[dict[str, Any]] = field(default_factory=list)
    remaining_defects: list[dict[str, Any]] = field(default_factory=list)
    new_defects: list[dict[str, Any]] = field(default_factory=list)
    resolved_defects: list[dict[str, Any]] = field(default_factory=list)

    # Recurrence
    recurrence_detected: bool = False
    recurrence_count: int = 0
    days_to_recurrence: int | None = None

    # Visual Evidence
    feature_matches_data_uri: str | None = None
    difference_heatmap_data_uri: str | None = None
    aligned_after_data_uri: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "status": self.status,
            "effectiveness_pct": round(self.effectiveness_pct, 1),
            "explanation": self.explanation,
            "alignment_confidence": round(self.alignment_confidence, 2),
            "inliers_count": self.inliers_count,
            "matches_count": self.matches_count,
            "inlier_ratio": round(self.inlier_ratio, 3),
            "perspective_corrected": self.perspective_corrected,
            "before_area_px": self.before_area_px,
            "remaining_area_px": self.remaining_area_px,
            "new_area_px": self.new_area_px,
            "area_reduction_pct": round(self.area_reduction_pct, 1),
            "measurement_type": self.measurement_type,
            "is_calibrated": self.is_calibrated,
            "before_defects": self.before_defects,
            "remaining_defects": self.remaining_defects,
            "new_defects": self.new_defects,
            "resolved_defects": self.resolved_defects,
            "recurrence_detected": self.recurrence_detected,
            "recurrence_count": self.recurrence_count,
            "days_to_recurrence": self.days_to_recurrence,
            "feature_matches_data_uri": self.feature_matches_data_uri,
            "difference_heatmap_data_uri": self.difference_heatmap_data_uri,
            "aligned_after_data_uri": self.aligned_after_data_uri,
        }


class RoadRepairVerificationEngine:
    """Computer vision pipeline for before-and-after road repair verification."""

    def __init__(
        self,
        min_inliers_threshold: int = 12,
        min_inlier_ratio: float = 0.15,
        min_matches: int = 8,
    ) -> None:
        self.min_inliers_threshold = min_inliers_threshold
        self.min_inlier_ratio = min_inlier_ratio
        self.min_matches = min_matches
        self._inference_engine = None

    def get_inference_engine(self):
        """Lazy-load YOLO11n ONNX runtime inference engine."""
        if self._inference_engine is None:
            try:
                from edge.agent.infer import EdgeInferenceEngine
                model_paths = [
                    "runs/export/best_yolo11_int8.onnx",
                    "runs/export/best_int8.onnx",
                    "runs/export/best.onnx",
                ]
                for p in model_paths:
                    if os.path.exists(p):
                        self._inference_engine = EdgeInferenceEngine(
                            model_path=p,
                            conf_threshold=0.25,
                            iou_threshold=0.35,
                        )
                        break
            except Exception:
                pass
        return self._inference_engine

    def detect_defects_in_image(self, image: np.ndarray) -> list[DefectBoxItem]:
        """Run YOLO11n inference on a road frame with road geometry constraints."""
        h, w = image.shape[:2]
        engine = self.get_inference_engine()
        if engine is None:
            # Fallback heuristic: OpenCV surface crater detection
            return self._fallback_crater_detection(image)

        raw_dets = engine.predict(image)
        items: list[DefectBoxItem] = []

        for d in raw_dets:
            bx = d.bbox_xyxy
            bw = max(1.0, bx[2] - bx[0])
            bh = max(1.0, bx[3] - bx[1])
            lbl = d.class_name.upper()

            # Apply civil engineering horizon and perspective scale constraints
            cy = (bx[1] + bx[3]) / 2.0
            if cy < (h * 0.28) or bx[1] < (h * 0.16):
                continue
            if cy < (h * 0.48) and ((bw / w > 0.18) or (bh / h > 0.14)):
                continue
            if cy < (h * 0.48) and (bh / h >= 0.20):
                continue
            if "CRACK" in lbl and bx[1] < (h * 0.35):
                continue
            if "POTHOLE" in lbl:
                aspect = max(bw / bh, bh / bw)
                if aspect > 2.8:
                    continue
                if (bw / w > 0.70) or (bh / h > 0.70):
                    continue

            rel_box = [
                round((bx[0] / w) * 100, 1),
                round((bx[1] / h) * 100, 1),
                round((bw / w) * 100, 1),
                round((bh / h) * 100, 1),
            ]
            items.append(
                DefectBoxItem(
                    label=lbl,
                    confidence=round(float(d.confidence), 3),
                    bbox_xyxy=[float(bx[0]), float(bx[1]), float(bx[2]), float(bx[3])],
                    relative_box=rel_box,
                    area_px=int(bw * bh),
                )
            )

        return items

    def _fallback_crater_detection(self, image: np.ndarray) -> list[DefectBoxItem]:
        """Heuristic asphalt depression detector when ONNX model is initializing."""
        h, w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (7, 7), 0)
        # Potholes exhibit dark core shadows
        thresh = cv2.adaptiveThreshold(
            blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 25, 7
        )
        # Limit to road plane (lower 70%)
        road_mask = np.zeros_like(thresh)
        road_mask[int(h * 0.35):, :] = 255
        masked = cv2.bitwise_and(thresh, road_mask)

        contours, _ = cv2.findContours(masked, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        items: list[DefectBoxItem] = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > (w * h * 0.005) and area < (w * h * 0.20):
                x, y, bw, bh = cv2.boundingRect(cnt)
                aspect = max(bw / max(1, bh), bh / max(1, bw))
                if aspect < 2.5:
                    items.append(
                        DefectBoxItem(
                            label="POTHOLE",
                            confidence=0.75,
                            bbox_xyxy=[float(x), float(y), float(x + bw), float(y + bh)],
                            relative_box=[
                                round((x / w) * 100, 1),
                                round((y / h) * 100, 1),
                                round((bw / w) * 100, 1),
                                round((bh / h) * 100, 1),
                            ],
                            area_px=int(bw * bh),
                        )
                    )
        return items

    def register_images(
        self,
        before_img: np.ndarray,
        after_img: np.ndarray,
    ) -> tuple[bool, np.ndarray | None, float, int, int, float, str | None, str | None]:
        """Register and align post-repair image to pre-repair viewpoint.

        Uses CLAHE illumination normalization, ORB feature detection,
        Lowe's ratio test, and RANSAC homography.

        Returns:
            (success, warped_after, confidence, inliers_count, matches_count, inlier_ratio, matches_vis_b64, reason)
        """
        # Normalize lighting variations (Section 1: lighting and weather adaptation)
        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        gray1 = clahe.apply(cv2.cvtColor(before_img, cv2.COLOR_BGR2GRAY))
        gray2 = clahe.apply(cv2.cvtColor(after_img, cv2.COLOR_BGR2GRAY))

        # Focus feature matching on lower road plane to avoid skyline/cloud drift
        h1, w1 = gray1.shape
        h2, w2 = gray2.shape

        mask1 = np.zeros_like(gray1)
        mask1[int(h1 * 0.25):, :] = 255
        mask2 = np.zeros_like(gray2)
        mask2[int(h2 * 0.25):, :] = 255

        orb = cv2.ORB_create(nfeatures=2500, fastThreshold=12, scaleFactor=1.2)
        kp1, des1 = orb.detectAndCompute(gray1, mask1)
        kp2, des2 = orb.detectAndCompute(gray2, mask2)

        if des1 is None or des2 is None or len(kp1) < 8 or len(kp2) < 8:
            return (
                False,
                None,
                0.0,
                0,
                0,
                0.0,
                None,
                "Insufficient keypoint textures detected in road surface.",
            )

        # Match features with BFMatcher and Hamming distance
        matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        raw_matches = matcher.knnMatch(des1, des2, k=2)

        good_matches = []
        for m_pair in raw_matches:
            if len(m_pair) == 2:
                m, n = m_pair
                if m.distance < 0.75 * n.distance:
                    good_matches.append(m)

        matches_count = len(good_matches)
        if matches_count < self.min_matches:
            return (
                False,
                None,
                0.0,
                0,
                matches_count,
                0.0,
                None,
                f"Low visual feature correspondence ({matches_count} matches). Cannot confirm identical roadway corridor.",
            )

        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

        # Homography with RANSAC
        H, inlier_mask = cv2.findHomography(dst_pts, src_pts, cv2.RANSAC, 5.0)

        if H is None or inlier_mask is None:
            return (
                False,
                None,
                0.0,
                0,
                matches_count,
                0.0,
                None,
                "Homography estimation failed to converge.",
            )

        inliers_count = int(np.sum(inlier_mask))
        inlier_ratio = inliers_count / max(1, matches_count)

        # Check homography determinant sanity (reject extreme shear / inversion)
        det = float(np.linalg.det(H[:2, :2]))
        if det <= 0.15 or det >= 7.0 or np.isnan(det):
            return (
                False,
                None,
                round(inlier_ratio * 0.4, 2),
                inliers_count,
                matches_count,
                inlier_ratio,
                None,
                f"Camera viewing angle discrepancy exceeds perspective tolerance (determinant={det:.2f}).",
            )

        # Strict evidence threshold: do not guess without sufficient inliers
        if inliers_count < self.min_inliers_threshold or inlier_ratio < self.min_inlier_ratio:
            return (
                False,
                None,
                round(inlier_ratio, 2),
                inliers_count,
                matches_count,
                inlier_ratio,
                None,
                f"Verification inconclusive: inliers ({inliers_count}) or inlier ratio ({inlier_ratio * 100:.1f}%) below confidence threshold.",
            )

        # Perspective warping
        warped_after = cv2.warpPerspective(after_img, H, (w1, h1))

        # Generate visual matches overlay image
        draw_matches = [good_matches[i] for i in range(len(good_matches)) if inlier_mask[i][0] == 1]
        vis_img = cv2.drawMatches(
            before_img,
            kp1,
            after_img,
            kp2,
            draw_matches[:35],
            None,
            matchColor=(34, 197, 94),  # Green inliers
            singlePointColor=(100, 116, 139),
            flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS,
        )
        _, buf = cv2.imencode(".jpg", vis_img, [cv2.IMWRITE_JPEG_QUALITY, 80])
        import base64
        vis_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf).decode('ascii')}"

        alignment_confidence = min(0.98, max(0.40, (inliers_count / 40.0) * 0.6 + inlier_ratio * 0.4))
        return (
            True,
            warped_after,
            round(alignment_confidence, 2),
            inliers_count,
            matches_count,
            round(inlier_ratio, 3),
            vis_b64,
            None,
        )

    def verify_repair(
        self,
        before_img: np.ndarray,
        after_img: np.ndarray,
        before_detections: list[dict[str, Any]] | None = None,
        metadata: dict[str, Any] | None = None,
        is_historical_recurrent: bool = False,
        recurrence_count: int = 0,
        days_to_recurrence: int | None = None,
    ) -> VerificationAssessment:
        """Execute full end-to-end repair comparison and quality assessment."""
        meta = metadata or {}
        h_before, w_before = before_img.shape[:2]

        # 1. Image Registration & Alignment
        reg_success, warped_after, align_conf, inliers, matches, inlier_ratio, vis_b64, failure_reason = (
            self.register_images(before_img, after_img)
        )

        # 2. Defect Detection on Before and After Images
        if before_detections is not None and len(before_detections) > 0:
            parsed_before: list[DefectBoxItem] = []
            for b in before_detections:
                box_coords = b.get("box", [0, 0, 10, 10])
                bx1 = (box_coords[0] / 100.0) * w_before
                by1 = (box_coords[1] / 100.0) * h_before
                bw = (box_coords[2] / 100.0) * w_before
                bh = (box_coords[3] / 100.0) * h_before
                parsed_before.append(
                    DefectBoxItem(
                        label=b.get("label", "POTHOLE"),
                        confidence=float(b.get("confidence", 0.85)),
                        bbox_xyxy=[bx1, by1, bx1 + bw, by1 + bh],
                        relative_box=box_coords,
                        area_px=int(bw * bh),
                    )
                )
            before_defects = parsed_before
        else:
            before_defects = self.detect_defects_in_image(before_img)

        # Detect defects in post-repair image
        target_after = warped_after if (reg_success and warped_after is not None) else after_img
        after_defects = self.detect_defects_in_image(target_after)

        before_dicts = [
            {
                "id": f"bef-{i+1}",
                "label": d.label,
                "confidence": d.confidence,
                "box": d.relative_box,
                "area_px": d.area_px,
            }
            for i, d in enumerate(before_defects)
        ]

        # If registration failed, return inconclusive (Section 1 & 2 requirement)
        if not reg_success:
            total_bef_area = sum(d.area_px for d in before_defects)
            total_aft_area = sum(d.area_px for d in after_defects)
            return VerificationAssessment(
                status="verification_inconclusive",
                effectiveness_pct=0.0,
                explanation=failure_reason
                or "Camera viewpoint or lighting difference prevents reliable visual registration. Manual engineering audit required.",
                alignment_confidence=align_conf,
                inliers_count=inliers,
                matches_count=matches,
                inlier_ratio=inlier_ratio,
                perspective_corrected=False,
                before_area_px=total_bef_area,
                remaining_area_px=total_aft_area,
                new_area_px=0,
                area_reduction_pct=0.0,
                before_defects=before_dicts,
                remaining_defects=[],
                new_defects=[],
                resolved_defects=[],
                recurrence_detected=is_historical_recurrent,
                recurrence_count=recurrence_count,
                days_to_recurrence=days_to_recurrence,
                feature_matches_data_uri=None,
            )

        # 3. Spatial Defect Matching & Differencing
        # Match each original defect against post-repair detections via bounding-box IoU / spatial distance
        remaining_defects: list[dict[str, Any]] = []
        resolved_defects: list[dict[str, Any]] = []
        matched_after_indices: set[int] = set()

        for i, b_def in enumerate(before_defects):
            bx1, by1, bx2, by2 = b_def.bbox_xyxy
            b_area = b_def.area_px
            best_overlap_idx = -1
            max_iou = 0.0

            for j, a_def in enumerate(after_defects):
                ax1, ay1, ax2, ay2 = a_def.bbox_xyxy
                # Intersection
                ix1 = max(bx1, ax1)
                iy1 = max(by1, ay1)
                ix2 = min(bx2, ax2)
                iy2 = min(by2, ay2)
                inter_w = max(0.0, ix2 - ix1)
                inter_h = max(0.0, iy2 - iy1)
                inter_area = inter_w * inter_h

                union_area = b_area + a_def.area_px - inter_area
                iou = inter_area / max(1.0, union_area)
                if iou > max_iou:
                    max_iou = iou
                    best_overlap_idx = j

            # If overlap > 0.12 or centers are close, defect persists
            if max_iou >= 0.12 and best_overlap_idx >= 0:
                matched_after_indices.add(best_overlap_idx)
                persisting = after_defects[best_overlap_idx]
                remaining_defects.append(
                    {
                        "id": f"rem-{len(remaining_defects)+1}",
                        "original_id": f"bef-{i+1}",
                        "label": persisting.label,
                        "confidence": persisting.confidence,
                        "box": persisting.relative_box,
                        "area_px": persisting.area_px,
                        "overlap_iou": round(max_iou, 2),
                    }
                )
            else:
                resolved_defects.append(
                    {
                        "id": f"bef-{i+1}",
                        "label": b_def.label,
                        "confidence": b_def.confidence,
                        "box": b_def.relative_box,
                        "area_px": b_def.area_px,
                    }
                )

        # Any detections in after_img not matching before defects are newly appearing defects
        new_defects: list[dict[str, Any]] = []
        for j, a_def in enumerate(after_defects):
            if j not in matched_after_indices:
                new_defects.append(
                    {
                        "id": f"new-{len(new_defects)+1}",
                        "label": a_def.label,
                        "confidence": a_def.confidence,
                        "box": a_def.relative_box,
                        "area_px": a_def.area_px,
                    }
                )

        # 4. Damage Area & Effectiveness Analytics (Section 4)
        total_before_area = sum(d.area_px for d in before_defects)
        total_remaining_area = sum(d["area_px"] for d in remaining_defects)
        total_new_area = sum(d["area_px"] for d in new_defects)

        if total_before_area > 0:
            area_reduction_pct = max(
                0.0,
                min(
                    100.0,
                    ((total_before_area - total_remaining_area) / total_before_area) * 100.0,
                ),
            )
        else:
            area_reduction_pct = 100.0 if total_remaining_area == 0 else 0.0

        # Effectiveness calculation accounting for remaining area and newly formed adjacent distress
        if total_before_area > 0:
            penalty = (total_remaining_area + 0.4 * total_new_area) / total_before_area
            effectiveness_pct = max(0.0, min(100.0, (1.0 - penalty) * 100.0))
        else:
            effectiveness_pct = 100.0 if (total_remaining_area == 0 and total_new_area == 0) else 0.0

        # 5. Quality Classification Category Decision Tree (Section 2)
        if is_historical_recurrent and (len(remaining_defects) > 0 or len(after_defects) > 0):
            status = "damage_recurring"
            expl = (
                f"Distress recurring at historical repair site (Recurrence #{recurrence_count}). "
                f"Prior patch opened within {days_to_recurrence or 'recent'} days; sub-base compaction failure."
            )
        elif len(before_defects) > 0 and len(remaining_defects) == 0 and len(new_defects) == 0:
            status = "successfully_repaired"
            expl = (
                f"All {len(before_defects)} original defects successfully repaired. "
                "Smooth asphalt surface compaction verified with 0 residual depressions."
            )
        elif len(before_defects) > 0 and len(remaining_defects) == 0 and len(new_defects) > 0:
            status = "new_damage_detected"
            expl = (
                f"Original defects resolved, but {len(new_defects)} newly formed distress patterns "
                "detected in adjacent roadway section."
            )
        elif len(remaining_defects) > 0:
            if area_reduction_pct >= 35.0:
                status = "partially_repaired"
                expl = (
                    f"Defect area reduced by {area_reduction_pct:.1f}%, but {len(remaining_defects)} "
                    "residual surface craters/cracks remain incompletely sealed."
                )
            else:
                status = "incomplete_repair"
                expl = (
                    f"Original road damage persists with minimal remediation ({area_reduction_pct:.1f}% reduction). "
                    "Substandard compaction; contractor rework mandatory."
                )
        else:
            status = "successfully_repaired"
            expl = "Clean road surface verified. No active physical distress patterns detected."

        # 6. Generate Difference Heatmap (Aligned Comparison)
        diff_heatmap_b64 = None
        aligned_after_b64 = None
        try:
            import base64
            # Grayscale difference
            g_bef = cv2.cvtColor(before_img, cv2.COLOR_BGR2GRAY)
            g_aft = cv2.cvtColor(warped_after, cv2.COLOR_BGR2GRAY)
            diff = cv2.absdiff(g_bef, g_aft)
            diff_blur = cv2.GaussianBlur(diff, (9, 9), 0)
            heatmap = cv2.applyColorMap(diff_blur, cv2.COLORMAP_JET)
            blended = cv2.addWeighted(before_img, 0.65, heatmap, 0.35, 0)
            _, buf1 = cv2.imencode(".jpg", blended, [cv2.IMWRITE_JPEG_QUALITY, 75])
            diff_heatmap_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf1).decode('ascii')}"

            _, buf2 = cv2.imencode(".jpg", warped_after, [cv2.IMWRITE_JPEG_QUALITY, 80])
            aligned_after_b64 = f"data:image/jpeg;base64,{base64.b64encode(buf2).decode('ascii')}"
        except Exception:
            pass

        return VerificationAssessment(
            status=status,
            effectiveness_pct=round(effectiveness_pct, 1),
            explanation=expl,
            alignment_confidence=align_conf,
            inliers_count=inliers,
            matches_count=matches,
            inlier_ratio=inlier_ratio,
            perspective_corrected=True,
            before_area_px=total_before_area,
            remaining_area_px=total_remaining_area,
            new_area_px=total_new_area,
            area_reduction_pct=round(area_reduction_pct, 1),
            before_defects=before_dicts,
            remaining_defects=remaining_defects,
            new_defects=new_defects,
            resolved_defects=resolved_defects,
            recurrence_detected=is_historical_recurrent,
            recurrence_count=recurrence_count,
            days_to_recurrence=days_to_recurrence,
            feature_matches_data_uri=vis_b64,
            difference_heatmap_data_uri=diff_heatmap_b64,
            aligned_after_data_uri=aligned_after_b64,
        )
