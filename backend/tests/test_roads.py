"""Unit tests for Road snapping and geodesic calculations."""

from __future__ import annotations

import pytest
from backend.app.services.roads import (
    haversine_distance_m,
    parse_linestring_wkt,
    point_to_segment_distance_m,
)


def test_haversine_known_coordinates() -> None:
    """Test Great Circle distance calculation between known landmarks."""
    # Delhi to Ludhiana ~ 288 km
    dist = haversine_distance_m(28.6139, 77.2090, 30.9010, 75.8573)
    assert 280_000.0 < dist < 300_000.0

    # Same point should be 0 meters
    assert haversine_distance_m(30.9010, 75.8573, 30.9010, 75.8573) == pytest.approx(0.0)


def test_parse_linestring_wkt() -> None:
    """Test parsing of WKT LINESTRING into coordinate pairs."""
    wkt = "LINESTRING(75.8560 30.9000, 75.8580 30.9030, 75.8600 30.9060)"
    pts = parse_linestring_wkt(wkt)

    assert len(pts) == 3
    # Check that lat, lon order is preserved
    assert pts[0] == (30.9000, 75.8560)
    assert pts[1] == (30.9030, 75.8580)
    assert pts[2] == (30.9060, 75.8600)


def test_point_to_segment_distance() -> None:
    """Test distance and orthogonal projection from a test point to a line segment."""
    # Segment from (30.9000, 75.8560) to (30.9030, 75.8580)
    seg_lat1, seg_lon1 = 30.9000, 75.8560
    seg_lat2, seg_lon2 = 30.9030, 75.8580

    # Point right on the midpoint of the segment
    mid_lat = (seg_lat1 + seg_lat2) / 2.0
    mid_lon = (seg_lon1 + seg_lon2) / 2.0

    dist, snap_lat, snap_lon = point_to_segment_distance_m(
        mid_lat, mid_lon, seg_lat1, seg_lon1, seg_lat2, seg_lon2
    )
    assert dist < 1.0  # Should be practically 0 distance
    assert snap_lat == pytest.approx(mid_lat, abs=1e-4)
    assert snap_lon == pytest.approx(mid_lon, abs=1e-4)

    # Point slightly offset by ~15 meters
    offset_lat = mid_lat + 0.000135  # ~15 meters north
    dist_offset, snap_lat_off, _snap_lon_off = point_to_segment_distance_m(
        offset_lat, mid_lon, seg_lat1, seg_lon1, seg_lat2, seg_lon2
    )
    assert 5.0 < dist_offset < 15.0
    assert snap_lat_off == pytest.approx(mid_lat, abs=2e-4)
