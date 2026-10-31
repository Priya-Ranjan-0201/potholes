"""ScamRoad Edge Agent — Real-time Pothole Detection, Tracking & Sync Pipeline.

Connects the full Edge AI pipeline (SPEC B4 & B5):
1. Non-blocking capture loop with ring-buffer backpressure protection
2. Quality gating (motion blur variance & exposure checks)
3. Road surface Region of Interest (ROI) cropping
4. Quantized ONNX edge inference (YOLOv8n INT8 / FP32)
5. Multi-frame object tracking (ByteTrack IoU + ego-motion gating)
6. Physical defect consolidation (best frame selection by quality*conf*area)
7. On-device privacy redaction (Gaussian blur of faces & license plates)
8. GPS kinematic geotagging with Kalman filter smoothing
9. SQLite WAL transactional outbox queuing & background sync
"""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path
from typing import Any

import yaml

from edge.agent.blur_privacy import PrivacyRedactor
from edge.agent.capture import FrameCapture, QualityGate
from edge.agent.geotag import GPSGeotagger
from edge.agent.health import EdgeHealthMonitor
from edge.agent.infer import EdgeInferenceEngine
from edge.agent.outbox import SQLiteOutbox
from edge.agent.sync import SyncClient
from edge.agent.track import DefectCandidate, EdgeTracker


class ScamRoadEdgeAgent:
    """Master orchestrator executing the continuous edge detection loop."""

    def __init__(
        self,
        config_path: Path | None = None,
        model_path: Path | None = None,
        source: int | str = 0,
        outbox_db: Path | None = None,
        api_url: str = "http://localhost:8000",
        mock_gps: bool = False,
        headless: bool = True,
        max_frames: int | None = None,
    ) -> None:
        self.config_path = config_path or Path("edge/configs/edge_config.yaml")
        self.cfg = self._load_config(self.config_path)

        resolved_model = model_path or Path(
            self.cfg.get("model_path", "ml/runs/pothole_yolov8n/weights/best_int8.onnx")
        )
        if not resolved_model.exists():
            fp32_fallback = Path("ml/runs/pothole_yolov8n/weights/best.onnx")
            if fp32_fallback.exists():
                resolved_model = fp32_fallback

        print(f"[ScamRoad Edge] Initializing Inference Engine with model: {resolved_model}...")
        self.infer_engine = EdgeInferenceEngine(
            model_path=resolved_model,
            input_size=self.cfg.get("input_size", 640),
            conf_threshold=self.cfg.get("confidence_threshold", 0.25),
            iou_threshold=self.cfg.get("nms_iou_threshold", 0.45),
        )

        self.quality_gate = QualityGate(
            blur_threshold=self.cfg.get("blur_threshold", 80.0),
            roi_top_ratio=0.35,
        )
        self.source = source
        self.capture = FrameCapture(
            source=self.source,
            buffer_size=self.cfg.get("buffer_size", 32),
            quality_gate=self.quality_gate,
        )

        self.tracker = EdgeTracker(
            iou_threshold=0.20,
            min_hits=3,
            max_invisible=4,
            ego_motion_gating=True,
        )

        self.redactor = PrivacyRedactor(
            blur_faces=self.cfg.get("blur_faces", True),
            blur_plates=self.cfg.get("blur_plates", True),
        )

        self.mock_gps = mock_gps
        self.geotagger = GPSGeotagger(enable_kalman=True)
        self._mock_lat = 30.9010
        self._mock_lon = 75.8573

        outbox_path = outbox_db or Path(self.cfg.get("outbox_db", "data/edge_outbox.db"))
        self.outbox = SQLiteOutbox(db_path=outbox_path)
        self.api_url = api_url or self.cfg.get("sync_api_url", "http://localhost:8000")
        self.sync_client = SyncClient(outbox=self.outbox)
        self.health_monitor = EdgeHealthMonitor(outbox_db_path=outbox_path)

        self.headless = headless
        self.max_frames = max_frames
        self.is_running = False

    def _load_config(self, cfg_path: Path) -> dict[str, Any]:
        """Load edge YAML configuration."""
        if not cfg_path.exists():
            return {}
        with open(cfg_path, encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def _process_candidate(self, cand: DefectCandidate, media_dir: Path, logged_count: int) -> None:
        """Process and stage a single consolidated defect candidate."""
        if self.mock_gps:
            self._mock_lat += 0.00005
            self._mock_lon += 0.00003
            fix = self.geotagger.update_fix(
                lat=self._mock_lat,
                lon=self._mock_lon,
                accuracy_m=3.5,
                speed_mps=11.2,
                heading_deg=45.0,
            )
        else:
            fix = self.geotagger.get_current_fix()

        media_path = None
        sha256 = None
        if cand.best_frame_img is not None:
            media_file = media_dir / f"pothole_{cand.candidate_id[:8]}.jpg"
            redact_res = self.redactor.redact(
                image=cand.best_frame_img,
                defect_safe_boxes=[cand.best_bbox_xyxy],
                save_path=media_file,
            )
            media_path = media_file
            sha256 = redact_res.sha256_hash

        self.sync_client.stage_candidate_to_outbox(
            candidate=cand,
            gps_fix=fix,
            media_path=media_path,
            media_sha256=sha256,
        )
        rel_pct = cand.median_relative_area * 100
        print(
            f"  [*] DEFECT #{logged_count}: [{cand.class_name}] "
            f"Track #{cand.track_id} | Frames: {cand.frames_seen} | "
            f"Conf: {cand.median_confidence:.2f} | Area: {rel_pct:.3f}% | "
            f"GPS: ({fix.latitude:.5f}, {fix.longitude:.5f})"
        )

    def _maybe_sync(self, last_sync: float, sync_interval: float) -> float:
        """Trigger background sync if interval elapsed."""
        now = time.time()
        if now - last_sync >= sync_interval:
            sync_res = self.sync_client.sync_pending_events(
                api_url=self.api_url, max_batch_size=15, dry_run=True
            )
            sc = sync_res.get("synced_count", 0)
            if sc > 0:
                print(f"[ScamRoad Sync] Synced {sc} defect(s) to cloud.")
            return now
        return last_sync

    def _show_hud(self, meta: Any, potholes_logged: int) -> None:
        """Print status HUD."""
        snap = self.health_monitor.get_snapshot()
        pending = snap["outbox"]["pending_events"]
        print(
            f"[ScamRoad HUD] Frame #{meta.frame_id:04d} | "
            f"FPS: {snap['pipeline_fps']} | Infer: {snap['avg_inference_ms']}ms | "
            f"Potholes: {potholes_logged} | Outbox: {pending}"
        )

    def run(self) -> None:
        """Run the continuous edge processing loop."""
        self.is_running = True
        print(f"[ScamRoad Edge] Starting capture on source: {self.source}...")
        try:
            self.capture.start()
        except RuntimeError as e:
            print(f"[ScamRoad Edge] Capture failed: {e}", file=sys.stderr)
            return

        print("[ScamRoad Edge] Pipeline active. Processing frames...")
        media_dir = Path("data/edge_media")
        media_dir.mkdir(parents=True, exist_ok=True)

        frames_done = 0
        potholes_logged = 0
        last_sync = time.time()
        sync_interval = self.cfg.get("sync_interval_seconds", 30)

        try:
            while self.is_running:
                item = self.capture.get_frame(timeout=0.2)
                if item is None:
                    if not self.capture.is_alive:
                        print("[ScamRoad Edge] Video/stream ended.")
                        break
                    continue

                frame, meta = item
                t_start = time.perf_counter()

                roi_frame, roi_coords = self.quality_gate.extract_road_roi(frame)
                detections = self.infer_engine.predict(
                    roi_frame, roi_offset=(roi_coords[0], roi_coords[1])
                )
                infer_ms = (time.perf_counter() - t_start) * 1000.0

                self.tracker.update(
                    detections=detections,
                    frame_id=meta.frame_id,
                    timestamp_epoch=meta.timestamp_epoch,
                    blur_score=meta.blur_score,
                    frame_img=frame if detections else None,
                )

                candidates = self.tracker.pop_consolidated_defects()
                for cand in candidates:
                    potholes_logged += 1
                    self._process_candidate(cand, media_dir, potholes_logged)

                self.health_monitor.record_frame(
                    inference_ms=infer_ms,
                    dropped_in_buffer=self.capture.dropped_frames,
                )
                frames_done += 1

                last_sync = self._maybe_sync(last_sync, sync_interval)

                if frames_done % 30 == 0:
                    self._show_hud(meta, potholes_logged)

                if self.max_frames and frames_done >= self.max_frames:
                    print(f"[ScamRoad Edge] Reached maximum frames ({self.max_frames}).")
                    break
        except KeyboardInterrupt:
            print("\n[ScamRoad Edge] Stopping via operator interrupt...")
        finally:
            self.stop()
            rem = self.tracker.flush_all()
            total_logged = potholes_logged + len(rem)
            print(
                f"[ScamRoad Edge] Finished. Frames: {frames_done} | Total Defects: {total_logged}"
            )

    def stop(self) -> None:
        """Cleanly terminate pipeline workers and release locks."""
        self.is_running = False
        self.capture.stop()


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="ScamRoad Edge Agent Runner.")
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("edge/configs/edge_config.yaml"),
        help="Config file.",
    )
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Camera device index (0) or path to video file.",
    )
    parser.add_argument(
        "--model",
        type=Path,
        default=Path("ml/runs/pothole_yolov8n/weights/best_int8.onnx"),
        help="ONNX model path.",
    )
    parser.add_argument(
        "--outbox-db",
        type=Path,
        default=Path("data/edge_outbox.db"),
        help="Path to SQLite outbox.",
    )
    parser.add_argument(
        "--api-url",
        type=str,
        default="http://localhost:8000",
        help="Backend API base URL.",
    )
    parser.add_argument(
        "--mock-gps",
        action="store_true",
        help="Simulate kinematic GPS movement along test drive.",
    )
    parser.add_argument(
        "--max-frames",
        type=int,
        default=None,
        help="Limit number of frames to process.",
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        default=True,
        help="Run without GUI display.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for edge agent runner."""
    args = parse_args(argv)
    src: int | str = int(args.source) if args.source.isdigit() else args.source

    agent = ScamRoadEdgeAgent(
        config_path=args.config,
        model_path=args.model,
        source=src,
        outbox_db=args.outbox_db,
        api_url=args.api_url,
        mock_gps=args.mock_gps,
        headless=args.headless,
        max_frames=args.max_frames,
    )
    agent.run()


if __name__ == "__main__":
    main()
