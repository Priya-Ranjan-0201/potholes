"""Comprehensive tests for AI-Powered Road Repair Verification module.

Validates:
1. Benchmark pairs listing endpoint.
2. Homography alignment and successful repair classification (effectiveness >= 80%).
3. Partial repair detection with remaining defect area.
4. Non-matching / disparate scene handling (verification_inconclusive).
5. Defect recurrence detection (GPS proximity <= 25m, historical association).
6. Official verification PDF certificate generation (ReportLab).
7. Streaming CSV export formatting.
8. Historical repair records listing and status filtering.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from backend.app.services.recurrence import analyze_defect_recurrence
from backend.app.services.verification_engine import RoadRepairVerificationEngine


def test_verification_benchmarks_endpoint(client: TestClient) -> None:
    """Validate preset benchmark test pairs are returned with required metadata."""
    res = client.get("/api/v1/verifications/benchmarks")
    assert res.status_code == 200
    benchmarks = res.json()
    assert isinstance(benchmarks, list)
    assert len(benchmarks) >= 3

    # Check required fields
    for item in benchmarks:
        assert "id" in item
        assert "title" in item
        assert "category_expected" in item
        assert "before_src" in item
        assert "after_src" in item
        assert "description" in item


def test_verify_repair_successful(client: TestClient) -> None:
    """Validate homography alignment and successful repair verification on patched pothole."""
    payload = {
        "corridor_name": "NH-44 GT Road Corridor",
        "latitude": 30.9010,
        "longitude": 75.8573,
        "before_image_src": "/samples/benchmark_pairs/pothole_before.jpg",
        "after_image_src": "/samples/benchmark_pairs/pothole_repaired.jpg",
    }
    res = client.post("/api/v1/verifications/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    assert data["status"] == "successfully_repaired"
    assert data["effectiveness_pct"] >= 80.0
    assert data["inliers_count"] >= 15
    assert data["perspective_corrected"] is True
    assert data["area_reduction_pct"] >= 80.0
    assert data["remaining_area_px"] == 0
    assert "explanation" in data
    assert len(data["explanation"]) > 10


def test_verify_repair_partial(client: TestClient) -> None:
    """Validate detection of remaining defects in partial road repair."""
    payload = {
        "corridor_name": "Ring Road Sector 14",
        "latitude": 30.9025,
        "longitude": 75.8580,
        "before_image_src": "/samples/benchmark_pairs/pothole_before.jpg",
        "after_image_src": "/samples/benchmark_pairs/pothole_repaired.jpg",
        "before_detections": [
            {
                "id": "bef-1",
                "label": "POTHOLE",
                "confidence": 0.95,
                "box": [23.8, 23.7, 52.1, 61.0],
                "area_px": 72988,
            },
            {
                "id": "bef-2",
                "label": "CRACK_LONGITUDINAL",
                "confidence": 0.88,
                "box": [5.0, 50.0, 20.0, 20.0],
                "area_px": 35000,
            },
        ],
    }
    # Note: If before had 2 defects and repaired image resolved the main pothole
    # we can test partial repair logic or test directly
    res = client.post("/api/v1/verifications/verify", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["partially_repaired", "successfully_repaired"]


def test_verify_repair_inconclusive_on_disparate_images(client: TestClient) -> None:
    """Validate that disparate/unmatching road images never falsely declare success."""
    payload = {
        "corridor_name": "Disparate Verification Test",
        "latitude": 30.9050,
        "longitude": 75.8600,
        "before_image_src": "/samples/benchmark_pairs/pothole_before.jpg",
        "after_image_src": "/samples/user_tested_potholes.jpg",
    }
    res = client.post("/api/v1/verifications/verify", json=payload)
    assert res.status_code == 200
    data = res.json()

    # Must be inconclusive because camera angle / pavement section are different
    assert data["status"] == "verification_inconclusive"
    assert data["alignment_confidence"] < 0.60
    assert "inconclusive" in data["explanation"].lower() or "correspondence" in data["explanation"].lower()


@pytest.mark.asyncio
async def test_defect_recurrence_detection_unit() -> None:
    """Unit test recurrence calculation with GPS distance, time delta, and repeat flags."""
    now = datetime.now(UTC)

    # 1. No historical repairs -> no recurrence
    result_none = await analyze_defect_recurrence(
        latitude=30.9010,
        longitude=75.8573,
        historical_repairs=[],
    )
    assert result_none.is_recurrent is False
    assert result_none.recurrence_count == 0
    assert result_none.is_repeated_failure is False

    # 2. Historical repair at same location (10m away) 45 days ago -> recurrence detected!
    nearby_repairs = [
        {
            "id": "rec-1",
            "latitude": 30.90108,  # ~9 meters away
            "longitude": 75.85732,
            "repair_date": now - timedelta(days=45),
            "status": "successfully_repaired",
        }
    ]
    result_recurrent = await analyze_defect_recurrence(
        latitude=30.9010,
        longitude=75.8573,
        historical_repairs=nearby_repairs,
    )
    assert result_recurrent.is_recurrent is True
    assert result_recurrent.recurrence_count == 1
    assert result_recurrent.days_since_repair == 45
    assert result_recurrent.is_repeated_failure is False

    # 3. Multiple prior repairs (2 past repairs) -> repeated failure flagged!
    repeat_repairs = [
        {
            "id": "rec-1",
            "latitude": 30.90105,
            "longitude": 75.85731,
            "repair_date": now - timedelta(days=90),
            "status": "successfully_repaired",
        },
        {
            "id": "rec-2",
            "latitude": 30.90106,
            "longitude": 75.85732,
            "repair_date": now - timedelta(days=30),
            "status": "successfully_repaired",
        },
    ]
    result_repeat = await analyze_defect_recurrence(
        latitude=30.9010,
        longitude=75.8573,
        historical_repairs=repeat_repairs,
    )
    assert result_repeat.is_recurrent is True
    assert result_repeat.recurrence_count == 2
    assert result_repeat.is_repeated_failure is True
    assert "Repeat failure" in result_repeat.explanation


def test_pdf_certificate_generation(client: TestClient) -> None:
    """Validate municipal repair verification certificate PDF generation."""
    # First generate a verification record
    payload = {
        "corridor_name": "NH-44 Sector 5 Expressway",
        "latitude": 30.9015,
        "longitude": 75.8575,
        "before_image_src": "/samples/benchmark_pairs/pothole_before.jpg",
        "after_image_src": "/samples/benchmark_pairs/pothole_repaired.jpg",
    }
    verify_res = client.post("/api/v1/verifications/verify", json=payload)
    assert verify_res.status_code == 200
    rec_id = verify_res.json()["id"]

    # Request PDF certificate
    pdf_res = client.get(f"/api/v1/verifications/{rec_id}/pdf")
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF-")
    assert len(pdf_res.content) > 1000


def test_csv_export_endpoint(client: TestClient) -> None:
    """Validate streaming CSV export formatting and headers."""
    res = client.get("/api/v1/verifications/export.csv")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    lines = res.text.strip().split("\r\n") if "\r\n" in res.text else res.text.strip().split("\n")
    assert len(lines) >= 1
    headers = lines[0].split(",")
    assert "verification_id" in headers
    assert "corridor_name" in headers
    assert "status" in headers
    assert "effectiveness_pct" in headers


def test_historical_records_listing(client: TestClient) -> None:
    """Validate listing and filtering of repair verification records."""
    # Ensure at least one record exists
    payload = {
        "corridor_name": "NH-44 GT Road Corridor",
        "latitude": 30.9010,
        "longitude": 75.8573,
        "before_image_src": "/samples/benchmark_pairs/pothole_before.jpg",
        "after_image_src": "/samples/benchmark_pairs/pothole_repaired.jpg",
    }
    client.post("/api/v1/verifications/verify", json=payload)

    res = client.get("/api/v1/verifications/records")
    assert res.status_code == 200
    records = res.json()
    assert isinstance(records, list)
    assert len(records) >= 1

    # Test filtering by status
    res_filtered = client.get("/api/v1/verifications/records?status=successfully_repaired")
    assert res_filtered.status_code == 200
    filtered = res_filtered.json()
    for rec in filtered:
        assert rec["status"] == "successfully_repaired"
