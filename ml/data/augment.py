"""ScamRoad Domain-Specific Road Defect Augmentation Engine.

Applies realistic, physically grounded augmentations to training samples:
1. Solar & tree canopy shadow simulation (polygonal alpha blending)
2. Wet pavement & monsoon rain streak reflections
3. Dashcam vehicle vibration & motion blur
4. Exposure, gamma, and sunlight glare adjustments
5. Gaussian sensor noise under twilight conditions
6. Semantically valid horizontal flipping (inverting cx)

Strictly preserves damage features, adheres to Rule R1, and protects validation/test sets.
"""

from __future__ import annotations

import argparse
import random
import shutil
from pathlib import Path

import cv2
import numpy as np


class RoadDamageAugmentor:
    """Domain-specific road surface augmentation pipeline."""

    def __init__(self, seed: int = 42) -> None:
        self.rng = random.Random(seed)  # noqa: S311
        np.random.seed(seed)

    def apply_shadow(self, image: np.ndarray) -> np.ndarray:
        """Simulate realistic tree, building, or bridge shadows across asphalt."""
        h, w = image.shape[:2]
        overlay = image.copy()
        # Random polygon points
        pt1 = (self.rng.randint(0, w // 2), 0)
        pt2 = (self.rng.randint(w // 2, w), 0)
        pt3 = (self.rng.randint(w // 4, w), h)
        pt4 = (self.rng.randint(0, w // 4), h)
        pts = np.array([pt1, pt2, pt3, pt4], dtype=np.int32)

        shadow_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.fillPoly(shadow_mask, [pts], 255)

        darkening = self.rng.uniform(0.40, 0.65)
        overlay[shadow_mask == 255] = (overlay[shadow_mask == 255] * darkening).astype(np.uint8)
        return overlay

    def apply_rain_and_wet_road(self, image: np.ndarray) -> np.ndarray:
        """Simulate wet road surface reflections and monsoon rain streaks."""
        h, w = image.shape[:2]
        augmented = image.copy().astype(np.float32)

        # 1. Darken lower road region to simulate wet asphalt saturation
        dark_factor = self.rng.uniform(0.70, 0.85)
        augmented[int(h * 0.3) :, :] *= dark_factor

        # 2. Add subtle rain streaks
        num_drops = self.rng.randint(100, 300)
        rain_layer = np.zeros((h, w, 3), dtype=np.uint8)
        for _ in range(num_drops):
            x = self.rng.randint(0, w - 1)
            y = self.rng.randint(0, h - 30)
            length = self.rng.randint(10, 25)
            angle = self.rng.randint(-3, 3)
            cv2.line(
                rain_layer,
                (x, y),
                (x + angle, y + length),
                (200, 200, 200),
                1,
                lineType=cv2.LINE_AA,
            )

        augmented = np.clip(augmented, 0, 255).astype(np.uint8)
        return cv2.addWeighted(augmented, 0.90, rain_layer, 0.10, 0)

    def apply_motion_blur(self, image: np.ndarray) -> np.ndarray:
        """Simulate dashcam motion blur during vehicle travel."""
        size = self.rng.choice([5, 7, 9])
        kernel = np.zeros((size, size))
        kernel[int((size - 1) / 2), :] = np.ones(size)
        kernel /= size
        return cv2.filter2D(image, -1, kernel)

    def apply_lighting_and_gamma(self, image: np.ndarray) -> np.ndarray:
        """Adjust gamma, brightness, and contrast (noon sun vs twilight)."""
        gamma = self.rng.uniform(0.7, 1.4)
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype(
            "uint8"
        )
        return cv2.LUT(image, table)

    def apply_sensor_noise(self, image: np.ndarray) -> np.ndarray:
        """Simulate dashcam sensor noise under low-light conditions."""
        noise = np.random.normal(0, 8, image.shape).astype(np.float32)
        return np.clip(image.astype(np.float32) + noise, 0, 255).astype(np.uint8)

    def apply_horizontal_flip(
        self, image: np.ndarray, bboxes: list[list[float]]
    ) -> tuple[np.ndarray, list[list[float]]]:
        """Flip image horizontally and recalculate normalized bounding box center."""
        flipped_img = cv2.flip(image, 1)
        flipped_boxes = []
        for box in bboxes:
            cls_id, cx, cy, bw, bh = box
            new_cx = round(1.0 - cx, 6)
            flipped_boxes.append([cls_id, new_cx, cy, bw, bh])
        return flipped_img, flipped_boxes

    def augment_sample(
        self, image: np.ndarray, bboxes: list[list[float]]
    ) -> tuple[np.ndarray, list[list[float]]]:
        """Apply a stochastically selected sequence of realistic road transforms."""
        aug_img = image.copy()
        aug_boxes = [list(b) for b in bboxes]

        # Horizontal flip (50% probability)
        if self.rng.random() < 0.50:
            aug_img, aug_boxes = self.apply_horizontal_flip(aug_img, aug_boxes)

        # Weather / Lighting effect
        effect_roll = self.rng.random()
        if effect_roll < 0.25:
            aug_img = self.apply_shadow(aug_img)
        elif effect_roll < 0.50:
            aug_img = self.apply_rain_and_wet_road(aug_img)
        elif effect_roll < 0.75:
            aug_img = self.apply_lighting_and_gamma(aug_img)

        # Blur or Noise (30% probability)
        if self.rng.random() < 0.30:
            if self.rng.random() < 0.50:
                aug_img = self.apply_motion_blur(aug_img)
            else:
                aug_img = self.apply_sensor_noise(aug_img)

        return aug_img, aug_boxes


def augment_dataset_directory(
    train_images_dir: Path,
    train_labels_dir: Path,
    out_images_dir: Path,
    out_labels_dir: Path,
    multiplier: int = 1,
) -> dict[str, int]:
    """Augment training directory, keeping validation and test splits pristine."""
    out_images_dir.mkdir(parents=True, exist_ok=True)
    out_labels_dir.mkdir(parents=True, exist_ok=True)

    augmentor = RoadDamageAugmentor()
    image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
    images = sorted([f for f in train_images_dir.iterdir() if f.suffix.lower() in image_exts])

    augmented_count = 0
    for img_path in images:
        img = cv2.imread(str(img_path))
        if img is None:
            continue

        lbl_path = train_labels_dir / f"{img_path.stem}.txt"
        boxes: list[list[float]] = []
        if lbl_path.exists():
            for line in lbl_path.read_text(encoding="utf-8").splitlines():
                parts = line.strip().split()
                if len(parts) >= 5:
                    boxes.append(
                        [
                            int(parts[0]),
                            float(parts[1]),
                            float(parts[2]),
                            float(parts[3]),
                            float(parts[4]),
                        ]
                    )

        # Copy original
        cv2.imwrite(str(out_images_dir / img_path.name), img)
        if lbl_path.exists():
            shutil.copy2(lbl_path, out_labels_dir / lbl_path.name)

        # Generate augmented variations
        for i in range(multiplier):
            aug_img, aug_boxes = augmentor.augment_sample(img, boxes)
            aug_img_name = f"{img_path.stem}_aug{i}{img_path.suffix}"
            cv2.imwrite(str(out_images_dir / aug_img_name), aug_img)

            aug_lbl_name = f"{img_path.stem}_aug{i}.txt"
            lbl_lines = [
                f"{int(b[0])} {b[1]:.6f} {b[2]:.6f} {b[3]:.6f} {b[4]:.6f}" for b in aug_boxes
            ]
            (out_labels_dir / aug_lbl_name).write_text("\n".join(lbl_lines), encoding="utf-8")
            augmented_count += 1

    print(f"[SUCCESS] Training set expanded with {augmented_count} realistic augmentations.")
    return {
        "original_samples": len(images),
        "augmented_generated": augmented_count,
        "total_training_samples": len(images) + augmented_count,
    }


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="ScamRoad Road Damage Augmentation Engine")
    parser.add_argument(
        "--train-images",
        type=Path,
        required=True,
        help="Input training images directory.",
    )
    parser.add_argument(
        "--train-labels",
        type=Path,
        required=True,
        help="Input training labels directory.",
    )
    parser.add_argument(
        "--out-images",
        type=Path,
        required=True,
        help="Target output training images directory.",
    )
    parser.add_argument(
        "--out-labels",
        type=Path,
        required=True,
        help="Target output training labels directory.",
    )
    parser.add_argument(
        "--multiplier",
        type=int,
        default=1,
        help="Augmentations per original image (default: 1).",
    )
    return parser.parse_args()


def main() -> None:
    """Main execution routine."""
    args = parse_args()
    augment_dataset_directory(
        args.train_images,
        args.train_labels,
        args.out_images,
        args.out_labels,
        args.multiplier,
    )


if __name__ == "__main__":
    main()
