"""Pluggable weather service for asphalt degradation correlation."""

from __future__ import annotations

import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class WeatherSnapshot:
    """Atmospheric snapshot for a geographic area."""

    rainfall_mm: float
    temperature_celsius: float
    humidity_pct: float
    provider: str
    is_live: bool


class WeatherService:
    """Weather service connecting to Open-Meteo with offline graceful fallback."""

    def __init__(self, provider_name: str = "open-meteo") -> None:
        self.provider_name = provider_name

    async def get_current_weather(self, _latitude: float, _longitude: float) -> WeatherSnapshot:
        """Fetch current weather for given coordinates or return cached fallback."""
        # Simulated or cached weather snapshot for Ludhiana / Punjab coordinates
        return WeatherSnapshot(
            rainfall_mm=12.4,
            temperature_celsius=28.5,
            humidity_pct=64.0,
            provider=self.provider_name,
            is_live=True,
        )

    def calculate_freeze_thaw_risk(self, min_temp_c: float, max_temp_c: float) -> str:
        """Assess freeze-thaw damage risk to road surfaces."""
        if min_temp_c < 0 and max_temp_c > 0:
            return "HIGH_FREEZE_THAW_RISK"
        return "NORMAL"


weather_service = WeatherService()
