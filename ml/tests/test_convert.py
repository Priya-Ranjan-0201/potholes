"""Unit tests for VOC XML parsing and YOLO label conversion."""

from pathlib import Path

import pytest

from ml.data.convert import (
    convert_annotations_directory,
    convert_box_to_yolo,
    parse_voc_xml,
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
