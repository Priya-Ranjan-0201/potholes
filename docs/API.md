# ScamRoad API Reference

## Overview

The ScamRoad API is a RESTful JSON API served by FastAPI. All endpoints are
versioned under the `/api/v1` prefix.

**Base URL:** `http://localhost:8000/api/v1`

---

## Error Envelope

All error responses follow a consistent envelope format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable error description.",
    "details": [
      {
        "field": "image",
        "issue": "File size exceeds 10 MB limit."
      }
    ],
    "request_id": "req_abc123def456"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `error.code` | string | Machine-readable error code (e.g., `VALIDATION_ERROR`, `NOT_FOUND`, `MODEL_NOT_READY`, `UNAUTHORIZED`, `RATE_LIMITED`). |
| `error.message` | string | Human-readable description of the error. |
| `error.details` | array \| null | Optional array of field-level error details. |
| `error.request_id` | string | Unique request identifier for debugging and log correlation. |

### Standard Error Codes

| HTTP Status | Error Code | Description |
|------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request body or parameters failed validation. |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication token. |
| 403 | `FORBIDDEN` | Authenticated but insufficient permissions. |
| 404 | `NOT_FOUND` | Requested resource does not exist. |
| 409 | `CONFLICT` | Resource state conflict (e.g., duplicate submission). |
| 429 | `RATE_LIMITED` | Too many requests. Check `Retry-After` header. |
| 503 | `MODEL_NOT_READY` | ML model is not loaded. Check `Retry-After` header. |

---

## Currently Available Endpoints

### `GET /api/v1/health`

Health check endpoint. Always available, no authentication required.

**Response (200 OK):**

```json
{
  "status": "healthy",
  "version": "0.1.0",
  "service": "scamroad-api"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Service health status. One of: `healthy`, `degraded`, `unhealthy`. |
| `version` | string | Application version (semver). |
| `service` | string | Service identifier. |

**Example:**

```bash
curl http://localhost:8000/api/v1/health
```

---

## Planned Endpoints

> **Note:** The following endpoints will be implemented in Phase 4–8. They are
> listed here for planning purposes and are subject to change.

### Phase 4 — Backend Core

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/images` | Upload an image with GPS metadata for detection. |
| `GET` | `/api/v1/images` | List uploaded images (paginated, filterable). |
| `GET` | `/api/v1/images/{id}` | Get image details and associated detections. |
| `GET` | `/api/v1/detections` | List detections (paginated, filterable by class/severity/area). |
| `GET` | `/api/v1/detections/{id}` | Get single detection detail. |

### Phase 6 — API Hardening

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Register a new user account. |
| `POST` | `/api/v1/auth/login` | Authenticate and receive JWT tokens. |
| `POST` | `/api/v1/auth/refresh` | Refresh an expired access token. |
| `GET` | `/api/v1/reports` | List damage reports (paginated). |
| `POST` | `/api/v1/reports` | Create a new damage report from detections. |
| `PATCH` | `/api/v1/reports/{id}` | Update report status or assignment. |
| `GET` | `/api/v1/stats/overview` | Aggregate statistics (counts, severity distribution). |
| `GET` | `/api/v1/stats/ward/{ward_id}` | Ward-level damage statistics. |
| `GET` | `/api/v1/stats/trends` | Time-series trend data. |

---

## Authentication

> **Status:** Planned but not yet implemented (Phase 6).

Authentication will use **JWT Bearer tokens** in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Token lifecycle:**
- **Access token:** 15-minute expiry. Required for all authenticated endpoints.
- **Refresh token:** 7-day expiry. Used to obtain new access tokens without
  re-entering credentials.

**Roles:**
| Role | Permissions |
|------|------------|
| `citizen` | Upload images, view own submissions, view public stats. |
| `engineer` | All citizen permissions + view all detections, manage reports. |
| `admin` | All engineer permissions + user management, system configuration. |

Until Phase 6, all endpoints are unauthenticated. The health endpoint will
remain public permanently.

---

## Pagination

Paginated endpoints accept these query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-indexed). |
| `per_page` | integer | 20 | Items per page (max 100). |

Responses include pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 142,
    "pages": 8
  }
}
```

Standard `Link` headers are also returned for API clients that prefer them.

---

## Rate Limiting

| Context | Limit |
|---------|-------|
| Authenticated user | 60 requests / minute |
| Anonymous / unauthenticated | 10 requests / minute |

When rate-limited, the API returns `429 RATE_LIMITED` with a `Retry-After`
header indicating seconds to wait.
