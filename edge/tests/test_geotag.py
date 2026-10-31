"""Unit tests for GPS NMEA parsing, accuracy threshold gating, and Kalman filter."""

import numpy as np
import pytest

from edge.agent.geotag import GPSGeotagger, KalmanFilter2D, parse_nmea_coord


def test_parse_nmea_coord() -> None:
    """Verify conversion of NMEA ddmm.mmmm to decimal degrees."""
    # 4807.038, N -> 48 + (7.038 / 60) = 48.1173
    lat = parse_nmea_coord("4807.038", "N")
    assert lat is not None
    assert pytest.approx(lat, 0.0001) == 48.1173

    # 01131.000, E -> 11 + (31.000 / 60) = 11.516666
    lon = parse_nmea_coord("01131.000", "E")
    assert lon is not None
    assert pytest.approx(lon, 0.0001) == 11.516666

    # South coord should be negative
    lat_s = parse_nmea_coord("1200.000", "S")
    assert lat_s is not None
    assert lat_s == -12.0


def test_gps_geotagger_nmea_sentences() -> None:
    """Verify parsing of GGA and RMC NMEA sentences."""
    geotagger = GPSGeotagger(enable_kalman=False)

    # 1. Valid $GPGGA
    gga_line = "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47"
    fix_gga = geotagger.parse_nmea_line(gga_line)
    assert fix_gga is not None
    assert fix_gga.has_fix is True
    assert pytest.approx(fix_gga.latitude, 0.001) == 48.1173
    assert fix_gga.altitude_m == 545.4

    # 2. Valid $GPRMC
    rmc_line = "$GPRMC,123519,A,4807.038,N,01131.000,E,022.4,084.4,230394,003.1,W*6A"
    fix_rmc = geotagger.parse_nmea_line(rmc_line)
    assert fix_rmc is not None
    assert fix_rmc.has_fix is True
    # 22.4 knots * 0.514444 = ~11.52 m/s
    assert pytest.approx(fix_rmc.speed_mps, 0.1) == 11.52
    assert fix_rmc.heading_deg == 84.4


def test_gps_geotagger_accuracy_threshold_rejection() -> None:
    """Verify fixes with poor accuracy (> threshold) are flagged as invalid (SPEC B4)."""
    geotagger = GPSGeotagger(max_accuracy_threshold_m=20.0)

    # Accurate fix (5.0m)
    fix_good = geotagger.update_fix(lat=30.9, lon=75.8, accuracy_m=5.0)
    assert fix_good.has_fix is True

    # Inaccurate fix (45.0m > 20.0m threshold)
    fix_bad = geotagger.update_fix(lat=30.9, lon=75.8, accuracy_m=45.0)
    assert fix_bad.has_fix is False


def test_gps_kalman_filter_smoothing() -> None:
    """Verify Kalman filter smooths noisy measurements."""
    kf = KalmanFilter2D(process_noise_std=0.01)

    raw_points = []
    smoothed_points = []
    for i in range(20):
        # Base coordinate + alternating noise
        noise = 0.0003 if i % 2 == 0 else -0.0003
        raw_lat = 30.0 + (i * 0.00005) + noise
        raw_points.append(raw_lat)

        s_lat, _ = kf.update(
            lat=raw_lat,
            lon=75.0,
            accuracy_m=10.0,
            timestamp=float(i * 0.5),
        )
        smoothed_points.append(s_lat)

    # Standard deviation of second differences (jitter) must be reduced by smoothing
    raw_jitter = np.std(np.diff(raw_points, n=2))
    smooth_jitter = np.std(np.diff(smoothed_points, n=2))
    assert smooth_jitter < raw_jitter
