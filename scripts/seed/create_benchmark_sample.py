"""Generate authentic benchmark sample dataset for testing data conversion and audit pipelines.

Creates realistic sample images with varying resolutions, defects, and Pascal VOC XML labels.
"""

from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw


def create_sample_road_image(
    path: Path,
    width: int = 720,
    height: int = 720,
    add_pothole: bool = True,
    add_crack: bool = False,
    noise_level: float = 0.05,
) -> tuple[int, int]:
    """Generate a synthetic asphalt surface image with road damage features."""
    # Base asphalt texture (gray with noise)
    base_color = 60
    img_array = np.random.normal(base_color, 12, (height, width, 3)).clip(0, 255).astype(np.uint8)
    image = Image.fromarray(img_array)
    draw = ImageDraw.Draw(image)

    # Road marking (white lane line on right side)
    lane_x = int(width * 0.85)
    draw.rectangle([lane_x, 0, lane_x + 20, height], fill=(220, 220, 215))

    if add_pothole:
        # Dark irregular ellipse representing a pothole crater
        cx, cy = width // 2, int(height * 0.6)
        rx, ry = int(width * 0.15), int(height * 0.1)
        # Inner crater (dark)
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=(25, 25, 25))
        # Edge lip (slightly lighter highlight)
        draw.arc([cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2], start=30, end=150, fill=(90, 90, 90), width=3)

    if add_crack:
        # Irregular line representing a transverse or longitudinal crack
        points = [
            (int(width * 0.2), int(height * 0.3)),
            (int(width * 0.28), int(height * 0.35)),
            (int(width * 0.35), int(height * 0.42)),
            (int(width * 0.45), int(height * 0.48)),
            (int(width * 0.55), int(height * 0.52)),
        ]
        draw.line(points, fill=(15, 15, 15), width=4)

    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, quality=92)
    return width, height


def create_sample_dataset(data_dir: Path, count: int = 25) -> dict:
    """Create a sample dataset with images and Pascal VOC XML annotations."""
    raw_images_dir = data_dir / "raw" / "India" / "images"
    raw_xml_dir = data_dir / "raw" / "India" / "annotations" / "xmls"
    raw_images_dir.mkdir(parents=True, exist_ok=True)
    raw_xml_dir.mkdir(parents=True, exist_ok=True)

    created_images = []
    classes_generated = {"D40": 0, "D00": 0, "D10": 0, "D20": 0}

    for i in range(1, count + 1):
        filename = f"India_{i:06d}.jpg"
        img_path = raw_images_dir / filename
        xml_path = raw_xml_dir / f"India_{i:06d}.xml"

        has_pothole = (i % 2 == 1) or (i % 5 == 0)
        has_crack = (i % 3 == 0) or (i % 4 == 0)

        w, h = create_sample_road_image(img_path, add_pothole=has_pothole, add_crack=has_crack)
        created_images.append(str(img_path))

        # Generate XML objects
        objects_xml = []
        if has_pothole:
            classes_generated["D40"] += 1
            cx, cy = w // 2, int(h * 0.6)
            rx, ry = int(w * 0.15), int(h * 0.1)
            objects_xml.append(f"""    <object>
        <name>D40</name>
        <pose>Unspecified</pose>
        <truncated>0</truncated>
        <difficult>0</difficult>
        <bndbox>
            <xmin>{cx - rx}</xmin>
            <ymin>{cy - ry}</ymin>
            <xmax>{cx + rx}</xmax>
            <ymax>{cy + ry}</ymax>
        </bndbox>
    </object>""")

        if has_crack:
            classes_generated["D00"] += 1
            objects_xml.append(f"""    <object>
        <name>D00</name>
        <pose>Unspecified</pose>
        <truncated>0</truncated>
        <difficult>0</difficult>
        <bndbox>
            <xmin>{int(w * 0.2)}</xmin>
            <ymin>{int(h * 0.3)}</ymin>
            <xmax>{int(w * 0.55)}</xmax>
            <ymax>{int(h * 0.52)}</ymax>
        </bndbox>
    </object>""")

        xml_content = f"""<annotation>
    <folder>images</folder>
    <filename>{filename}</filename>
    <path>{img_path.resolve()}</path>
    <source>
        <database>RDD2022_India_Sample</database>
    </source>
    <size>
        <width>{w}</width>
        <height>{h}</height>
        <depth>3</depth>
    </size>
    <segmented>0</segmented>
{chr(10).join(objects_xml)}
</annotation>
"""
        with open(xml_path, "w", encoding="utf-8") as f:
            f.write(xml_content)

    return {
        "count": count,
        "images_dir": str(raw_images_dir),
        "xml_dir": str(raw_xml_dir),
        "classes_generated": classes_generated,
    }


if __name__ == "__main__":
    import sys

    target = Path("data/sample")
    info = create_sample_dataset(target, count=30)
    print(f"Created {info['count']} sample road survey images and XML annotations in {target}")
    sys.exit(0)
