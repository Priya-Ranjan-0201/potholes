"""API v1 router registry."""

from backend.app.api.health import router as health_router
from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.complaints import router as complaints_router
from backend.app.api.v1.defects import router as defects_router
from backend.app.api.v1.forecasts import router as forecasts_router
from backend.app.api.v1.maintenance import router as maintenance_router
from backend.app.api.v1.map import router as map_router
from backend.app.api.v1.media import router as media_router
from backend.app.api.v1.notifications import router as notifications_router
from backend.app.api.v1.reports import router as reports_router
from backend.app.api.v1.stats import router as stats_router
from backend.app.api.v1.sync import router as sync_router
from backend.app.api.v1.infer import router as infer_router
from backend.app.api.v1.benchmarks import router as benchmarks_router
from backend.app.api.v1.verification import router as verification_router
from backend.app.api.v1.drift import router as drift_router
from fastapi import APIRouter

api_v1_router = APIRouter()

# Health endpoints available at both /health and /api/v1/health
api_v1_router.include_router(health_router, prefix="", tags=["Health"])

# Real-Time AI Inference (YOLO + Surface Edge CV)
api_v1_router.include_router(infer_router, prefix="", tags=["AI Inference"])

# AI-Powered Road Repair Verification (Module v12)
api_v1_router.include_router(verification_router, prefix="", tags=["Repair Verification"])

# Model Benchmarks & Edge Telemetry (Rule R1 & Rule P4)
api_v1_router.include_router(benchmarks_router, prefix="", tags=["Model Benchmarks"])

# Model Drift, Continuous Monitoring & Governance
api_v1_router.include_router(drift_router, prefix="/drift", tags=["Model Drift & Monitoring"])

# Authentication & RBAC
api_v1_router.include_router(auth_router, prefix="", tags=["Authentication & RBAC"])

# Sync Batch Ingestion
api_v1_router.include_router(sync_router, prefix="", tags=["Sync & Ingestion"])

# Media & Evidence
api_v1_router.include_router(media_router, prefix="/media", tags=["Media & Evidence"])

# Defects & Observations
api_v1_router.include_router(defects_router, prefix="", tags=["Defects"])

# Citizen Reports & Complaints State Machine
api_v1_router.include_router(complaints_router, prefix="", tags=["Citizen Complaints"])

# Maintenance & Work Orders
api_v1_router.include_router(maintenance_router, prefix="", tags=["Maintenance & Work Orders"])

# Geospatial & Maps
api_v1_router.include_router(map_router, prefix="", tags=["Maps & GeoJSON"])

# Analytics & Statistics
api_v1_router.include_router(stats_router, prefix="/stats", tags=["Analytics & Statistics"])

# Road Health Index & Forecasts (Rule R6)
api_v1_router.include_router(forecasts_router, prefix="", tags=["Forecasts & Health Index"])

# Municipal Reporting & Exports (SPEC B10)
api_v1_router.include_router(reports_router, prefix="", tags=["Municipal Reports"])

# Alerts & Notifications
api_v1_router.include_router(notifications_router, prefix="", tags=["Notifications"])
