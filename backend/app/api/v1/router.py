"""API v1 router registry."""

from backend.app.api.health import router as health_router
from backend.app.api.v1.defects import router as defects_router
from backend.app.api.v1.map import router as map_router
from backend.app.api.v1.media import router as media_router
from backend.app.api.v1.sync import router as sync_router
from fastapi import APIRouter

api_v1_router = APIRouter()

# Health endpoints available at both /health and /api/v1/health
api_v1_router.include_router(health_router, prefix="", tags=["Health"])

# Sync Batch Ingestion
api_v1_router.include_router(sync_router, prefix="", tags=["Sync & Ingestion"])

# Media & Evidence
api_v1_router.include_router(media_router, prefix="/media", tags=["Media & Evidence"])

# Defects & Observations
api_v1_router.include_router(defects_router, prefix="", tags=["Defects"])

# Geospatial & Maps
api_v1_router.include_router(map_router, prefix="", tags=["Maps & GeoJSON"])
