"""Multi-frame object association and defect track consolidation.

Implements SPEC B5.1 and B5.2:
1. In-video tracking with IoU matching and ego-motion aware gating
   (road defects move downward and expand in forward vehicle motion).
2. Track -> physical defect consolidation:
   - Selects best frame by (quality * confidence * relative_area)
   - Computes median confidence and relative area
   - Filters transient false positives (rejects tracks with hits < min_hits)
"""

from __future__ import annotations

import statistics
import uuid
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import numpy as np

    from edge.agent.infer import Detection


@dataclass
class TrackObservation:
    """Individual frame sighting of a tracked defect."""

    frame_id: int
    timestamp_epoch: float
    detection: Detection
    blur_score: float
    frame_img: np.ndarray | None = None  # Cached for best-frame selection


@dataclass
class DefectCandidate:
    """Consolidated physical defect ready for geotagging and outbox synchronization."""

    candidate_id: str
    track_id: int
    class_id: int
    class_name: str
    best_frame_id: int
    best_frame_img: np.ndarray | None
    best_bbox_xyxy: tuple[float, float, float, float]
    median_confidence: float
    max_confidence: float
    min_confidence: float
    median_relative_area: float
    frames_seen: int
    first_seen_epoch: float
    last_seen_epoch: float
    calibrated: bool = False
    unit: str = "percent_image"


def compute_iou(
    box1: tuple[float, float, float, float],
    box2: tuple[float, float, float, float],
) -> float:
    """Compute Intersection-over-Union between two (xmin, ymin, xmax, ymax) boxes."""
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_w = max(0.0, x2 - x1)
    inter_h = max(0.0, y2 - y1)
    inter_area = inter_w * inter_h

    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union_area = area1 + area2 - inter_area

    if union_area <= 0.0:
        return 0.0
    return float(inter_area / union_area)


class DefectTrack:
    """Represents a continuous track of an identified road defect across frames."""

    def __init__(
        self,
        track_id: int,
        initial_obs: TrackObservation,
        min_hits: int = 3,
        max_invisible: int = 4,
    ) -> None:
        self.track_id = track_id
        self.class_id = initial_obs.detection.class_id
        self.class_name = initial_obs.detection.class_name
        self.observations: list[TrackObservation] = [initial_obs]
        self.hits = 1
        self.consecutive_misses = 0
        self.min_hits = min_hits
        self.max_invisible = max_invisible

    @property
    def latest_bbox(self) -> tuple[float, float, float, float]:
        """Most recently observed bounding box."""
        return self.observations[-1].detection.bbox_xyxy

    @property
    def is_confirmed(self) -> bool:
        """True if defect was seen enough consecutive times to rule out transient noise."""
        return self.hits >= self.min_hits

    @property
    def is_lost(self) -> bool:
        """True if track has not been seen for too many frames and should be closed."""
        return self.consecutive_misses >= self.max_invisible

    def add_observation(self, obs: TrackObservation) -> None:
        """Append matched observation to track."""
        self.observations.append(obs)
        self.hits += 1
        self.consecutive_misses = 0

    def mark_missed(self) -> None:
        """Increment invisible frame counter."""
        self.consecutive_misses += 1

    def consolidate(self) -> DefectCandidate | None:
        """Consolidate track observations into a single DefectCandidate (SPEC B5.2).

        Returns None if track does not meet the minimum hit threshold.
        """
        if not self.is_confirmed or not self.observations:
            return None

        confs = [o.detection.confidence for o in self.observations]
        rel_areas = [o.detection.relative_area for o in self.observations]

        # Best frame selection: maximize (quality * confidence * relative_area)
        best_score = -1.0
        best_obs = self.observations[0]
        for obs in self.observations:
            blur_factor = min(1.0, max(0.2, obs.blur_score / 150.0))
            score = blur_factor * obs.detection.confidence * (obs.detection.relative_area + 0.001)
            if score > best_score:
                best_score = score
                best_obs = obs

        return DefectCandidate(
            candidate_id=str(uuid.uuid4()),
            track_id=self.track_id,
            class_id=self.class_id,
            class_name=self.class_name,
            best_frame_id=best_obs.frame_id,
            best_frame_img=best_obs.frame_img,
            best_bbox_xyxy=best_obs.detection.bbox_xyxy,
            median_confidence=round(float(statistics.median(confs)), 4),
            max_confidence=round(float(max(confs)), 4),
            min_confidence=round(float(min(confs)), 4),
            median_relative_area=round(float(statistics.median(rel_areas)), 6),
            frames_seen=len(self.observations),
            first_seen_epoch=self.observations[0].timestamp_epoch,
            last_seen_epoch=self.observations[-1].timestamp_epoch,
            calibrated=False,
            unit="percent_image",
        )


class EdgeTracker:
    """Manages active defect tracks, IoU spatial association, and ego-motion gating."""

    def __init__(
        self,
        iou_threshold: float = 0.20,
        min_hits: int = 3,
        max_invisible: int = 4,
        ego_motion_gating: bool = True,
    ) -> None:
        self.iou_threshold = iou_threshold
        self.min_hits = min_hits
        self.max_invisible = max_invisible
        self.ego_motion_gating = ego_motion_gating
        self.active_tracks: dict[int, DefectTrack] = {}
        self.consolidated_defects: list[DefectCandidate] = []
        self._next_track_id = 1

    def update(
        self,
        detections: list[Detection],
        frame_id: int,
        timestamp_epoch: float,
        blur_score: float = 100.0,
        frame_img: np.ndarray | None = None,
    ) -> list[int]:
        """Update tracker with detections from current frame.

        Returns list of active track IDs observed in this frame.
        """
        matched_track_ids: list[int] = []
        unmatched_dets = list(range(len(detections)))
        unmatched_tracks = set(self.active_tracks.keys())

        # Match detections to active tracks
        if self.active_tracks and detections:
            # Build IoU cost matrix
            track_ids = list(self.active_tracks.keys())
            for t_id in track_ids:
                track = self.active_tracks[t_id]
                prev_b = track.latest_bbox
                best_iou = -1.0
                best_d_idx = -1

                for d_idx in unmatched_dets:
                    det = detections[d_idx]
                    if det.class_id != track.class_id:
                        continue  # Must match class family

                    curr_b = det.bbox_xyxy
                    iou = compute_iou(prev_b, curr_b)

                    # Ego-motion gating: forward motion moves objects downwards (y increases)
                    if self.ego_motion_gating:
                        prev_cy = (prev_b[1] + prev_b[3]) / 2.0
                        curr_cy = (curr_b[1] + curr_b[3]) / 2.0
                        # If object moved substantially upward against traffic flow, penalize IoU
                        if curr_cy < prev_cy - 30.0:
                            iou *= 0.2

                    if iou > self.iou_threshold and iou > best_iou:
                        best_iou = iou
                        best_d_idx = d_idx

                if best_d_idx >= 0:
                    obs = TrackObservation(
                        frame_id=frame_id,
                        timestamp_epoch=timestamp_epoch,
                        detection=detections[best_d_idx],
                        blur_score=blur_score,
                        frame_img=frame_img,
                    )
                    track.add_observation(obs)
                    matched_track_ids.append(t_id)
                    unmatched_tracks.discard(t_id)
                    unmatched_dets.remove(best_d_idx)

        # Mark unmatched tracks as missed
        for t_id in unmatched_tracks:
            self.active_tracks[t_id].mark_missed()

        # Initialize new tracks for unmatched detections
        for d_idx in unmatched_dets:
            new_id = self._next_track_id
            self._next_track_id += 1
            obs = TrackObservation(
                frame_id=frame_id,
                timestamp_epoch=timestamp_epoch,
                detection=detections[d_idx],
                blur_score=blur_score,
                frame_img=frame_img,
            )
            new_track = DefectTrack(
                track_id=new_id,
                initial_obs=obs,
                min_hits=self.min_hits,
                max_invisible=self.max_invisible,
            )
            self.active_tracks[new_id] = new_track
            matched_track_ids.append(new_id)

        # Consolidate and retire lost tracks
        lost_track_ids = [t_id for t_id, t in self.active_tracks.items() if t.is_lost]
        for t_id in lost_track_ids:
            track = self.active_tracks.pop(t_id)
            candidate = track.consolidate()
            if candidate is not None:
                self.consolidated_defects.append(candidate)

        return matched_track_ids

    def pop_consolidated_defects(self) -> list[DefectCandidate]:
        """Pop all currently completed defect candidates ready for sync."""
        candidates = list(self.consolidated_defects)
        self.consolidated_defects.clear()
        return candidates

    def flush_all(self) -> list[DefectCandidate]:
        """Close all remaining active tracks and return all consolidated candidates."""
        for t in self.active_tracks.values():
            cand = t.consolidate()
            if cand is not None:
                self.consolidated_defects.append(cand)
        self.active_tracks.clear()
        return self.pop_consolidated_defects()
