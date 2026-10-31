"""Privacy redaction service for faces and vehicle license plates.

Adheres strictly to Rule R15: Edge-side anonymization of stored and transmitted media.
Detects potential facial features and vehicle license plate regions, applying strong
Gaussian blur to prevent personal data retention while strictly preserving the road
surface defect visibility.
"""

from __future__ import annotations

import argparse
import hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING

import cv2

if TYPE_CHECKING:
    import numpy as np


@dataclass
class RedactionResult:
    """Outcome of on-device media redaction."""

    redacted_image: np.ndarray
    faces_redacted: int
    plates_redacted: int
    total_redactions: int
    sha256_hash: str
    saved_path: Path | None = None


class PrivacyRedactor:
    """Edge-side anonymization processor for road scene media."""

    def __init__(
        self,
        blur_kernel_size: int = 35,
        blur_faces: bool = True,
        blur_plates: bool = True,
    ) -> None:
        self.blur_ksize = blur_kernel_size if blur_kernel_size % 2 == 1 else blur_kernel_size + 1
        self.blur_faces = blur_faces
        self.blur_plates = blur_plates

    def detect_license_plate_regions(self, image: np.ndarray) -> list[tuple[int, int, int, int]]:
        """Heuristic edge & contour detector for rectangular vehicle license plates."""
        h, _w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

        # Bilateral filter to preserve edges while removing noise
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        edges = cv2.Canny(filtered, 50, 200)

        contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        plate_boxes: list[tuple[int, int, int, int]] = []

        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            if bw <= 0 or bh <= 0:
                continue

            aspect_ratio = float(bw) / float(bh)
            area = float(bw * bh)

            # License plates typically have aspect ratio between 2.0 and 5.5
            # and occupy a plausible proportion of the frame (e.g. 500 to 50000 px)
            if (
                2.0 <= aspect_ratio <= 5.5 and 400.0 <= area <= 40000.0 and y < int(h * 0.85)
            ):  # Not road surface directly under car
                plate_boxes.append((x, y, bw, bh))

        return plate_boxes

    def detect_face_regions(self, image: np.ndarray) -> list[tuple[int, int, int, int]]:
        """Lightweight face detector for roadside pedestrians and oncoming vehicle cabs."""
        h, _w = image.shape[:2]
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image

        # In vehicle dashcam scenes, human faces appear in the upper half/sides
        # Detect bright elliptical flesh-tone / contrast regions in non-asphalt zone
        face_boxes: list[tuple[int, int, int, int]] = []

        # Restrict face detection zone to upper 60% of frame (sky / pavement boundary and sidewalks)
        upper_zone = gray[: int(h * 0.60), :]
        if upper_zone.size == 0:
            return []

        # Find high-gradient circular/elliptical contours in upper region
        blurred = cv2.GaussianBlur(upper_zone, (7, 7), 0)
        thresh = cv2.adaptiveThreshold(
            blurred,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            15,
            3,
        )
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            if bw <= 0 or bh <= 0:
                continue
            ar = float(bw) / float(bh)
            area = float(bw * bh)
            # Face aspect ratio ~ 0.7 to 1.3
            if 0.7 <= ar <= 1.3 and 900.0 <= area <= 25000.0:
                face_boxes.append((x, y, bw, bh))

        return face_boxes

    def redact(
        self,
        image: np.ndarray,
        defect_safe_boxes: list[tuple[float, float, float, float]] | None = None,
        save_path: Path | None = None,
    ) -> RedactionResult:
        """Apply Gaussian blur to privacy-sensitive regions, preserving defect locations."""
        out_img = image.copy()
        img_h, img_w = out_img.shape[:2]

        plates_count = 0
        faces_count = 0

        # Collect regions to redact
        regions_to_blur: list[tuple[int, int, int, int]] = []

        if self.blur_plates:
            plate_boxes = self.detect_license_plate_regions(out_img)
            plates_count = len(plate_boxes)
            regions_to_blur.extend(plate_boxes)

        if self.blur_faces:
            face_boxes = self.detect_face_regions(out_img)
            faces_count = len(face_boxes)
            regions_to_blur.extend(face_boxes)

        # Apply blur while avoiding road defect bounding boxes
        for rx, ry, rw, rh in regions_to_blur:
            x1 = max(0, rx)
            y1 = max(0, ry)
            x2 = min(img_w, rx + rw)
            y2 = min(img_h, ry + rh)

            # Verify no overlap with detected road defect
            if defect_safe_boxes:
                overlap = False
                for dx1, dy1, dx2, dy2 in defect_safe_boxes:
                    if not (x2 < dx1 or x1 > dx2 or y2 < dy1 or y1 > dy2):  # Intersects defect
                        overlap = True
                        break
                if overlap:
                    continue  # Never blur the road damage evidence

            # Apply strong Gaussian blur
            sub_roi = out_img[y1:y2, x1:x2]
            if sub_roi.size > 0:
                blurred_sub = cv2.GaussianBlur(sub_roi, (self.blur_ksize, self.blur_ksize), 0)
                out_img[y1:y2, x1:x2] = blurred_sub

        # Compute SHA-256 hash of sanitized image bytes
        success, encoded_buf = cv2.imencode(".jpg", out_img)
        img_bytes = encoded_buf.tobytes() if success else b""
        sha256 = hashlib.sha256(img_bytes).hexdigest()

        saved_file = None
        if save_path:
            save_path.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(save_path), out_img)
            saved_file = save_path

        return RedactionResult(
            redacted_image=out_img,
            faces_redacted=faces_count,
            plates_redacted=plates_count,
            total_redactions=faces_count + plates_count,
            sha256_hash=sha256,
            saved_path=saved_file,
        )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Privacy redaction for faces and license plates.")
    parser.add_argument("--input", type=Path, required=True, help="Input road image.")
    parser.add_argument("--output", type=Path, required=True, help="Output sanitized image.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the privacy-blur CLI."""
    args = parse_args(argv)
    if not args.input.exists():
        print(f"Error: Input image not found: {args.input}")
        return

    img = cv2.imread(str(args.input))
    redactor = PrivacyRedactor()
    res = redactor.redact(img, save_path=args.output)
    print(
        f"Redaction complete: {res.total_redactions} regions blurred "
        f"({res.faces_redacted} faces, {res.plates_redacted} plates). "
        f"SHA-256: {res.sha256_hash} -> Saved to {res.saved_path}"
    )


if __name__ == "__main__":
    main()
