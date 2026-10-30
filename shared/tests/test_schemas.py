"""Contract tests for shared JSON schemas and taxonomy.yaml."""

import json
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

SHARED_DIR = Path(__file__).parent.parent
SCHEMAS_DIR = SHARED_DIR / "json-schemas"
TAXONOMY_PATH = SHARED_DIR / "taxonomy.yaml"


def test_taxonomy_valid_yaml() -> None:
    """Verify taxonomy.yaml exists, parses as valid YAML, and has required structure."""
    assert TAXONOMY_PATH.exists(), f"Taxonomy file missing at {TAXONOMY_PATH}"
    with open(TAXONOMY_PATH, encoding="utf-8") as f:
        data = yaml.safe_load(f)

    assert "version" in data
    assert "classes" in data
    assert isinstance(data["classes"], list)
    assert len(data["classes"]) >= 4

    # Validate mandatory fields per class as per B2
    codes = set()
    for item in data["classes"]:
        assert "id" in item
        assert "code" in item
        assert "name" in item
        assert "en" in item["name"]
        assert "hi" in item["name"]
        assert "pa" in item["name"]
        assert "group" in item
        assert "status" in item
        assert item["status"] in ["TRAINED", "LIMITED_DATA", "NOT_AVAILABLE", "EXPERIMENTAL"]
        assert "detector" in item
        assert "color" in item
        assert "severity_base" in item
        codes.add(item["code"])

    # Check Tier 1 and Tier 2 exist
    assert "POTHOLE" in codes
    assert "CRACK_LONG" in codes
    assert "CRACK_TRANS" in codes
    assert "CRACK_ALLIGATOR" in codes


def test_json_schemas_are_valid() -> None:
    """Verify that all JSON schemas in shared/json-schemas are valid JSON schemas."""
    schema_files = list(SCHEMAS_DIR.glob("*.schema.json"))
    assert len(schema_files) >= 4, f"Found {len(schema_files)} schemas; expected at least 4"

    for schema_file in schema_files:
        with open(schema_file, encoding="utf-8") as f:
            schema_data = json.load(f)
        # Check that the schema itself is a valid schema
        Draft202012Validator.check_schema(schema_data)


def test_detection_schema_instance_validation() -> None:
    """Validate a valid detection instance against detection.schema.json."""
    with open(SCHEMAS_DIR / "detection.schema.json", encoding="utf-8") as f:
        schema = json.load(f)

    validator = Draft202012Validator(schema)

    valid_detection = {
        "detection_id": "9f8a8553-6eb8-48b9-873f-e14dfcbf9b11",
        "class_code": "POTHOLE",
        "confidence": 0.88,
        "bbox": {"x1": 120.0, "y1": 340.0, "x2": 250.0, "y2": 480.0},
        "segmentation_mask_rle": None,
        "relative_area": 0.045,
        "measurement": {
            "width_value": 45.0,
            "height_value": 30.0,
            "area_value": 1350.0,
            "unit": "px",
            "calibrated": False,
            "method": None,
            "error_estimate": None,
        },
        "frame_index": 142,
        "timestamp": "2026-10-31T02:00:00Z",
        "model_version": "scamroad-yolov8n-v0.1.0",
    }

    errors = list(validator.iter_errors(valid_detection))
    assert not errors, f"Validation errors on valid detection: {errors}"


def test_detection_schema_calibrated_measurement_validation() -> None:
    """Verify measurement unit and calibrated boolean constraints."""
    with open(SCHEMAS_DIR / "detection.schema.json", encoding="utf-8") as f:
        schema = json.load(f)

    validator = Draft202012Validator(schema)

    # Missing calibrated field should fail
    invalid_detection = {
        "detection_id": "9f8a8553-6eb8-48b9-873f-e14dfcbf9b11",
        "class_code": "POTHOLE",
        "confidence": 0.88,
        "bbox": {"x1": 10.0, "y1": 20.0, "x2": 50.0, "y2": 60.0},
        "measurement": {
            "width_value": 45.0,
            "unit": "cm",
            # missing "calibrated"
        },
        "frame_index": 1,
        "timestamp": "2026-10-31T02:00:00Z",
        "model_version": "v1.0",
    }
    assert list(validator.iter_errors(invalid_detection)), "Should fail when calibrated is missing"
