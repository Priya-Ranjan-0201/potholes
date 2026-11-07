# ScamRoad API Reference (v1.1.0)

## Overview

The ScamRoad API is a high-throughput, async RESTful JSON service built on FastAPI. All API routes are strictly versioned under `/api/v1` (with top-level `/health` exposed for orchestration and Docker healthchecks).

- **Base URL:** `http://localhost:8000/api/v1`
- **Interactive OpenAPI Documentation (Swagger UI):** `http://localhost:8000/api/v1/docs`
- **ReDoc Documentation:** `http://localhost:8000/api/v1/redoc`
- **OpenAPI JSON Spec:** `http://localhost:8000/api/v1/openapi.json`

---

## Standard Error Envelope (Schema Contract A6)

All error responses strictly return the standard error envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description of error.",
    "details": [
      {
        "field": "image",
        "issue": "Payload exceeds maximum allowed size (10 MB)."
      }
    ],
    "request_id": "req-9b8e612c-47ea-43f1-b992"
  }
}
```

### Standard Error Codes

| HTTP Status | Error Code | Description |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Request payload or query parameters failed schema validation. |
| `401` | `UNAUTHORIZED` | Bearer token is missing, malformed, or expired. |
| `403` | `FORBIDDEN` | Authenticated principal has insufficient RBAC privileges. |
| `404` | `NOT_FOUND` | Target entity does not exist. |
| `409` | `CONFLICT` | Resource state conflict (e.g. invalid state machine transition). |
| `429` | `RATE_LIMITED` | Request threshold exceeded; client must respect `Retry-After`. |
| `500` | `INTERNAL_SERVER_ERROR` | Unhandled backend exception; trace ID logged for correlation. |
| `503` | `MODEL_NOT_READY` | Requested ML model is initializing or unavailable. |

---

## Authoritative Endpoint Catalog (38 Verified Endpoints)

### 1. Authentication & RBAC (`/auth`)
- `POST /api/v1/auth/login` — Authenticate user and issue JWT Bearer access + refresh tokens.
- `GET /api/v1/auth/me` — Retrieve active user identity and role assignment.
- `POST /api/v1/auth/refresh` — Issue fresh access token from valid refresh token.
- `POST /api/v1/auth/register` — Register new user account.

### 2. Inference & Media (`/infer`, `/media`)
- `POST /api/v1/infer` — Real-time road damage inference via YOLO11n ONNX runtime with ByteTrack tracking. Returns detections with `is_calibrated: false` and `unit: px_relative_pct` (Rule R4).
- `POST /api/v1/media/upload` — Upload privacy-redacted defect imagery (faces & plates pre-blurred per Rule R6).

### 3. Defect Registry (`/defects`)
- `GET /api/v1/defects` — List defect registry records with spatial bounding box, severity, and status filters.
- `GET /api/v1/defects/{defect_id}` — Retrieve full defect profile, observation history, and GIS coordinates.
- `POST /api/v1/defects/{defect_id}/override-severity` — Authorized engineer manual override of computed severity score.

### 4. Work Orders & Maintenance (`/work-orders`)
- `GET /api/v1/work-orders` — List maintenance work orders with priority and assignment filters.
- `POST /api/v1/work-orders` — Create new maintenance work order.
- `GET /api/v1/work-orders/{work_order_id}` — Get single work order details, audit trail, and assigned contractor.
- `PATCH /api/v1/work-orders/{work_order_id}/status` — Transition work order state (`ASSIGNED` → `IN_PROGRESS` → `REPAIRED`).
- `POST /api/v1/work-orders/{work_order_id}/repair` — Contractor submits post-repair photographic evidence.
- `POST /api/v1/work-orders/{work_order_id}/verify` — **Authoritative Engineer Sign-Off**. Mandatory human verification with before/after evidence to transition to `CLOSED` (Rule R5: AI is strictly prohibited from closing work orders).

### 5. Spatial Telemetry & Pavement Health (`/health-index`, `/forecasts`)
- `GET /api/v1/health-index/{segment_id}` — Computes live Road Health Index ($0 \le \text{RHI} \le 100$).
- `GET /api/v1/forecasts/{segment_id}` — Structural deterioration forecast for pavement maintenance scheduling.

### 6. Citizen Reports & Grievances (`/reports`)
- `POST /api/v1/reports` — Citizen grievance submission with GPS geotag and optional photo upload.
- `GET /api/v1/reports` — List citizen complaints with ward, status, and date filters.
- `PATCH /api/v1/reports/{complaint_id}/status` — Update citizen report lifecycle status (`SUBMITTED` → `TRIAGED` → `RESOLVED`).
- `GET /api/v1/reports/defects.csv` — Export filtered defect registry as municipal CSV.
- `GET /api/v1/reports/executive-summary` — Aggregated ward and road network summary brief.

### 7. Municipal Contractors & SLA Management (`/contractors`, `/sla-policies`)
- `GET /api/v1/contractors` — List registered road maintenance contractors.
- `POST /api/v1/contractors` — Register municipal contractor with license tier.
- `GET /api/v1/sla-policies` — List municipal SLA response time policies.
- `POST /api/v1/sla-policies` — Create SLA resolution policy.

### 8. Municipal Analytics & Statistics (`/stats`)
- `GET /api/v1/stats/overview` — High-level defect counts, active work orders, and network health score.
- `GET /api/v1/stats/trends` — Multi-day temporal trends of detections versus completed repairs.
- `GET /api/v1/stats/wards` — Spatial distribution of defects and repair cost estimates across municipal wards.
- `GET /api/v1/stats/contractors` — Performance metrics, completion velocity, and SLA adherence per contractor.

### 9. Edge Batch Sync (`/sync`)
- `POST /api/v1/sync` — Ingest offline SQLite outbox batches from edge agents. Implements idempotent replay protection via `idempotency_key`.

### 10. Notifications (`/notifications`)
- `GET /api/v1/notifications` — Active alerts and high-severity road defect alerts.
- `POST /api/v1/notifications` — Dispatch alert to municipal response teams.
- `PATCH /api/v1/notifications/{notification_id}/read` — Acknowledge notification.

### 11. System Health (`/health`)
- `GET /api/v1/health` — Subsystem health check (PostGIS connectivity, Redis ping, ML model readiness).
- `GET /health` — High-availability load-balancer probe.
