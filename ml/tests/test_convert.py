"""Unit tests for VOC XML parsing, COCO JSON parsing, and YOLO label conversion."""

import json
from pathlib import Path

import pytest

from ml.data.convert import (
    convert_annotations_directory,
    convert_box_to_yolo,
    convert_coco_json,
    parse_voc_xml,
    remap_yolo_labels,
)


@pytest.fixture
def sample_voc_xml(tmp_path: Path) -> Path:
    """Create a temporary Pascal VOC XML file."""
    xml_content = """<annotation>
    <filename>India_000001.jpg</filename>
    <size>
        <width>640</width>
        <height>640</height>
        <depth>3</depth>
    </size>
    <object>
        <name>D40</name>
        <bndbox>
            <xmin>100</xmin>
            <ymin>200</ymin>
            <xmax>300</xmax>
            <ymax>400</ymax>
        </bndbox>
    </object>
    <object>
        <name>D00</name>
        <bndbox>
            <xmin>50</xmin>
            <ymin>60</ymin>
            <xmax>80</xmax>
            <ymax>120</ymax>
        </bndbox>
    </object>
</annotation>
"""
    xml_file = tmp_path / "India_000001.xml"
    with open(xml_file, "w", encoding="utf-8") as f:
        f.write(xml_content)
    return xml_file


def test_parse_voc_xml(sample_voc_xml: Path) -> None:
    """Test XML parsing extracts filename, dimensions, and objects correctly."""
    parsed = parse_voc_xml(sample_voc_xml)
    assert parsed["filename"] == "India_000001.jpg"
    assert parsed["width"] == 640.0
    assert parsed["height"] == 640.0
    assert len(parsed["objects"]) == 2
    assert parsed["objects"][0]["name"] == "D40"
    assert parsed["objects"][0]["bndbox"] == (100.0, 200.0, 300.0, 400.0)
    assert parsed["objects"][1]["name"] == "D00"


def test_convert_box_to_yolo() -> None:
    """Test standard VOC box conversion to normalized center-based coordinates."""
    box = (100.0, 200.0, 300.0, 400.0)
    img_w, img_h = 640.0, 640.0

    yolo_box = convert_box_to_yolo(box, img_w, img_h)
    assert yolo_box is not None
    xc, yc, w, h = yolo_box

    # Center x: (100+300)/2 = 200 -> 200/640 = 0.3125
    assert pytest.approx(xc, 0.0001) == 200.0 / 640.0
    # Center y: (200+400)/2 = 300 -> 300/640 = 0.46875
    assert pytest.approx(yc, 0.0001) == 300.0 / 640.0
    # Width: (300-100) = 200 -> 200/640 = 0.3125
    assert pytest.approx(w, 0.0001) == 200.0 / 640.0
    # Height: (400-200) = 200 -> 200/640 = 0.3125
    assert pytest.approx(h, 0.0001) == 200.0 / 640.0


def test_convert_box_clamping() -> None:
    """Test that out-of-bounds box coordinates are clamped to [0, width/height]."""
    out_of_bounds_box = (-50.0, -10.0, 700.0, 800.0)
    img_w, img_h = 640.0, 640.0

    yolo_box = convert_box_to_yolo(out_of_bounds_box, img_w, img_h)
    assert yolo_box is not None
    xc, yc, w, h = yolo_box

    assert 0.0 <= xc <= 1.0
    assert 0.0 <= yc <= 1.0
    assert w == 1.0  # Entire clamped width
    assert h == 1.0  # Entire clamped height


def test_convert_box_degraded_rejection() -> None:
    """Test that degraded/inverted boxes return None."""
    # Inverted box (xmin > xmax)
    inverted_box = (300.0, 100.0, 100.0, 200.0)
    assert convert_box_to_yolo(inverted_box, 640.0, 640.0) is None

    # Zero-width box
    zero_width = (100.0, 100.0, 100.0, 200.0)
    assert convert_box_to_yolo(zero_width, 640.0, 640.0) is None


def test_convert_annotations_directory(tmp_path: Path, sample_voc_xml: Path) -> None:
    """Test batch conversion of VOC directory to YOLO directory."""
    xml_dir = tmp_path / "xmls"
    xml_dir.mkdir()
    sample_voc_xml.rename(xml_dir / sample_voc_xml.name)

    out_labels_dir = tmp_path / "yolo_labels"
    summary = convert_annotations_directory(xml_dir, out_labels_dir)

    assert summary["total_xml_files"] == 1
    assert summary["total_objects_parsed"] == 2
    assert summary["total_objects_converted"] == 2
    assert summary["total_objects_dropped"] == 0
    assert summary["per_class_counts"]["POTHOLE"] == 1
    assert summary["per_class_counts"]["CRACK_LONG"] == 1

    out_txt = out_labels_dir / "India_000001.txt"
    assert out_txt.exists()
    with open(out_txt, encoding="utf-8") as f:
        lines = f.readlines()
    assert len(lines) == 2
    # Check class indices 0 (POTHOLE) and 1 (CRACK_LONG)
    assert lines[0].startswith("0 ")
    assert lines[1].startswith("1 ")


def test_convert_coco_json(tmp_path: Path) -> None:
    """Test converting COCO format JSON to YOLO txt files."""
    coco_data = {
        "images": [
            {"id": 1, "file_name": "road_001.jpg", "width": 1000, "height": 800},
            {"id": 2, "file_name": "road_002.jpg", "width": 1000, "height": 800},
        ],
        "categories": [
            {"id": 10, "name": "pothole"},
            {"id": 20, "name": "longitudinal crack"},
        ],
        "annotations": [
            {
                "id": 101,
                "image_id": 1,
                "category_id": 10,
                "bbox": [100, 200, 300, 200],  # [x, y, w, h]
                "area": 60000,
                "iscrowd": 0,
            },
            {
                "id": 102,
                "image_id": 1,
                "category_id": 20,
                "bbox": [500, 100, 50, 400],
                "area": 20000,
                "iscrowd": 0,
            },
        ],
    }

    coco_json_path = tmp_path / "instances_train.json"
    with open(coco_json_path, "w", encoding="utf-8") as f:
        json.dump(coco_data, f)

    out_dir = tmp_path / "coco_yolo_labels"
    summary = convert_coco_json(coco_json_path, out_dir)

    assert summary["format"] == "coco"
    assert summary["total_images"] == 2
    assert summary["total_objects_converted"] == 2
    assert summary["per_class_counts"]["POTHOLE"] == 1
    assert summary["per_class_counts"]["CRACK_LONG"] == 1

    txt1 = out_dir / "road_001.txt"
    assert txt1.exists()
    lines = txt1.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 2
    assert lines[0].startswith("0 ")
    assert lines[1].startswith("1 ")

    # Image 2 has no annotations -> empty txt created (background sample)
    txt2 = out_dir / "road_002.txt"
    assert txt2.exists()
    assert txt2.read_text(encoding="utf-8") == ""


def test_remap_yolo_labels(tmp_path: Path) -> None:
    """Test remapping class indices in existing YOLO txt labels."""
    in_dir = tmp_path / "raw_yolo"
    in_dir.mkdir()

    # Image with class 5 (to be mapped to 0) and class 8 (to be dropped: -1)
    sample_file = in_dir / "img_01.txt"
    sample_file.write_text("5 0.5 0.5 0.2 0.2\n8 0.1 0.1 0.05 0.05\n", encoding="utf-8")

    out_dir = tmp_path / "remapped_yolo"
    summary = remap_yolo_labels(
        input_labels_dir=in_dir,
        output_labels_dir=out_dir,
        class_mapping={5: 0, 8: -1},
    )

    assert summary["total_files"] == 1
    assert summary["total_boxes_processed"] == 2
    assert summary["total_boxes_kept"] == 1
    assert summary["total_boxes_dropped"] == 1

    remapped_file = out_dir / "img_01.txt"
    assert remapped_file.exists()
    lines = remapped_file.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    assert lines[0].startswith("0 ")
