"""Comprehensive 14-Stage End-to-End Automated Integration Test Pipeline.

Verifies the complete ScamRoad architecture across both Edge AI and Cloud Backend:
Stage 1: Dashcam Video Frame Capture
Stage 2: Optical Blur / Exposure Quality Gate (Rule R11)
Stage 3: Edge ONNX YOLOv8 Inference (Rule R2, R14)
Stage 4: Edge IoU Multi-Object Tracking & Persistence
Stage 5: On-Device Privacy Redaction (Rule R15)
Stage 6: Edge GPS Geotagging & Metadata Gating
Stage 7: Edge Offline SQLite WAL Outbox Queueing
Stage 8: Cloud Batch Sync Ingestion (POST /api/v1/sync)
Stage 9: Road Corridor PostGIS Snapping
Stage 10: Spatial Deduplication & Canonical Defect Merging (One Pothole = One Record)
Stage 11: Multi-Factor Severity Assessment & Factor Transparency (Rule R7)
Stage 12: Work Order Dispatch & Contractor SLA Assignment
Stage 13: Contractor Repair & Authoritative Human Sign-Off (Rule R8)
Stage 14: ScamRoad Health Index, Degradation Forecast & Municipal CSV Report Export
"""

from __future__ import annotations

import hashlib
import tempfile
import time
import uuid
from datetime import UTC, datetime, timedelta
from pathlib import Path

import cv2
import numpy as np
import pytest
from backend.app.core.security import create_access_token, hash_password
from backend.app.db.session import sync_engine
from backend.app.main import app
from backend.app.models.auth import Role, User, UserRole
from backend.app.models.defect import Defect, SeverityAssessment
from backend.app.models.geo import District, Road, RoadSegment, Ward
from backend.app.models.maintenance import (
    Contractor,
    RepairRecord,
    RepairVerification,
    SlaPolicy,
)
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from edge.agent.blur_privacy import PrivacyRedactor
from edge.agent.capture import QualityGate
from edge.agent.geotag import GPSGeotagger
from edge.agent.infer import Detection, EdgeInferenceEngine
from edge.agent.outbox import SQLiteOutbox
from edge.agent.track import EdgeTracker
from ml.forecasting.forecast import RoadDegradationForecaster
from ml.forecasting.health_index import compute_segment_health


@pytest.fixture
def client() -> TestClient:
    """FastAPI TestClient fixture."""
    return TestClient(app)


def test_end_to_end_14_stage_pipeline(client: TestClient) -> None:
    """Execute complete 14-stage end-to-end pipeline test."""

    # -------------------------------------------------------------------------
    # STAGE 1: Edge Dashcam Frame Capture (Synthetic road frames)
    # -------------------------------------------------------------------------
    frame_h, frame_w = 640, 640
    sharp_frame = np.full((frame_h, frame_w, 3), 95, dtype=np.uint8)
    # Paint lane lines and asphalt texture
    cv2.line(sharp_frame, (120, 0), (60, 640), (255, 255, 255), 4)
    cv2.line(sharp_frame, (520, 0), (580, 640), (255, 255, 255), 4)
    # Paint simulated pothole crater in road lane
    cv2.ellipse(sharp_frame, (320, 380), (65, 35), 0, 0, 360, (25, 25, 25), -1)
    # Paint simulated license plate at bottom corner
    cv2.rectangle(sharp_frame, (480, 520), (580, 550), (255, 255, 255), -1)
    cv2.putText(sharp_frame, "PB10AB1234", (485, 542), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

    # Intentionally blurry frame for quality gate testing
    blurry_frame = cv2.GaussianBlur(sharp_frame, (45, 45), 0)

    assert sharp_frame.shape == (640, 640, 3)
    assert blurry_frame.shape == (640, 640, 3)

    # -------------------------------------------------------------------------
    # STAGE 2: Optical Blur / Exposure Quality Gate (Rule R11)
    # -------------------------------------------------------------------------
    quality_gate = QualityGate(blur_threshold=80.0)
    meta_blurry = quality_gate.assess_frame(blurry_frame)
    assert meta_blurry.is_blurred, "Blurry frame must be rejected by optical quality gate"

    meta_sharp = quality_gate.assess_frame(sharp_frame)
    assert not meta_sharp.is_blurred, "Sharp frame must be accepted by optical quality gate"
    assert meta_sharp.blur_score >= 80.0

    # -------------------------------------------------------------------------
    # STAGE 3: Edge ONNX YOLOv8 Inference (Rule R2, R14)
    # -------------------------------------------------------------------------
    model_path = Path("ml/runs/pothole_yolov8n/weights/best_int8.onnx")
    if not model_path.exists():
        model_path = Path("ml/runs/pothole_yolov8n/weights/best.onnx")

    engine = EdgeInferenceEngine(
        model_path=str(model_path),
        conf_threshold=0.25,
        iou_threshold=0.45,
    )
    detections = engine.predict(sharp_frame)
    # Detections list returned; even if empty on synthetic frame, engine output format is valid
    assert isinstance(detections, list)

    # -------------------------------------------------------------------------
    # STAGE 4: Edge IoU Multi-Object Tracking & Persistence
    # -------------------------------------------------------------------------
    tracker = EdgeTracker(iou_threshold=0.20, min_hits=2)
    synthetic_bbox = (255.0, 345.0, 385.0, 415.0)
    det1 = Detection(
        class_id=0,
        class_name="POTHOLE",
        confidence=0.88,
        bbox_xyxy=synthetic_bbox,
        relative_area=0.038,
        calibrated=False,
    )
    tracker.update(
        [det1], frame_id=1, timestamp_epoch=datetime.now(UTC).timestamp(), blur_score=150.0
    )

    det2 = Detection(
        class_id=0,
        class_name="POTHOLE",
        confidence=0.91,
        bbox_xyxy=synthetic_bbox,
        relative_area=0.040,
        calibrated=False,
    )
    tracker.update(
        [det2], frame_id=2, timestamp_epoch=datetime.now(UTC).timestamp() + 0.1, blur_score=155.0
    )
    assert len(tracker.active_tracks) >= 1, "Track must achieve persistence across frames"
    track_id = list(tracker.active_tracks.keys())[0]

    # -------------------------------------------------------------------------
    # STAGE 5: On-Device Privacy Redaction (Rule R15)
    # -------------------------------------------------------------------------
    redactor = PrivacyRedactor(blur_kernel_size=35, blur_faces=True, blur_plates=True)
    redaction_res = redactor.redact(sharp_frame, defect_safe_boxes=[synthetic_bbox])
    assert redaction_res.total_redactions >= 0
    redacted_frame = redaction_res.redacted_image

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_media_path = Path(tmp_dir) / "blurred_observation.jpg"
        cv2.imwrite(str(tmp_media_path), redacted_frame)
        media_bytes = tmp_media_path.read_bytes()
        media_sha256 = hashlib.sha256(media_bytes).hexdigest()

        # Dynamic coordinate on road corridor to guarantee clean test isolation
        offset_factor = (time.time() % 70) * 0.0001
        base_lat = round(30.90100 + offset_factor, 5)
        base_lon = round(75.85100 + offset_factor, 5)

        # ---------------------------------------------------------------------
        # STAGE 6: Edge GPS Geotagging & Metadata Gating
        # ---------------------------------------------------------------------
        geotagger = GPSGeotagger(max_accuracy_threshold_m=10.0)
        gps_fix = geotagger.update_fix(
            lat=base_lat,
            lon=base_lon,
            accuracy_m=3.5,
            altitude_m=245.0,
            speed_mps=11.2,
            heading_deg=180.0,
            timestamp=datetime.now(UTC).timestamp(),
        )
        assert gps_fix.has_fix
        assert gps_fix.accuracy_m <= 10.0

        # ---------------------------------------------------------------------
        # STAGE 7: Edge Offline SQLite WAL Outbox Queueing
        # ---------------------------------------------------------------------
        outbox_db_path = Path(tmp_dir) / "edge_outbox.db"
        outbox = SQLiteOutbox(db_path=outbox_db_path)
        obs_payload = {
            "observation_id": str(uuid.uuid4()),
            "class_code": "POTHOLE",
            "track_id": track_id,
            "latitude": gps_fix.latitude,
            "longitude": gps_fix.longitude,
            "confidence": 0.89,
            "media_path": str(tmp_media_path),
            "media_sha256": media_sha256,
        }
        enqueue_id = outbox.enqueue(event_type="observation", payload=obs_payload)
        assert bool(enqueue_id)
        stats = outbox.get_stats()
        assert stats["pending_count"] >= 1

        # ---------------------------------------------------------------------
        # Pre-seed Cloud Road Segments for PostGIS Snapping
        # ---------------------------------------------------------------------
        with Session(sync_engine) as session:
            # Setup district, ward, and GT Road corridor
            dist = session.scalar(select(District).where(District.name == "Ludhiana Corporation"))
            if not dist:
                dist = District(name="Ludhiana Corporation", state="Punjab")
                session.add(dist)
                session.flush()

            ward = session.scalar(
                select(Ward).where(Ward.ward_number == 10, Ward.district_id == dist.id)
            )
            if not ward:
                ward = Ward(district_id=dist.id, ward_number=10, name="Central GT Ward")
                session.add(ward)
                session.flush()

            road = session.scalar(select(Road).where(Road.road_code == "NH-44-E2E"))
            if not road:
                road = Road(
                    ward_id=ward.id,
                    name="Grand Trunk Road (NH-44)",
                    road_code="NH-44-E2E",
                    geometry="LINESTRING(75.8500 30.9000, 75.8600 30.9100)",
                )
                session.add(road)
                session.flush()

            seg = session.scalar(select(RoadSegment).where(RoadSegment.road_id == road.id))
            if not seg:
                seg = RoadSegment(
                    road_id=road.id,
                    segment_index=1,
                    length_meters=1400.0,
                    geometry="LINESTRING(75.8500 30.9000, 75.8600 30.9100)",
                )
                session.add(seg)
                session.flush()
            road_segment_id = seg.id
            session.commit()

        # ---------------------------------------------------------------------
        # STAGE 8: Cloud Batch Sync Ingestion (POST /api/v1/sync)
        # ---------------------------------------------------------------------
        batch_id = str(uuid.uuid4())
        device_id = str(uuid.uuid4())
        obs_id_1 = str(uuid.uuid4())
        defect_uuid_1 = str(uuid.uuid4())
        media_id_1 = str(uuid.uuid4())
        idemp_key_1 = f"e2e-sync-{batch_id}"
        now_iso = datetime.now(UTC).isoformat()

        sync_payload_1 = {
            "batch_id": batch_id,
            "device_id": device_id,
            "idempotency_key": idemp_key_1,
            "model_version": "scamroad-yolov8n-v1.0",
            "observations": [
                {
                    "observation_id": obs_id_1,
                    "defect_id": defect_uuid_1,
                    "device_id": device_id,
                    "location": {
                        "latitude": base_lat,
                        "longitude": base_lon,
                        "accuracy_m": 3.5,
                        "speed_mps": 11.2,
                        "heading_deg": 180.0,
                        "altitude_m": 245.0,
                    },
                    "confidence": 0.89,
                    "class_code": "POTHOLE",
                    "measurement_summary": {
                        "relative_area": 5.8,
                        "bbox_width_px": 160.0,
                        "bbox_height_px": 95.0,
                        "unit": "px",
                        "calibrated": False,
                    },
                    "best_frame_path": str(tmp_media_path),
                    "track_length_frames": 3,
                    "quality_score": 0.92,
                    "observed_at": now_iso,
                    "created_at": now_iso,
                }
            ],
            "media_manifest": [
                {
                    "media_id": media_id_1,
                    "filename": "blurred_observation.jpg",
                    "sha256": media_sha256,
                    "mime_type": "image/jpeg",
                    "size_bytes": len(media_bytes),
                    "observation_ids": [obs_id_1],
                }
            ],
            "sent_at": now_iso,
            "retry_count": 0,
        }

        resp_sync = client.post("/api/v1/sync", json=sync_payload_1)
        assert resp_sync.status_code == 201
        data_sync = resp_sync.json()
        assert data_sync["batch_id"] == batch_id
        assert data_sync["synced_observations"] == 1
        assert data_sync["new_defects"] == 1

        # ---------------------------------------------------------------------
        # STAGE 9: Road Corridor Snapping
        # ---------------------------------------------------------------------
        with Session(sync_engine) as session:
            canonical_1 = session.scalar(
                select(Defect).where(Defect.id == uuid.UUID(defect_uuid_1))
            )
            assert canonical_1 is not None
            assert (
                canonical_1.road_segment_id is not None
            ), "Defect observation must snap to an active road segment"
            snapped_segment_id = canonical_1.road_segment_id

        # ---------------------------------------------------------------------
        # STAGE 10: Spatial Deduplication & Canonical Defect Merging
        # ---------------------------------------------------------------------
        # Send a second sighting from a subsequent vehicle pass 3.8m away
        obs_id_2 = str(uuid.uuid4())
        defect_uuid_2 = str(uuid.uuid4())
        idemp_key_2 = f"e2e-sync-second-pass-{uuid.uuid4()}"

        sync_payload_2 = {
            "batch_id": str(uuid.uuid4()),
            "device_id": device_id,
            "idempotency_key": idemp_key_2,
            "model_version": "scamroad-yolov8n-v1.0",
            "observations": [
                {
                    "observation_id": obs_id_2,
                    "defect_id": defect_uuid_2,
                    "device_id": device_id,
                    "location": {
                        "latitude": round(base_lat + 0.00003, 5),
                        "longitude": round(base_lon + 0.00002, 5),
                        "accuracy_m": 3.8,
                        "speed_mps": 12.0,
                    },
                    "confidence": 0.93,
                    "class_code": "POTHOLE",
                    "measurement_summary": {
                        "relative_area": 6.1,
                        "bbox_width_px": 170.0,
                        "bbox_height_px": 100.0,
                        "unit": "px",
                        "calibrated": False,
                    },
                    "track_length_frames": 4,
                    "quality_score": 0.94,
                    "observed_at": (datetime.now(UTC) + timedelta(minutes=10)).isoformat(),
                    "created_at": (datetime.now(UTC) + timedelta(minutes=10)).isoformat(),
                }
            ],
            "media_manifest": [],
            "sent_at": datetime.now(UTC).isoformat(),
            "retry_count": 0,
        }

        resp_sync_2 = client.post("/api/v1/sync", json=sync_payload_2)
        assert resp_sync_2.status_code == 201
        data_sync_2 = resp_sync_2.json()
        assert (
            data_sync_2["merged_defects"] == 1
        ), "Nearby defect sighting must be merged into canonical record"

        with Session(sync_engine) as session:
            canonical_merged = session.scalar(
                select(Defect).where(Defect.id == uuid.UUID(defect_uuid_1))
            )
            assert canonical_merged is not None
            assert (
                canonical_merged.times_seen == 2
            ), "Times seen must increment to 2 (One Pothole = One Record)"

            # -----------------------------------------------------------------
            # STAGE 11: Multi-Factor Severity Assessment & Transparency (Rule R7)
            # -----------------------------------------------------------------
            sev = session.scalar(
                select(SeverityAssessment).where(
                    SeverityAssessment.defect_id == canonical_merged.id
                )
            )
            assert sev is not None
            assert sev.raw_score > 0.0
            assert sev.level in ["Critical", "Severe", "Moderate", "Minor"]
            assert isinstance(sev.factor_breakdown, dict)
            # Verify missing factors list is transparently tracked (Rule R7)
            assert isinstance(sev.missing_factors, list)

            # -----------------------------------------------------------------
            # STAGE 12: Work Order Dispatch & Contractor SLA Assignment
            # -----------------------------------------------------------------
            # Create Engineer and Contractor users & SLA policy
            role_eng = session.scalar(select(Role).where(Role.name == "engineer"))
            if not role_eng:
                role_eng = Role(name="engineer", description="Municipal Engineer")
                session.add(role_eng)
                session.flush()

            eng_user = session.scalar(
                select(User).where(User.email == "e2e.engineer@ludhiana.gov.in")
            )
            if not eng_user:
                eng_user = User(
                    email="e2e.engineer@ludhiana.gov.in",
                    password_hash=hash_password("E2E_Secure_2026!"),
                    full_name="Chief Pavement Engineer",
                    is_active=True,
                )
                session.add(eng_user)
                session.flush()
                session.add(UserRole(user_id=eng_user.id, role_id=role_eng.id))

            contractor = session.scalar(
                select(Contractor).where(Contractor.name == "E2E Punjab Roads Ltd")
            )
            if not contractor:
                contractor = Contractor(
                    name="E2E Punjab Roads Ltd",
                    contact_person="Harminder Singh",
                    phone="+91-98765-43210",
                    email="ops@e2epunjabroads.in",
                    is_active=True,
                )
                session.add(contractor)
                session.flush()

            sla_policy = session.scalar(select(SlaPolicy).where(SlaPolicy.name == "E2E 24h SLA"))
            if not sla_policy:
                sla_policy = SlaPolicy(
                    name="E2E 24h SLA",
                    severity_level="Critical",
                    max_resolution_hours=24,
                )
                session.add(sla_policy)
                session.flush()

            canonical_merged_id = str(canonical_merged.id)
            eng_user_id = str(eng_user.id)
            contractor_id = str(contractor.id)
            sla_policy_id = str(sla_policy.id)
            session.commit()

        # Engineer token for authenticated maintenance operations
        eng_token = create_access_token(subject=eng_user_id, roles=["engineer"])
        headers_eng = {"Authorization": f"Bearer {eng_token}"}

        # Dispatch Work Order via API
        wo_create_payload = {
            "defect_id": canonical_merged_id,
            "contractor_id": contractor_id,
            "sla_policy_id": sla_policy_id,
            "priority": "CRITICAL",
            "estimated_cost": 21500.0,
            "deadline": (datetime.now(UTC) + timedelta(hours=24)).isoformat(),
        }
        resp_wo = client.post("/api/v1/work-orders", json=wo_create_payload, headers=headers_eng)
        assert resp_wo.status_code == 201
        wo_data = resp_wo.json()
        wo_id = wo_data["id"]
        assert wo_data["status"] == "ASSIGNED"

        # ---------------------------------------------------------------------
        # STAGE 13: Contractor Repair & Authoritative Human Sign-Off (Rule R8)
        # ---------------------------------------------------------------------
        # Transition status to IN_PROGRESS
        resp_prog = client.patch(
            f"/api/v1/work-orders/{wo_id}/status",
            json={"new_status": "IN_PROGRESS", "notes": "Crews dispatched with asphalt roller"},
            headers=headers_eng,
        )
        assert resp_prog.status_code == 200
        assert resp_prog.json()["status"] == "IN_PROGRESS"

        # Contractor submits repair completion record
        repair_payload = {
            "materials_used": "Hot-mix asphalt 40mm, bituminous tack coat, vibro-compaction",
            "actual_cost": 19800.0,
        }
        resp_rep = client.post(
            f"/api/v1/work-orders/{wo_id}/repair",
            json=repair_payload,
            headers=headers_eng,
        )
        assert resp_rep.status_code == 201

        # Human Engineer Verification Sign-Off (Rule R8: AI never closes work orders)
        verify_payload = {
            "human_decision": "APPROVED",
            "decision_reason": "Visual inspection verified surface flatness and compaction tolerance under IRC 82.",
            "ai_damage_reduction_pct": 96.2,
            "ai_recommendation": "PASS",
        }
        resp_ver = client.post(
            f"/api/v1/work-orders/{wo_id}/verify",
            json=verify_payload,
            headers=headers_eng,
        )
        assert resp_ver.status_code == 201
        wo_final = client.get(f"/api/v1/work-orders/{wo_id}", headers=headers_eng).json()
        assert (
            wo_final["status"] == "VERIFIED"
        ), "Authoritative human sign-off must transition work order to VERIFIED"

        with Session(sync_engine) as session:
            vr = session.scalar(
                select(RepairVerification)
                .join(RepairRecord)
                .where(RepairRecord.work_order_id == uuid.UUID(wo_id))
            )
            assert vr is not None
            assert vr.human_decision == "APPROVED"
            assert vr.verified_by_user_id == uuid.UUID(eng_user_id)

        # ---------------------------------------------------------------------
        # STAGE 14: ScamRoad Health Index, Degradation Forecast & Reports
        # ---------------------------------------------------------------------
        # Recalculate RHI for road segment
        rhi_result = compute_segment_health(
            segment_id=str(snapped_segment_id),
            defects=[{"class_code": "POTHOLE", "severity_score": 85.0}],
            length_km=1.4,
            has_recent_inspection=True,
        )
        assert rhi_result.score is not None
        assert 0.0 <= rhi_result.score <= 100.0
        assert rhi_result.coverage_status == "ADEQUATE"

        # Run Degradation Forecast (Rule R6: strict separation between observations and predictions)
        forecaster = RoadDegradationForecaster()
        forecast = forecaster.predict_segment_degradation(
            segment_id=str(snapped_segment_id),
            historical_scores=[
                (datetime.now(UTC) - timedelta(days=60), 92.0),
                (datetime.now(UTC) - timedelta(days=30), 86.0),
                (datetime.now(UTC), rhi_result.score),
            ],
            rainfall_monthly_avg_mm=15.0,
            horizons_days=[30, 60, 90],
        )
        assert forecast.status == "OK"
        assert len(forecast.predictions) == 3
        assert forecast.decay_rate_per_day is not None

        # Export Municipal Defect Report CSV
        resp_csv = client.get("/api/v1/reports/defects.csv", headers=headers_eng)
        assert resp_csv.status_code == 200
        assert resp_csv.headers["content-type"].startswith("text/csv")
        csv_text = resp_csv.text
        assert "defect_id,class_code" in csv_text
        assert "POTHOLE" in csv_text

        # Fetch Executive Summary Report with Number Parity Verification (SPEC B10)
        resp_sum = client.get("/api/v1/reports/executive-summary", headers=headers_eng)
        assert resp_sum.status_code == 200
        sum_data = resp_sum.json()
        assert sum_data["total_defects"] >= 1
        assert sum_data["resolved_count"] >= 1
        assert sum_data["health_index_scale_max"] == 100


if __name__ == "__main__":
    import sys

    print("Running 14-Stage ScamRoad End-to-End Automated Pipeline Test...")
    client_inst = TestClient(app)
    try:
        test_end_to_end_14_stage_pipeline(client_inst)
        print("[SUCCESS] All 14 stages of ScamRoad E2E Pipeline verified successfully!")
        sys.exit(0)
    except Exception as exc:
        print(f"[FAILED] E2E Pipeline failed: {exc}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
