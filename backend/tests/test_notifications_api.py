"""Integration tests for Notifications and Alerts API."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _get_token(client: TestClient, email: str, role: str) -> tuple[str, str]:
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "Password123!",
            "full_name": f"{role.capitalize()} User",
            "role": role,
        },
    )
    data = resp.json()
    return str(data["access_token"]), str(data["user"]["id"])


def test_notifications_lifecycle(client: TestClient) -> None:
    """Validate notification creation, listing, and read status transition."""
    _, user_id = _get_token(client, "notif_user@example.com", "engineer")

    # Create notification
    create_resp = client.post(
        "/api/v1/notifications",
        json={
            "user_id": user_id,
            "title": "Critical Pothole Alert",
            "message": "High hazard crater detected on GT Road (Arterial).",
            "channel": "IN_APP",
        },
    )
    assert create_resp.status_code == 201
    notif_data = create_resp.json()
    assert notif_data["title"] == "Critical Pothole Alert"
    assert notif_data["is_read"] is False
    notif_id = notif_data["id"]

    # List notifications
    list_resp = client.get("/api/v1/notifications")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert any(n["id"] == notif_id for n in items)

    # Mark as read
    read_resp = client.patch(f"/api/v1/notifications/{notif_id}/read")
    assert read_resp.status_code == 200
    assert read_resp.json()["is_read"] is True
