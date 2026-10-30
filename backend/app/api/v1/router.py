"""API v1 router registry."""

from backend.app.api.health import router as health_router
from fastapi import APIRouter

api_v1_router = APIRouter()

# Health endpoints available at both /health and /api/v1/health
api_v1_router.include_router(health_router, prefix="", tags=["Health"])
