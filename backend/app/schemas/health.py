"""Health check and standard error response schemas."""

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel, Field


class DependencyHealth(BaseModel):
    """Health status of an external dependency."""

    status: str = Field(description="ok | degraded | down")
    message: str | None = Field(default=None, description="Diagnostic message or latency")


class HealthResponse(BaseModel):
    """Response returned by GET /health."""

    status: str = Field(default="ok", description="Overall service status: ok | degraded | down")
    version: str = Field(description="Application version")
    environment: str = Field(description="Running environment")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        description="UTC timestamp of the check",
    )
    dependencies: dict[str, DependencyHealth] = Field(
        default_factory=dict,
        description="Health status of external dependencies (db, redis, storage)",
    )


class ErrorDetail(BaseModel):
    """Standard error detail envelope complying with A6."""

    code: str = Field(description="Machine-readable error code")
    message: str = Field(description="Human-readable error description")
    details: dict[str, Any] | None = Field(
        default=None, description="Detailed field-level errors or context"
    )
    request_id: str | None = Field(default=None, description="Correlation ID for tracing")


class ErrorResponse(BaseModel):
    """Standard error envelope for all error responses."""

    error: ErrorDetail
