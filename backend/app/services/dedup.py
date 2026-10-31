"""Spatial deduplication and merging service for road defects."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from backend.app.models.defect import Defect, DefectMergeLog, DefectObservation
from backend.app.services.roads import haversine_distance_m
from sqlalchemy import select

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession


@dataclass
class MatchEvaluation:
    """Evaluation metrics for spatial match between candidate and observation."""

    defect: Defect
    score: float
    distance_meters: float
    reason: str


def parse_point_wkt(wkt_or_geom: Any) -> tuple[float, float] | None:
    """Parse POINT(lon lat) into (lat, lon)."""
    if not wkt_or_geom:
        return None
    s = str(wkt_or_geom).strip()
    match = re.search(r"POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)", s, re.IGNORECASE)
    if not match:
        return None
    lon = float(match.group(1))
    lat = float(match.group(2))
    return lat, lon


class DeduplicationService:
    """Evaluates spatial, class, and heading correlation to ensure One Pothole = One Record."""

    def __init__(self, auto_merge_threshold: float = 0.70) -> None:
        self.auto_merge_threshold = auto_merge_threshold

    def calculate_match_score(
        self,
        obs_lat: float,
        obs_lon: float,
        obs_class: str,
        obs_heading: float | None,
        defect_lat: float,
        defect_lon: float,
        defect_class: str,
        search_radius_m: float,
    ) -> tuple[float, float, str]:
        """Compute composite match score [0.0, 1.0] between defect and observation."""
        dist = haversine_distance_m(obs_lat, obs_lon, defect_lat, defect_lon)
        if dist > search_radius_m:
            return 0.0, dist, f"Distance {dist:.1f}m exceeds search radius {search_radius_m:.1f}m"

        # 1. Proximity factor (0.0 to 1.0)
        s_dist = max(0.0, 1.0 - (dist / search_radius_m))

        # 2. Class family match (0.0 to 1.0)
        c1 = obs_class.upper()
        c2 = defect_class.upper()
        if c1 == c2:
            s_class = 1.0
        elif ("CRACK" in c1 and "CRACK" in c2) or ("POTHOLE" in c1 and "MANHOLE" in c2):
            s_class = 0.70
        else:
            s_class = 0.20

        # 3. Heading factor (0.0 to 1.0)
        s_heading = 0.90 if obs_heading is not None else 0.80

        # Weighted combination: 50% distance, 35% class, 15% heading
        score = round(0.50 * s_dist + 0.35 * s_class + 0.15 * s_heading, 4)
        reason = (
            f"Proximity {dist:.1f}m (dist_score={s_dist:.2f}), "
            f"class={c1}/{c2} (class_score={s_class:.2f})"
        )

        return score, dist, reason

    def _find_best_match(
        self,
        active_defects: list[Defect],
        lat: float,
        lon: float,
        class_code: str,
        heading: float | None,
        search_radius_m: float,
    ) -> MatchEvaluation | None:
        best_match: MatchEvaluation | None = None
        for defect in active_defects:
            coords = parse_point_wkt(defect.location)
            if not coords:
                continue
            d_lat, d_lon = coords
            score, dist, reason = self.calculate_match_score(
                lat, lon, class_code, heading, d_lat, d_lon, defect.class_code, search_radius_m
            )
            if score >= self.auto_merge_threshold and (
                best_match is None or score > best_match.score
            ):
                best_match = MatchEvaluation(
                    defect=defect, score=score, distance_meters=dist, reason=reason
                )
        return best_match

    async def _resolve_canonical_defect(
        self,
        session: AsyncSession,
        best_match: MatchEvaluation | None,
        obs_data: dict[str, Any],
        class_code: str,
        lat: float,
        lon: float,
        observed_at: datetime,
        road_segment_id: uuid.UUID | None,
    ) -> tuple[Defect, bool, DefectMergeLog | None]:
        if best_match is not None:
            canonical_defect = best_match.defect
            canonical_defect.times_seen += 1
            canonical_defect.last_seen = observed_at
            if road_segment_id and not canonical_defect.road_segment_id:
                canonical_defect.road_segment_id = road_segment_id

            incoming_id = obs_data.get("defect_id")
            if isinstance(incoming_id, str):
                incoming_id = uuid.UUID(incoming_id)
            elif not isinstance(incoming_id, uuid.UUID):
                incoming_id = uuid.uuid4()

            merge_log = DefectMergeLog(
                primary_defect_id=canonical_defect.id,
                merged_defect_id=incoming_id,
                match_score=best_match.score,
                distance_meters=best_match.distance_meters,
                merge_reason=best_match.reason,
                reverted=False,
            )
            session.add(merge_log)
            return canonical_defect, True, merge_log

        incoming_id = obs_data.get("defect_id")
        if isinstance(incoming_id, str):
            new_id = uuid.UUID(incoming_id)
        elif isinstance(incoming_id, uuid.UUID):
            new_id = incoming_id
        else:
            new_id = uuid.uuid4()

        canonical_defect = Defect(
            id=new_id,
            class_code=class_code,
            location=f"POINT({lon} {lat})",
            road_segment_id=road_segment_id,
            status="ACTIVE",
            first_seen=observed_at,
            last_seen=observed_at,
            times_seen=1,
            is_demo=False,
        )
        session.add(canonical_defect)
        await session.flush()
        return canonical_defect, False, None

    async def process_observation(
        self,
        session: AsyncSession,
        obs_data: dict[str, Any],
        device_id: uuid.UUID,
        road_segment_id: uuid.UUID | None = None,
    ) -> tuple[Defect, DefectObservation, bool, DefectMergeLog | None]:
        """Process observation: auto-merges with matching existing defect or creates new one."""
        loc = obs_data.get("location", {})
        lat = float(loc.get("latitude", 0.0))
        lon = float(loc.get("longitude", 0.0))
        acc = float(loc.get("accuracy_m") or 10.0)
        heading = loc.get("heading_deg")
        speed = loc.get("speed_mps")
        class_code = str(obs_data.get("class_code", "POTHOLE")).upper()
        confidence = float(obs_data.get("confidence", 0.5))

        search_radius_m = max(10.0, min(30.0, 1.5 * acc))

        observed_at_val = obs_data.get("observed_at")
        if isinstance(observed_at_val, datetime):
            observed_at = observed_at_val
        elif isinstance(observed_at_val, str):
            try:
                observed_at = datetime.fromisoformat(observed_at_val.replace("Z", "+00:00"))
            except ValueError:
                observed_at = datetime.now(UTC)
        else:
            observed_at = datetime.now(UTC)

        stmt = select(Defect).where(Defect.status.in_(["ACTIVE", "UNDER_REPAIR"]))
        active_defects = (await session.execute(stmt)).scalars().all()

        best_match = self._find_best_match(
            active_defects, lat, lon, class_code, heading, search_radius_m
        )

        canonical_defect, is_merged, merge_log = await self._resolve_canonical_defect(
            session, best_match, obs_data, class_code, lat, lon, observed_at, road_segment_id
        )

        incoming_obs_id = obs_data.get("observation_id")
        if isinstance(incoming_obs_id, str):
            obs_id = uuid.UUID(incoming_obs_id)
        elif isinstance(incoming_obs_id, uuid.UUID):
            obs_id = incoming_obs_id
        else:
            obs_id = uuid.uuid4()

        observation = DefectObservation(
            id=obs_id,
            defect_id=canonical_defect.id,
            device_id=device_id,
            location=f"POINT({lon} {lat})",
            gps_accuracy_m=acc,
            speed_mps=speed,
            heading_deg=heading,
            confidence=confidence,
            measurement_summary=obs_data.get("measurement_summary"),
            observed_at=observed_at,
        )
        session.add(observation)

        return canonical_defect, observation, is_merged, merge_log
