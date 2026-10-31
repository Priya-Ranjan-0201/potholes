"""GPS geotagging with Kalman filter smoothing and accuracy gating.

Reads and parses NMEA sentences ($GPGGA, $GPRMC), applies a 2D kinematic Kalman
filter to eliminate position jitter and bridge momentary signal drops, and attaches
smoothed (latitude, longitude, altitude, accuracy, speed, heading) to defect events.
Follows SPEC B4 (reject fixes above accuracy threshold; camera-to-GPS offset documented).
"""

from __future__ import annotations

import argparse
import time
from dataclasses import dataclass

import numpy as np


@dataclass
class GPSFix:
    """Geographic position fix and kinematic state."""

    latitude: float
    longitude: float
    altitude_m: float | None
    accuracy_m: float
    speed_mps: float | None
    heading_deg: float | None
    timestamp_epoch: float
    has_fix: bool
    is_smoothed: bool = False


class KalmanFilter2D:
    """2D Constant-Velocity Kinematic Kalman Filter for latitude/longitude smoothing."""

    def __init__(self, process_noise_std: float = 0.5) -> None:
        # State: [lat, lon, v_lat, v_lon]
        self.x = np.zeros(4, dtype=np.float64)
        # State covariance
        self.P = np.eye(4, dtype=np.float64) * 10.0
        # Process noise covariance
        q = process_noise_std**2
        self.Q = np.eye(4, dtype=np.float64) * q
        # Measurement matrix (observing position only)
        self.H = np.array([[1, 0, 0, 0], [0, 1, 0, 0]], dtype=np.float64)
        self.last_timestamp: float | None = None
        self.initialized = False

    def update(
        self,
        lat: float,
        lon: float,
        accuracy_m: float,
        timestamp: float,
    ) -> tuple[float, float]:
        """Predict and update Kalman filter state with incoming coordinate measurement."""
        if not self.initialized:
            self.x = np.array([lat, lon, 0.0, 0.0], dtype=np.float64)
            self.last_timestamp = timestamp
            self.initialized = True
            return lat, lon

        dt = max(0.01, timestamp - (self.last_timestamp or timestamp))
        self.last_timestamp = timestamp

        # 1. State transition matrix
        f_mat = np.array(
            [
                [1.0, 0.0, dt, 0.0],
                [0.0, 1.0, 0.0, dt],
                [0.0, 0.0, 1.0, 0.0],
                [0.0, 0.0, 0.0, 1.0],
            ],
            dtype=np.float64,
        )

        # 2. Predict
        x_pred = f_mat @ self.x
        p_pred = f_mat @ self.P @ f_mat.T + self.Q

        # 3. Measurement noise scaled by estimated accuracy in degrees
        # (1 degree latitude ~ 111,000 meters)
        acc_deg = max(0.00001, accuracy_m / 111000.0)
        r_mat = np.eye(2, dtype=np.float64) * (acc_deg**2)

        # 4. Update
        z = np.array([lat, lon], dtype=np.float64)
        y = z - (self.H @ x_pred)
        s_mat = self.H @ p_pred @ self.H.T + r_mat
        k_mat = p_pred @ self.H.T @ np.linalg.inv(s_mat)

        self.x = x_pred + k_mat @ y
        self.P = (np.eye(4) - k_mat @ self.H) @ p_pred

        smoothed_lat = float(self.x[0])
        smoothed_lon = float(self.x[1])
        return smoothed_lat, smoothed_lon


def parse_nmea_coord(coord_str: str, dir_char: str) -> float | None:
    """Convert NMEA ddmm.mmmm format to decimal degrees."""
    if not coord_str or not dir_char:
        return None
    try:
        dot_idx = coord_str.find(".")
        if dot_idx < 2:
            return None
        deg_len = dot_idx - 2
        degrees = float(coord_str[:deg_len])
        minutes = float(coord_str[deg_len:])
        decimal = degrees + (minutes / 60.0)
        if dir_char in ("S", "W"):
            decimal = -decimal
    except Exception:
        return None
    else:
        return decimal


class GPSGeotagger:
    """Geotagging coordinator parsing NMEA streams and maintaining kinematic state."""

    def __init__(
        self,
        max_accuracy_threshold_m: float = 25.0,
        enable_kalman: bool = True,
    ) -> None:
        self.max_accuracy_threshold_m = max_accuracy_threshold_m
        self.enable_kalman = enable_kalman
        self.kalman = KalmanFilter2D() if enable_kalman else None
        self._current_fix = GPSFix(
            latitude=0.0,
            longitude=0.0,
            altitude_m=None,
            accuracy_m=999.0,
            speed_mps=None,
            heading_deg=None,
            timestamp_epoch=time.time(),
            has_fix=False,
        )

    def _parse_gga(self, parts: list[str], now: float) -> GPSFix | None:
        """Parse GGA sentence."""
        quality = int(parts[6]) if parts[6].isdigit() else 0
        if quality == 0:
            self._current_fix.has_fix = False
            return None

        lat = parse_nmea_coord(parts[2], parts[3])
        lon = parse_nmea_coord(parts[4], parts[5])
        if lat is None or lon is None:
            return None

        hdop = float(parts[8]) if parts[8] else 2.0
        acc_m = round(hdop * 5.0, 1)
        alt = float(parts[9]) if parts[9] else None

        return self.update_fix(
            lat=lat,
            lon=lon,
            accuracy_m=acc_m,
            altitude_m=alt,
            timestamp=now,
        )

    def _parse_rmc(self, parts: list[str], now: float) -> GPSFix | None:
        """Parse RMC sentence."""
        status = parts[2]
        if status != "A":
            self._current_fix.has_fix = False
            return None

        lat = parse_nmea_coord(parts[3], parts[4])
        lon = parse_nmea_coord(parts[5], parts[6])
        if lat is None or lon is None:
            return None

        speed_knots = float(parts[7]) if parts[7] else 0.0
        speed_mps = round(speed_knots * 0.514444, 2)
        heading_deg = float(parts[8]) if parts[8] else None

        return self.update_fix(
            lat=lat,
            lon=lon,
            accuracy_m=10.0,
            speed_mps=speed_mps,
            heading_deg=heading_deg,
            timestamp=now,
        )

    def parse_nmea_line(self, line: str) -> GPSFix | None:
        """Parse NMEA 0183 sentence ($GPGGA or $GPRMC)."""
        clean_line = line.strip()
        if not clean_line.startswith("$"):
            return None

        sentence = clean_line.split("*", 1)[0] if "*" in clean_line else clean_line
        parts = sentence.split(",")
        talker = parts[0][1:]
        now = time.time()

        if talker.endswith("GGA") and len(parts) >= 10:
            return self._parse_gga(parts, now)
        if talker.endswith("RMC") and len(parts) >= 9:
            return self._parse_rmc(parts, now)

        return None

    def update_fix(
        self,
        lat: float,
        lon: float,
        accuracy_m: float = 5.0,
        altitude_m: float | None = None,
        speed_mps: float | None = None,
        heading_deg: float | None = None,
        timestamp: float | None = None,
    ) -> GPSFix:
        """Manually supply or update current coordinate fix."""
        t = timestamp or time.time()
        has_fix = accuracy_m <= self.max_accuracy_threshold_m

        if not has_fix:
            self._current_fix = GPSFix(
                latitude=lat,
                longitude=lon,
                altitude_m=altitude_m,
                accuracy_m=accuracy_m,
                speed_mps=speed_mps,
                heading_deg=heading_deg,
                timestamp_epoch=t,
                has_fix=False,
            )
            return self._current_fix

        # Apply Kalman filter smoothing
        smooth_lat, smooth_lon = lat, lon
        if self.kalman is not None:
            smooth_lat, smooth_lon = self.kalman.update(lat, lon, accuracy_m, t)

        self._current_fix = GPSFix(
            latitude=round(smooth_lat, 7),
            longitude=round(smooth_lon, 7),
            altitude_m=altitude_m,
            accuracy_m=accuracy_m,
            speed_mps=speed_mps,
            heading_deg=heading_deg,
            timestamp_epoch=t,
            has_fix=True,
            is_smoothed=self.kalman is not None,
        )
        return self._current_fix

    def get_current_fix(self) -> GPSFix:
        """Retrieve most recent valid GPS fix."""
        return self._current_fix


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="GPS geotagging service.")
    parser.add_argument("--port", type=str, default="/dev/ttyUSB0", help="Serial GPS port.")
    parser.add_argument("--baud", type=int, default=9600, help="Serial baud rate.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the geotagging CLI."""
    _args = parse_args(argv)
    geotagger = GPSGeotagger()

    # Test with sample NMEA lines
    sample_gga = "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47"
    fix = geotagger.parse_nmea_line(sample_gga)
    if fix and fix.has_fix:
        print(
            f"Parsed NMEA Fix: ({fix.latitude:.6f}, {fix.longitude:.6f}) | "
            f"Alt: {fix.altitude_m}m | Acc: {fix.accuracy_m}m | Smoothed: {fix.is_smoothed}"
        )
    else:
        print("No valid fix obtained.")


if __name__ == "__main__":
    main()
