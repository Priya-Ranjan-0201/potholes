"""Integration tests for Argon2id authentication, JWT tokens, and RBAC."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_register_user_success(client: TestClient) -> None:
    """Registering a new citizen user returns 201 with valid tokens."""
    payload = {
        "email": "citizen1@example.com",
        "password": "StrongPassword123!",
        "full_name": "Ravi Kumar",
        "phone": "+919876543210",
        "role": "citizen",
    }
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "citizen1@example.com"
    assert data["user"]["full_name"] == "Ravi Kumar"
    assert "citizen" in data["user"]["roles"]


def test_register_duplicate_email_fails(client: TestClient) -> None:
    """Registering duplicate email returns 409 Conflict."""
    payload = {
        "email": "duplicate@example.com",
        "password": "StrongPassword123!",
        "full_name": "Test User",
        "role": "citizen",
    }
    resp1 = client.post("/api/v1/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/v1/auth/register", json=payload)
    assert resp2.status_code == 409


def test_login_success_and_failure(client: TestClient) -> None:
    """Valid credentials return tokens; invalid credentials return 401."""
    reg_payload = {
        "email": "loginuser@example.com",
        "password": "SecurePassword456!",
        "full_name": "Login Tester",
        "role": "engineer",
    }
    client.post("/api/v1/auth/register", json=reg_payload)

    # Valid login
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "SecurePassword456!"},
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data

    # Invalid login
    bad_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "loginuser@example.com", "password": "WrongPassword"},
    )
    assert bad_resp.status_code == 401


def test_refresh_token(client: TestClient) -> None:
    """Exchange refresh token for a new access token."""
    reg_payload = {
        "email": "refresh@example.com",
        "password": "SecurePassword456!",
        "full_name": "Refresh Tester",
        "role": "citizen",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    refresh_token = reg_resp.json()["refresh_token"]

    refresh_resp = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_resp.status_code == 200
    data = refresh_resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_get_me_profile(client: TestClient) -> None:
    """Accessing /auth/me returns profile of authenticated user."""
    reg_payload = {
        "email": "me@example.com",
        "password": "SecurePassword456!",
        "full_name": "Me Tester",
        "role": "admin",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    token = reg_resp.json()["access_token"]

    # Without token -> 401
    resp_no_token = client.get("/api/v1/auth/me")
    assert resp_no_token.status_code == 401

    # With valid token -> 200
    resp_with_token = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp_with_token.status_code == 200
    profile = resp_with_token.json()
    assert profile["email"] == "me@example.com"
    assert "admin" in profile["roles"]
