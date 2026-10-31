"""Map GeoJSON and spatial visualization endpoints for Leaflet web/mobile clients."""

from __future__ import annotations

from typing import Any

from backend.app.db.session import get_db
from backend.app.models.defect import Defect, SeverityAssessment
from backend.app.models.geo import Road, RoadSegment
from backend.app.services.dedup import parse_point_wkt
from backend.app.services.roads import parse_linestring_wkt
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


class GeoJSONGeometry(BaseModel):
    """GeoJSON geometry definition."""

    type: str
    coordinates: Any


class GeoJSONFeature(BaseModel):
    """GeoJSON feature with properties."""

    type: str = "Feature"
    id: str | None = None
    geometry: GeoJSONGeometry
    properties: dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    """GeoJSON FeatureCollection."""

    type: str = "FeatureCollection"
    features: list[GeoJSONFeature]


@router.get(
    "/map/geojson",
    response_model=GeoJSONFeatureCollection,
    summary="Get road defects GeoJSON",
    description=(
        "Retrieve defect points formatted as GeoJSON FeatureCollection for interactive "
        "Leaflet maps."
    ),
)
async def get_defects_geojson(
    class_code: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    min_severity: float | None = Query(default=None, ge=0.0, le=100.0),
    min_lon: float | None = Query(default=None),
    min_lat: float | None = Query(default=None),
    max_lon: float | None = Query(default=None),
    max_lat: float | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> GeoJSONFeatureCollection:
    """Query and format defects as GeoJSON features."""
    stmt = select(Defect)

    if status_filter:
        stmt = stmt.where(Defect.status == status_filter.upper())
    if class_code:
        stmt = stmt.where(Defect.class_code == class_code.upper())

    defects = (await db.execute(stmt)).scalars().all()
    features: list[GeoJSONFeature] = []

    for d in defects:
        coords = parse_point_wkt(d.location)
        if not coords:
            continue
        lat, lon = coords

        # Bounding box filter
        if min_lon is not None and lon < min_lon:
            continue
        if max_lon is not None and lon > max_lon:
            continue
        if min_lat is not None and lat < min_lat:
            continue
        if max_lat is not None and lat > max_lat:
            continue

        # Fetch latest severity score
        sev_stmt = (
            select(SeverityAssessment)
            .where(SeverityAssessment.defect_id == d.id)
            .order_by(desc(SeverityAssessment.created_at))
            .limit(1)
        )
        latest_sev = (await db.execute(sev_stmt)).scalar_one_or_none()
        sev_score = latest_sev.normalized_score if latest_sev else None
        sev_level = latest_sev.level if latest_sev else "Unknown"

        if min_severity is not None and (sev_score is None or sev_score < min_severity):
            continue

        road_name = None
        if d.road_segment_id:
            road_stmt = (
                select(Road.name)
                .join(RoadSegment, RoadSegment.road_id == Road.id)
                .where(RoadSegment.id == d.road_segment_id)
            )
            road_name = (await db.execute(road_stmt)).scalar_one_or_none()

        props = {
            "id": str(d.id),
            "class_code": d.class_code,
            "status": d.status,
            "times_seen": d.times_seen,
            "severity_score": sev_score,
            "severity_level": sev_level,
            "first_seen": d.first_seen.isoformat(),
            "last_seen": d.last_seen.isoformat(),
            "road_name": road_name,
        }

        features.append(
            GeoJSONFeature(
                id=str(d.id),
                geometry=GeoJSONGeometry(
                    type="Point",
                    coordinates=[lon, lat],
                ),
                properties=props,
            )
        )

    return GeoJSONFeatureCollection(features=features)


@router.get(
    "/map/roads",
    response_model=GeoJSONFeatureCollection,
    summary="Get road network GeoJSON",
    description="Retrieve road segments as GeoJSON LineStrings for map visualization.",
)
async def get_roads_geojson(
    db: AsyncSession = Depends(get_db),
) -> GeoJSONFeatureCollection:
    """Query road segments formatted as GeoJSON LineStrings."""
    stmt = select(RoadSegment, Road.name, Road.road_code).join(Road, RoadSegment.road_id == Road.id)
    rows = (await db.execute(stmt)).all()

    features: list[GeoJSONFeature] = []
    for segment, road_name, road_code in rows:
        pts = parse_linestring_wkt(segment.geometry)
        if len(pts) < 2:
            continue
        # GeoJSON is [lon, lat]
        coords = [[p[1], p[0]] for p in pts]

        features.append(
            GeoJSONFeature(
                id=str(segment.id),
                geometry=GeoJSONGeometry(
                    type="LineString",
                    coordinates=coords,
                ),
                properties={
                    "segment_id": str(segment.id),
                    "road_name": road_name,
                    "road_code": road_code,
                    "length_meters": segment.length_meters,
                    "segment_index": segment.segment_index,
                },
            )
        )

    return GeoJSONFeatureCollection(features=features)
