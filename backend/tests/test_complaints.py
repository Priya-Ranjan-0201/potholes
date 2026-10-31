"""Integration tests for citizen reports and complaint state machine."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _get_token(client: TestClient, email: str, role: str) -> str:
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": f"{role.capitalize()} User",
            "role": role,
        },
    )
    return str(resp.json()["access_token"])


def test_citizen_report_submission_and_listing(client: TestClient) -> None:
    """Citizen can submit a report; starts in SUBMITTED state."""
    citizen_token = _get_token(client, "citizen_sub@example.com", "citizen")

    report_payload = {
        "latitude": 30.7333,
        "longitude": 76.7794,
        "description": "Massive pothole near Sector 17 fountain",
        "media_path": "evidence/blurred_pothole1.jpg",
    }
    resp = client.post(
        "/api/v1/reports",
        json=report_payload,
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["status"] == "SUBMITTED"
    assert data["latitude"] == 30.7333
    assert data["longitude"] == 76.7794
    assert len(data["history"]) == 1
    assert data["history"][0]["to_status"] == "SUBMITTED"

    # List reports
    list_resp = client.get("/api/v1/reports")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] >= 1
    assert any(item["id"] == data["id"] for item in list_data["items"])


def test_complaint_state_machine_transitions(client: TestClient) -> None:
    """Validate full state machine transitions and invalid transition rejections."""
    citizen_token = _get_token(client, "citizen_flow@example.com", "citizen")
    engineer_token = _get_token(client, "eng_flow@example.com", "engineer")

    # Submit complaint
    rep = client.post(
        "/api/v1/reports",
        json={"latitude": 30.75, "longitude": 76.80, "description": "Crack on bridge"},
        headers={"Authorization": f"Bearer {citizen_token}"},
    ).json()
    complaint_id = rep["id"]

    # Citizen cannot transition status (403 Forbidden)
    forbidden_resp = client.patch(
        f"/api/v1/reports/{complaint_id}/status",
        json={"new_status": "UNDER_REVIEW"},
        headers={"Authorization": f"Bearer {citizen_token}"},
    )
    assert forbidden_resp.status_code == 403

    # Invalid jump: SUBMITTED -> RESOLVED (422)
    invalid_jump = client.patch(
        f"/api/v1/reports/{complaint_id}/status",
        json={"new_status": "RESOLVED"},
        headers={"Authorization": f"Bearer {engineer_token}"},
    )
    assert invalid_jump.status_code == 422

    # Transition 1: SUBMITTED -> UNDER_REVIEW
    t1 = client.patch(
        f"/api/v1/reports/{complaint_id}/status",
        json={"new_status": "UNDER_REVIEW", "notes": "Assigned to inspection crew"},
        headers={"Authorization": f"Bearer {engineer_token}"},
    )
    assert t1.status_code == 200
    assert t1.json()["status"] == "UNDER_REVIEW"

    # Transition 2: UNDER_REVIEW -> VERIFIED
    t2 = client.patch(
        f"/api/v1/reports/{complaint_id}/status",
        json={"new_status": "VERIFIED"},
        headers={"Authorization": f"Bearer {engineer_token}"},
    )
    assert t2.status_code == 200
    assert t2.json()["status"] == "VERIFIED"

    # Transition 3: VERIFIED -> ASSIGNED
    t3 = client.patch(
        f"/api/v1/reports/{complaint_id}/status",
        json={"new_status": "ASSIGNED"},
        headers={"Authorization": f"Bearer {engineer_token}"},
    )
    assert t3.status_code == 200
    assert t3.json()["status"] == "ASSIGNED"


def test_complaint_rejection_requires_reason(client: TestClient) -> None:
    """Transitioning to REJECTED without reason is rejected with 422."""
    citizen_token = _get_token(client, "citizen_rej@example.com", "citizen")
    admin_token = _get_token(client, "admin_rej@example.com", "admin")

    rep = client.post(
        "/api/v1/reports",
        json={"latitude": 30.70, "longitude": 76.75, "description": "Spam report"},
        headers={"Authorization": f"Bearer {citizen_token}"},
    ).json()
    complaint_id = rep["id"]

    # Reject without reason -> 422
    fail_rej = client.patch(
        f"/api/v1/reports/{complaint_id}/status",
        json={"new_status": "REJECTED"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert fail_rej.status_code == 422

    # Reject with reason -> 200
    ok_rej = client.patch(
        f"/api/v1/reports/{complaint_id}/status",
        json={"new_status": "REJECTED", "rejection_reason": "Duplicate / invalid photo"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert ok_rej.status_code == 200
    assert ok_rej.json()["status"] == "REJECTED"
    assert ok_rej.json()["rejection_reason"] == "Duplicate / invalid photo"
