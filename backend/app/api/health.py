"""Health check API endpoints."""

from datetime import UTC, datetime

from backend.app.core.config import settings
from backend.app.schemas.health import DependencyHealth, HealthResponse
from fastapi import APIRouter, status

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Service Health Check",
    description=(
        "Returns the current operational status, version, and environment of the API service."
    ),
)
async def get_health() -> HealthResponse:
    """Return system health status."""
    return HealthResponse(
        status="ok",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(UTC),
        dependencies={
            "api": DependencyHealth(status="ok", message="API engine running"),
        },
    )
