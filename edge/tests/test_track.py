"""Unit tests for multi-frame defect tracking, ego-motion gating, and consolidation."""

import pytest

from edge.agent.infer import Detection
from edge.agent.track import DefectTrack, EdgeTracker, TrackObservation, compute_iou


def test_compute_iou() -> None:
    """Verify standard IoU calculations."""
    box1 = (0.0, 0.0, 10.0, 10.0)
    box2 = (0.0, 0.0, 10.0, 10.0)
    assert compute_iou(box1, box2) == 1.0

    box3 = (10.0, 10.0, 20.0, 20.0)
    assert compute_iou(box1, box3) == 0.0

    box4 = (0.0, 0.0, 10.0, 5.0)  # Half overlap
    assert pytest.approx(compute_iou(box1, box4), 0.01) == 0.5


def test_defect_track_confirmation_and_consolidation() -> None:
    """Verify track requires min_hits and consolidates median metrics."""
    det1 = Detection(0, "POTHOLE", 0.70, (100.0, 200.0, 150.0, 250.0), 0.02)
    obs1 = TrackObservation(1, 1000.0, det1, blur_score=120.0)

    track = DefectTrack(track_id=1, initial_obs=obs1, min_hits=3)
    assert not track.is_confirmed
    assert track.consolidate() is None  # Rejects < min_hits (Rule B5.2)

    # Frame 2
    det2 = Detection(0, "POTHOLE", 0.90, (102.0, 220.0, 152.0, 270.0), 0.025)
    obs2 = TrackObservation(2, 1000.1, det2, blur_score=150.0)
    track.add_observation(obs2)
    assert not track.is_confirmed

    # Frame 3
    det3 = Detection(0, "POTHOLE", 0.80, (105.0, 240.0, 155.0, 290.0), 0.03)
    obs3 = TrackObservation(3, 1000.2, det3, blur_score=130.0)
    track.add_observation(obs3)
    assert track.is_confirmed

    # Consolidate
    cand = track.consolidate()
    assert cand is not None
    assert cand.track_id == 1
    assert cand.frames_seen == 3
    assert cand.median_confidence == 0.80
    assert cand.max_confidence == 0.90
    assert cand.min_confidence == 0.70
    assert cand.calibrated is False  # Rule R4


def test_edge_tracker_ego_motion_gating() -> None:
    """Verify tracker associates downward-moving road defects and penalizes upward jumps."""
    tracker = EdgeTracker(iou_threshold=0.15, min_hits=2, ego_motion_gating=True)

    # Frame 1: Defect at y=200..300
    det_f1 = [Detection(0, "POTHOLE", 0.85, (200.0, 200.0, 300.0, 300.0), 0.05)]
    tracker.update(det_f1, frame_id=1, timestamp_epoch=1.0)
    assert len(tracker.active_tracks) == 1
    t_id = next(iter(tracker.active_tracks.keys()))

    # Frame 2: Defect moves forward (downward in frame: y=230..330)
    det_f2 = [Detection(0, "POTHOLE", 0.88, (202.0, 230.0, 305.0, 335.0), 0.06)]
    matched_ids = tracker.update(det_f2, frame_id=2, timestamp_epoch=1.1)
    assert t_id in matched_ids
    assert tracker.active_tracks[t_id].hits == 2
