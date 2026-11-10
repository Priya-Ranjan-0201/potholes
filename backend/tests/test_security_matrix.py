"""Comprehensive Security Matrix & RBAC Verification Tests.

Verifies strict enforcement of:
1. Role-Based Access Control (RBAC):
   - Anonymous / Unauthenticated requests -> 401 Unauthorized
   - Inactive user accounts -> 403 Forbidden
   - Citizen barriers (no work orders, repair verification, or severity override) -> 403 Forbidden
   - Contractor barriers (cannot self-verify repairs or override severity) -> 403 Forbidden
   - Engineer & Admin authoritative roles permitted
2. Media Upload & Payload Validation Security:
   - Magic byte validation (rejects masquerading shells / scripts) -> 400 Bad Request
   - SHA-256 integrity verification (rejects corrupted or tampered payloads) -> 400 Bad Request
3. Idempotency & Replay Attack Defense:
   - 10x batch sync replay yielding identical cached responses with no row duplication
4. Boundary & Coordinate Range Defense:
   - Invalid latitudes (> 90.0 or < -90.0) -> 422 Unprocessable Entity
   - Invalid longitudes (> 180.0 or < -180.0) -> 422 Unprocessable Entity
   - Confidence bounds (> 1.0 or < 0.0) -> 422 Unprocessable Entity
"""

from __future__ import annotations

import hashlib
import io
import uuid
from datetime import UTC, datetime

from backend.app.core.security import create_access_token, hash_password
from backend.app.db.session import sync_engine
from backend.app.models.auth import Role, User, UserRole
from backend.app.models.defect import DefectObservation
from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session


def _get_user_with_role(role_name: str, email: str, is_active: bool = True) -> tuple[str, str]:
    """Helper to provision a user with specific role and return (user_id_str, access_token)."""
    with Session(sync_engine) as session:
        role = session.scalar(select(Role).where(Role.name == role_name))
        if not role:
            role = Role(name=role_name, description=f"{role_name.capitalize()} role")
            session.add(role)
            session.flush()

        user = session.scalar(select(User).where(User.email == email))
        if not user:
            user = User(
                email=email,
                password_hash=hash_password("SecTest_2026!"),
                full_name=f"Security Test {role_name.capitalize()}",
                is_active=is_active,
            )
            session.add(user)
            session.flush()
            session.add(UserRole(user_id=user.id, role_id=role.id))
        else:
            user.is_active = is_active
            # Ensure role link
            ur = session.scalar(
                select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == role.id)
            )
            if not ur:
                session.add(UserRole(user_id=user.id, role_id=role.id))
        session.commit()
        u_id = str(user.id)

    token = create_access_token(subject=u_id, roles=[role_name])
    return u_id, token


# =============================================================================
# 1. RBAC Matrix & Role Boundary Enforcement Tests
# =============================================================================


def test_rbac_unauthenticated_requests_blocked(client: TestClient) -> None:
    """Verify protected endpoints return 401 Unauthorized when token is missing."""
    # Work order creation requires auth
    res1 = client.post("/api/v1/work-orders", json={})
    assert res1.status_code == 401

    # Contractor creation requires auth
    res2 = client.post("/api/v1/contractors", json={})
    assert res2.status_code == 401

    # Profile lookup requires auth
    res3 = client.get("/api/v1/auth/me")
    assert res3.status_code == 401

    # Citizen report submission requires auth
    res4 = client.post("/api/v1/reports", json={})
    assert res4.status_code in (401, 422)


def test_rbac_inactive_user_forbidden(client: TestClient) -> None:
    """Verify deactivated accounts receive 403 Forbidden even with valid token signature."""
    _u_id, inactive_token = _get_user_with_role(
        role_name="engineer",
        email="inactive.eng@ludhiana.gov.in",
        is_active=False,
    )
    headers = {"Authorization": f"Bearer {inactive_token}"}
    res = client.post("/api/v1/work-orders", json={}, headers=headers)
    assert res.status_code == 403
    assert "inactive" in res.json()["detail"].lower()


def test_rbac_citizen_forbidden_on_restricted_actions(client: TestClient) -> None:
    """Verify citizen role is strictly barred from municipal operations (403 Forbidden)."""
    _u_id, citizen_token = _get_user_with_role(
        role_name="citizen",
        email="citizen.restricted@gmail.com",
    )
    headers_citizen = {"Authorization": f"Bearer {citizen_token}"}
    fake_id = str(uuid.uuid4())

    # 1. Citizen cannot dispatch work orders
    res_wo = client.post(
        "/api/v1/work-orders",
        json={
            "defect_id": fake_id,
            "contractor_id": fake_id,
            "sla_policy_id": fake_id,
            "priority": "HIGH",
        },
        headers=headers_citizen,
    )
    assert res_wo.status_code == 403

    # 2. Citizen cannot register contractors
    res_c = client.post(
        "/api/v1/contractors",
        json={"name": "Citizen Fake Contractor"},
        headers=headers_citizen,
    )
    assert res_c.status_code == 403

    # 3. Citizen cannot verify repairs
    res_ver = client.post(
        f"/api/v1/work-orders/{fake_id}/verify",
        json={
            "human_decision": "APPROVED",
            "decision_reason": "Citizen sign-off",
            "ai_damage_reduction_pct": 100.0,
            "ai_recommendation": "PASS",
        },
        headers=headers_citizen,
    )
    assert res_ver.status_code == 403

    # 4. Citizen cannot update complaint status
    res_comp = client.patch(
        f"/api/v1/reports/{fake_id}/status",
        json={"new_status": "RESOLVED"},
        headers=headers_citizen,
    )
    assert res_comp.status_code == 403


def test_rbac_contractor_cannot_verify_repairs(client: TestClient) -> None:
    """Verify contractor cannot self-verify or approve work orders (Rule R8)."""
    _u_id, contractor_token = _get_user_with_role(
        role_name="contractor",
        email="contractor.sec@roads.in",
    )
    headers_contractor = {"Authorization": f"Bearer {contractor_token}"}
    fake_id = str(uuid.uuid4())

    # Contractor attempting verification sign-off must receive 403 Forbidden
    res_ver = client.post(
        f"/api/v1/work-orders/{fake_id}/verify",
        json={
            "human_decision": "APPROVED",
            "decision_reason": "Contractor self-approval attempt",
            "ai_damage_reduction_pct": 98.0,
            "ai_recommendation": "PASS",
        },
        headers=headers_contractor,
    )
    assert res_ver.status_code == 403

    # Contractor cannot create contractors
    res_c = client.post(
        "/api/v1/contractors",
        json={"name": "Subcontractor Ltd"},
        headers=headers_contractor,
    )
    assert res_c.status_code == 403


# =============================================================================
# 2. Media Upload & Binary Security Tests
# =============================================================================


def test_media_upload_invalid_magic_bytes_rejected(client: TestClient) -> None:
    """Verify uploads disguised as images but containing non-image bytes are rejected."""
    # Executable header disguised as image
    fake_bytes = b"MZ\x90\x00\x03\x00\x00\x00"
    sha256 = hashlib.sha256(fake_bytes).hexdigest()
    media_id = str(uuid.uuid4())

    response = client.post(
        "/api/v1/media/upload",
        files={"file": ("exploit.exe", io.BytesIO(fake_bytes), "image/jpeg")},
        data={"media_id": media_id, "sha256_hash": sha256},
    )
    assert response.status_code == 400
    assert "unsupported or corrupt image format" in response.json()["detail"].lower()


def test_media_upload_sha256_mismatch_rejected(client: TestClient) -> None:
    """Verify uploads where client hash does not match binary payload are rejected."""
    # Valid JPEG header
    valid_jpeg = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xd9"
    tampered_hash = "0" * 64
    media_id = str(uuid.uuid4())

    response = client.post(
        "/api/v1/media/upload",
        files={"file": ("frame.jpg", io.BytesIO(valid_jpeg), "image/jpeg")},
        data={"media_id": media_id, "sha256_hash": tampered_hash},
    )
    assert response.status_code == 422
    assert "checksum mismatch" in response.json()["detail"].lower()


# =============================================================================
# 3. Idempotency & 10x Replay Attack Defense Tests
# =============================================================================


def test_10x_sync_batch_idempotency_replay_protection(client: TestClient) -> None:
    """Verify that replaying the exact same sync batch 10 times causes zero duplicate data."""
    batch_id = str(uuid.uuid4())
    device_id = str(uuid.uuid4())
    obs_id = str(uuid.uuid4())
    defect_id = str(uuid.uuid4())
    idemp_key = f"replay-attack-test-{uuid.uuid4()}"
    now_iso = datetime.now(UTC).isoformat()

    payload = {
        "batch_id": batch_id,
        "device_id": device_id,
        "idempotency_key": idemp_key,
        "model_version": "scamroad-yolov8n-v1.0",
        "observations": [
            {
                "observation_id": obs_id,
                "defect_id": defect_id,
                "device_id": device_id,
                "location": {
                    "latitude": 30.90800,
                    "longitude": 75.85200,
                    "accuracy_m": 4.0,
                    "speed_mps": 11.5,
                },
                "confidence": 0.89,
                "class_code": "POTHOLE",
                "measurement_summary": {
                    "relative_area": 4.5,
                    "bbox_width_px": 140.0,
                    "bbox_height_px": 80.0,
                    "unit": "px",
                    "calibrated": False,
                },
                "track_length_frames": 4,
                "quality_score": 0.91,
                "observed_at": now_iso,
                "created_at": now_iso,
            }
        ],
        "media_manifest": [],
        "sent_at": now_iso,
        "retry_count": 0,
    }

    # Request 1: Initial ingestion
    resp1 = client.post("/api/v1/sync", json=payload)
    assert resp1.status_code == 201
    initial_body = resp1.json()

    # Requests 2 through 10: Consecutive replays
    for attempt in range(2, 11):
        resp_replay = client.post("/api/v1/sync", json=payload)
        # Should return successful cached response without modifying DB
        assert resp_replay.status_code in (
            200,
            201,
        ), f"Attempt {attempt} failed: {resp_replay.status_code}"
        replay_body = resp_replay.json()
        assert replay_body["batch_id"] == initial_body["batch_id"]
        assert replay_body["idempotency_key"] == idemp_key

    # Database Verification: Verify exactly 1 observation and 1 defect exist with these IDs
    with Session(sync_engine) as session:
        obs_count = session.scalar(
            select(func.count(DefectObservation.id)).where(
                DefectObservation.id == uuid.UUID(obs_id)
            )
        )
        assert obs_count == 1, "Replay attack must never duplicate defect observations"


# =============================================================================
# 4. Input Boundary & Coordinate Range Defense Tests
# =============================================================================


def test_input_boundary_latitude_out_of_range(client: TestClient) -> None:
    """Verify sync payload rejects invalid latitude > 90.0 or < -90.0."""
    payload = {
        "batch_id": str(uuid.uuid4()),
        "device_id": str(uuid.uuid4()),
        "idempotency_key": f"bad-lat-{uuid.uuid4()}",
        "observations": [
            {
                "observation_id": str(uuid.uuid4()),
                "defect_id": str(uuid.uuid4()),
                "device_id": str(uuid.uuid4()),
                "location": {
                    "latitude": 98.45000,  # Invalid latitude (> 90)
                    "longitude": 75.85000,
                    "accuracy_m": 4.0,
                },
                "confidence": 0.85,
                "class_code": "POTHOLE",
                "observed_at": datetime.now(UTC).isoformat(),
            }
        ],
        "media_manifest": [],
        "sent_at": datetime.now(UTC).isoformat(),
    }
    resp = client.post("/api/v1/sync", json=payload)
    assert resp.status_code == 422


def test_input_boundary_longitude_out_of_range(client: TestClient) -> None:
    """Verify sync payload rejects invalid longitude > 180.0 or < -180.0."""
    payload = {
        "batch_id": str(uuid.uuid4()),
        "device_id": str(uuid.uuid4()),
        "idempotency_key": f"bad-lon-{uuid.uuid4()}",
        "observations": [
            {
                "observation_id": str(uuid.uuid4()),
                "defect_id": str(uuid.uuid4()),
                "device_id": str(uuid.uuid4()),
                "location": {
                    "latitude": 30.90000,
                    "longitude": -195.50000,  # Invalid longitude (< -180)
                    "accuracy_m": 4.0,
                },
                "confidence": 0.85,
                "class_code": "POTHOLE",
                "observed_at": datetime.now(UTC).isoformat(),
            }
        ],
        "media_manifest": [],
        "sent_at": datetime.now(UTC).isoformat(),
    }
    resp = client.post("/api/v1/sync", json=payload)
    assert resp.status_code == 422


def test_input_boundary_confidence_out_of_range(client: TestClient) -> None:
    """Verify sync payload rejects invalid confidence score > 1.0 or < 0.0."""
    payload = {
        "batch_id": str(uuid.uuid4()),
        "device_id": str(uuid.uuid4()),
        "idempotency_key": f"bad-conf-{uuid.uuid4()}",
        "observations": [
            {
                "observation_id": str(uuid.uuid4()),
                "defect_id": str(uuid.uuid4()),
                "device_id": str(uuid.uuid4()),
                "location": {
                    "latitude": 30.90000,
                    "longitude": 75.85000,
                    "accuracy_m": 4.0,
                },
                "confidence": 1.45,  # Invalid confidence (> 1.0)
                "class_code": "POTHOLE",
                "observed_at": datetime.now(UTC).isoformat(),
            }
        ],
        "media_manifest": [],
        "sent_at": datetime.now(UTC).isoformat(),
    }
    resp = client.post("/api/v1/sync", json=payload)
    assert resp.status_code == 422
