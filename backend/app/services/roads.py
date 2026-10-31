"""Road network segment snapping and spatial projection service."""

from __future__ import annotations

import math
import re
import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING, Any

from backend.app.models.geo import Department, District, Road, RoadSegment, Ward
from sqlalchemy import select

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class SnappedSegmentResult:
    """Result of snapping a defect coordinate to the road network."""

    segment_id: uuid.UUID
    road_id: uuid.UUID
    road_name: str
    distance_meters: float
    snapped_lat: float
    snapped_lon: float


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great Circle distance between two points in meters."""
    r_earth = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r_earth * c


def parse_linestring_wkt(wkt_or_geom: Any) -> list[tuple[float, float]]:
    """Parse LINESTRING text or WKT into list of (lat, lon) coordinates."""
    if not wkt_or_geom:
        return []

    geom_str = str(wkt_or_geom).strip()
    match = re.search(r"LINESTRING\s*\((.*?)\)", geom_str, re.IGNORECASE)
    if not match:
        return []

    coord_pairs = match.group(1).split(",")
    points: list[tuple[float, float]] = []
    for pair in coord_pairs:
        parts = pair.strip().split()
        if len(parts) >= 2:
            try:
                # WKT is typically (lon lat)
                lon = float(parts[0])
                lat = float(parts[1])
                points.append((lat, lon))
            except ValueError:
                continue
    return points


def point_to_segment_distance_m(
    pt_lat: float, pt_lon: float, seg_lat1: float, seg_lon1: float, seg_lat2: float, seg_lon2: float
) -> tuple[float, float, float]:
    """Find distance in meters and closest snapped point from (pt_lat, pt_lon) to segment."""
    r_earth = 6371000.0
    cos_lat = math.cos(math.radians(pt_lat))

    # Project to metric Cartesian coordinate system centered at (pt_lat, pt_lon)
    def to_xy(lat: float, lon: float) -> tuple[float, float]:
        x = math.radians(lon - pt_lon) * r_earth * cos_lat
        y = math.radians(lat - pt_lat) * r_earth
        return x, y

    def to_latlon(x: float, y: float) -> tuple[float, float]:
        snapped_lat = pt_lat + math.degrees(y / r_earth)
        snapped_lon = pt_lon + math.degrees(x / (r_earth * cos_lat))
        return snapped_lat, snapped_lon

    x1, y1 = to_xy(seg_lat1, seg_lon1)
    x2, y2 = to_xy(seg_lat2, seg_lon2)

    dx = x2 - x1
    dy = y2 - y1
    seg_len_sq = dx * dx + dy * dy

    if seg_len_sq < 1e-6:
        dist = math.hypot(x1, y1)
        return dist, seg_lat1, seg_lon1

    # Project origin (0, 0) onto line segment
    t = -(x1 * dx + y1 * dy) / seg_len_sq
    t = max(0.0, min(1.0, t))

    closest_x = x1 + t * dx
    closest_y = y1 + t * dy
    dist = math.hypot(closest_x, closest_y)
    snapped_lat, snapped_lon = to_latlon(closest_x, closest_y)

    return dist, snapped_lat, snapped_lon


class RoadService:
    """Road network query, caching, and segment snapping service."""

    def __init__(self, max_snap_distance_m: float = 50.0) -> None:
        self.max_snap_distance_m = max_snap_distance_m

    async def snap_to_road_segment(
        self,
        session: AsyncSession,
        lat: float,
        lon: float,
    ) -> SnappedSegmentResult | None:
        """Find the closest road segment to (lat, lon) within maximum snapping threshold."""
        # Query candidate road segments joined with road info
        stmt = select(RoadSegment, Road.name).join(Road, RoadSegment.road_id == Road.id)
        result = await session.execute(stmt)
        rows = result.all()

        best_match: SnappedSegmentResult | None = None
        min_dist = float("inf")

        for segment, road_name in rows:
            pts = parse_linestring_wkt(segment.geometry)
            if len(pts) < 2:
                continue

            for i in range(len(pts) - 1):
                lat1, lon1 = pts[i]
                lat2, lon2 = pts[i + 1]

                dist, snap_lat, snap_lon = point_to_segment_distance_m(
                    lat, lon, lat1, lon1, lat2, lon2
                )

                if dist < min_dist and dist <= self.max_snap_distance_m:
                    min_dist = dist
                    best_match = SnappedSegmentResult(
                        segment_id=segment.id,
                        road_id=segment.road_id,
                        road_name=road_name,
                        distance_meters=round(dist, 2),
                        snapped_lat=round(snap_lat, 7),
                        snapped_lon=round(snap_lon, 7),
                    )

        return best_match

    async def seed_demo_roads_if_empty(self, session: AsyncSession) -> None:
        """Seed initial municipal road network (Ludhiana / GT Road corridor) if absent."""
        existing = await session.execute(select(Road).limit(1))
        if existing.scalar_one_or_none() is not None:
            return

        # 1. Department
        dept = Department(
            name="Municipal Roads & Infrastructure Division",
            code="PWD-ROADS",
        )
        session.add(dept)

        # 2. District & Ward
        district = District(name="Ludhiana", state="Punjab")
        session.add(district)
        await session.flush()

        ward = Ward(district_id=district.id, ward_number=12, name="Civil Lines / Mall Road Ward")
        session.add(ward)
        await session.flush()

        # 3. Roads & Segments
        # GT Road Corridor (Sher Shah Suri Marg) passing through 30.9010, 75.8570
        gt_road = Road(
            name="Grand Trunk Road (NH 44 / Sher Shah Suri Marg)",
            road_code="NH-44",
            ward_id=ward.id,
            geometry="LINESTRING(75.8560 30.9000, 75.8580 30.9030, 75.8600 30.9060)",
        )
        session.add(gt_road)
        await session.flush()

        seg1 = RoadSegment(
            road_id=gt_road.id,
            segment_index=1,
            length_meters=420.0,
            geometry="LINESTRING(75.8560 30.9000, 75.8580 30.9030)",
        )
        seg2 = RoadSegment(
            road_id=gt_road.id,
            segment_index=2,
            length_meters=450.0,
            geometry="LINESTRING(75.8580 30.9030, 75.8600 30.9060)",
        )
        session.add_all([seg1, seg2])

        # Ferozepur Road
        ferozepur_road = Road(
            name="Ferozepur Road (Ludhiana Central)",
            road_code="SH-13",
            ward_id=ward.id,
            geometry="LINESTRING(75.8400 30.8950, 75.8450 30.8970)",
        )
        session.add(ferozepur_road)
        await session.flush()

        seg3 = RoadSegment(
            road_id=ferozepur_road.id,
            segment_index=1,
            length_meters=550.0,
            geometry="LINESTRING(75.8400 30.8950, 75.8450 30.8970)",
        )
        session.add(seg3)

        await session.commit()
