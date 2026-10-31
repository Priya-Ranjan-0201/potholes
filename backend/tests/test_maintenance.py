"""Integration tests for maintenance work orders and human repair verification (Rule R8)."""

from __future__ import annotations

import uuid

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


def _create_defect_via_sync(client: TestClient) -> str:
    """Helper to ingest a defect through standard sync route."""
    dev_id = str(uuid.uuid4())

    batch = {
        "batch_id": str(uuid.uuid4()),
        "device_id": dev_id,
        "idempotency_key": f"maint-sync-{uuid.uuid4()}",
        "sent_at": "2026-10-31T12:00:00Z",
        "observations": [
            {
                "observation_id": str(uuid.uuid4()),
                "defect_id": str(uuid.uuid4()),
                "device_id": dev_id,
                "location": {
                    "latitude": 30.7333,
                    "longitude": 76.7794,
                    "accuracy_m": 5.0,
                    "speed_mps": 10.0,
                    "heading_deg": 180.0,
                    "altitude_m": 250.0,
                },
                "confidence": 0.88,
                "class_code": "POTHOLE",
                "observed_at": "2026-10-31T11:55:00Z",
            }
        ],
    }
    resp = client.post("/api/v1/sync", json=batch)
    assert resp.status_code == 201, resp.text

    defects_resp = client.get("/api/v1/defects")
    assert defects_resp.status_code == 200
    items = defects_resp.json()["items"]
    assert len(items) > 0
    return str(items[0]["id"])


def test_contractor_and_sla_crud(client: TestClient) -> None:
    """Register contractors and SLA policies."""
    admin_token = _get_token(client, "admin_maint@example.com", "admin")

    # Contractor
    c_resp = client.post(
        "/api/v1/contractors",
        json={
            "name": "Apex Road Infrastructure Ltd",
            "contact_person": "Gurpreet Singh",
            "phone": "+919812345678",
            "email": "apex@roads.in",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert c_resp.status_code == 201
    contractor_id = c_resp.json()["id"]

    # SLA Policy
    sla_resp = client.post(
        "/api/v1/sla-policies",
        json={
            "name": "Critical Emergency 24h",
            "severity_level": "Critical",
            "max_resolution_hours": 24,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert sla_resp.status_code == 201
    sla_id = sla_resp.json()["id"]

    # List
    list_c = client.get("/api/v1/contractors")
    assert list_c.status_code == 200
    assert any(c["id"] == contractor_id for c in list_c.json())

    list_sla = client.get("/api/v1/sla-policies")
    assert list_sla.status_code == 200
    assert any(s["id"] == sla_id for s in list_sla.json())


def test_work_order_lifecycle_and_repair_verification(client: TestClient) -> None:
    """Full work order lifecycle through contractor repair and human verification (Rule R8)."""
    admin_token = _get_token(client, "admin_wo@example.com", "admin")
    contractor_token = _get_token(client, "contractor_wo@example.com", "contractor")

    defect_id = _create_defect_via_sync(client)

    # 1. Create SLA Policy & Contractor
    sla_resp = client.post(
        "/api/v1/sla-policies",
        json={
            "name": "Severe 48h SLA",
            "severity_level": "Severe",
            "max_resolution_hours": 48,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    sla_id = sla_resp.json()["id"]

    c_resp = client.post(
        "/api/v1/contractors",
        json={
            "name": "Northern Asphalt Corp",
            "phone": "+919877777777",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    contractor_id = c_resp.json()["id"]

    # 2. Create Work Order
    wo_resp = client.post(
        "/api/v1/work-orders",
        json={
            "defect_id": defect_id,
            "contractor_id": contractor_id,
            "sla_policy_id": sla_id,
            "priority": "HIGH",
            "estimated_cost": 15000.0,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert wo_resp.status_code == 201
    wo_data = wo_resp.json()
    wo_id = wo_data["id"]
    assert wo_data["status"] == "ASSIGNED"
    assert wo_data["deadline"] is not None  # Auto-computed from SLA hours

    # 3. Transition to IN_PROGRESS
    t1 = client.patch(
        f"/api/v1/work-orders/{wo_id}/status",
        json={"new_status": "IN_PROGRESS", "notes": "Crews dispatched with asphalt roller"},
        headers={"Authorization": f"Bearer {contractor_token}"},
    )
    assert t1.status_code == 200
    assert t1.json()["status"] == "IN_PROGRESS"

    # 4. Attempt direct jump to VERIFIED via status patch is BLOCKED (Rule R8)
    blocked_jump = client.patch(
        f"/api/v1/work-orders/{wo_id}/status",
        json={"new_status": "VERIFIED"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert blocked_jump.status_code in (400, 422)

    # 5. Contractor submits Repair Record
    repair_resp = client.post(
        f"/api/v1/work-orders/{wo_id}/repair",
        json={
            "materials_used": "Hot-mix asphalt 2.5 tons, bitutack primer",
            "actual_cost": 14200.0,
        },
        headers={"Authorization": f"Bearer {contractor_token}"},
    )
    assert repair_resp.status_code == 201
    assert repair_resp.json()["actual_cost"] == 14200.0

    # Verify work order status updated to COMPLETED
    wo_after_repair = client.get(f"/api/v1/work-orders/{wo_id}").json()
    assert wo_after_repair["status"] == "COMPLETED"

    # 6. Authoritative Human Verification (Rule R8)
    verif_resp = client.post(
        f"/api/v1/work-orders/{wo_id}/verify",
        json={
            "ai_damage_reduction_pct": 94.5,
            "ai_recommendation": "PASS",
            "human_decision": "APPROVED",
            "decision_reason": "Visual inspection verified, compaction density tested and approved",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert verif_resp.status_code == 201
    verif_data = verif_resp.json()
    assert verif_data["human_decision"] == "APPROVED"
    assert verif_data["ai_recommendation"] == "PASS"

    # Work order is now VERIFIED
    wo_final = client.get(f"/api/v1/work-orders/{wo_id}").json()
    assert wo_final["status"] == "VERIFIED"
    assert wo_final["verification"] is not None
