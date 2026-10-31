"""Camera and video capture with non-blocking ring buffer and quality gating.

Provides threaded frame ingestion into a fixed-capacity ring buffer to ensure
the camera driver is never blocked by inference latency (Rule B4).
Includes quality gating for motion blur (Laplacian variance) and exposure levels,
along with configurable road Region of Interest (ROI) extraction.
"""

from __future__ import annotations

import argparse
import queue
import threading
import time
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np


@dataclass
class FrameMetadata:
    """Telemetry and quality metrics associated with an ingested frame."""

    frame_id: int
    timestamp_epoch: float
    width: int
    height: int
    blur_score: float
    is_blurred: bool
    mean_brightness: float
    exposure_ok: bool
    roi_coords: tuple[int, int, int, int] | None = None  # (x, y, w, h)


class QualityGate:
    """Frame quality assessment and region of interest filtering."""

    def __init__(
        self,
        blur_threshold: float = 80.0,
        min_brightness: float = 35.0,
        max_brightness: float = 225.0,
        roi_top_ratio: float = 0.35,
        roi_bottom_ratio: float = 1.0,
    ) -> None:
        self.blur_threshold = blur_threshold
        self.min_brightness = min_brightness
        self.max_brightness = max_brightness
        self.roi_top_ratio = max(0.0, min(1.0, roi_top_ratio))
        self.roi_bottom_ratio = max(0.0, min(1.0, roi_bottom_ratio))

    def compute_blur_score(self, gray_frame: np.ndarray) -> float:
        """Compute motion blur score using Laplacian operator variance."""
        val = cv2.Laplacian(gray_frame, cv2.CV_64F).var()
        return float(round(val, 2))

    def compute_brightness(self, gray_frame: np.ndarray) -> float:
        """Compute mean pixel brightness."""
        val = float(np.mean(gray_frame))
        return float(round(val, 2))

    def assess_frame(self, frame: np.ndarray, frame_id: int = 0) -> FrameMetadata:
        """Evaluate frame quality metrics and exposure sanity."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame

        blur_val = self.compute_blur_score(gray)
        brightness_val = self.compute_brightness(gray)

        is_blurred = blur_val < self.blur_threshold
        exposure_ok = self.min_brightness <= brightness_val <= self.max_brightness

        h, w = frame.shape[:2]
        return FrameMetadata(
            frame_id=frame_id,
            timestamp_epoch=time.time(),
            width=w,
            height=h,
            blur_score=blur_val,
            is_blurred=is_blurred,
            mean_brightness=brightness_val,
            exposure_ok=exposure_ok,
        )

    def extract_road_roi(self, frame: np.ndarray) -> tuple[np.ndarray, tuple[int, int, int, int]]:
        """Extract the asphalt road region of interest (discarding sky and car hood).

        Returns cropped ROI array and absolute coordinates (x, y, w, h).
        """
        h, w = frame.shape[:2]
        y1 = int(h * self.roi_top_ratio)
        y2 = int(h * self.roi_bottom_ratio)
        roi = frame[y1:y2, 0:w]
        return roi, (0, y1, w, y2 - y1)


class FrameCapture:
    """Threaded camera/video capture worker with non-blocking ring buffer."""

    def __init__(
        self,
        source: int | str | Path = 0,
        buffer_size: int = 32,
        quality_gate: QualityGate | None = None,
    ) -> None:
        self.source = source
        self.buffer_size = max(4, buffer_size)
        self.quality_gate = quality_gate or QualityGate()
        self._frame_queue: queue.Queue[tuple[np.ndarray, FrameMetadata]] = queue.Queue(
            maxsize=self.buffer_size
        )
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None
        self._cap: cv2.VideoCapture | None = None
        self._frame_counter = 0
        self._dropped_frames = 0

    def start(self) -> None:
        """Start background capture thread."""
        if self._thread is not None and self._thread.is_alive():
            return

        self._stop_event.clear()
        self._cap = cv2.VideoCapture(
            self.source if not isinstance(self.source, Path) else str(self.source)
        )
        if not self._cap.isOpened():
            raise RuntimeError(f"Failed to open video capture source: {self.source}")

        self._thread = threading.Thread(
            target=self._capture_worker, name="ScamRoad-CaptureWorker", daemon=True
        )
        self._thread.start()

    def _capture_worker(self) -> None:
        """Worker loop continuously reading frames into the ring buffer."""
        assert self._cap is not None
        while not self._stop_event.is_set():
            ret, frame = self._cap.read()
            if not ret or frame is None:
                break

            self._frame_counter += 1
            meta = self.quality_gate.assess_frame(frame, frame_id=self._frame_counter)

            # Non-blocking ring buffer: drop oldest frame if queue full
            if self._frame_queue.full():
                try:
                    self._frame_queue.get_nowait()
                    self._dropped_frames += 1
                except queue.Empty:
                    pass

            try:
                self._frame_queue.put_nowait((frame, meta))
            except queue.Full:
                self._dropped_frames += 1

    def get_frame(self, timeout: float = 0.2) -> tuple[np.ndarray, FrameMetadata] | None:
        """Retrieve next frame from ring buffer, or None if empty."""
        try:
            return self._frame_queue.get(timeout=timeout)
        except queue.Empty:
            return None

    def stop(self) -> None:
        """Stop background worker and release video capture resources."""
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=1.0)
            self._thread = None
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    @property
    def is_alive(self) -> bool:
        """True if background capture worker is actively running."""
        return bool(self._thread and self._thread.is_alive())

    @property
    def dropped_frames(self) -> int:
        """Total frames dropped due to buffer backpressure."""
        return self._dropped_frames

    @property
    def frame_count(self) -> int:
        """Total frames read from hardware/stream."""
        return self._frame_counter


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Camera ring-buffer capture.")
    parser.add_argument(
        "--source",
        type=str,
        default="0",
        help="Camera device index (e.g. 0) or path to video file.",
    )
    parser.add_argument("--buffer-size", type=int, default=32, help="Ring buffer capacity.")
    parser.add_argument(
        "--blur-threshold",
        type=float,
        default=80.0,
        help="Laplacian variance threshold for blur.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the capture CLI."""
    args = parse_args(argv)
    src: int | str = int(args.source) if args.source.isdigit() else args.source

    q_gate = QualityGate(blur_threshold=args.blur_threshold)
    cap = FrameCapture(source=src, buffer_size=args.buffer_size, quality_gate=q_gate)

    print(f"Starting frame capture from source: {src}...")
    try:
        cap.start()
        for _ in range(50):
            item = cap.get_frame(timeout=0.5)
            if item is None:
                if not cap.is_alive:
                    print("Stream ended.")
                    break
                continue
            frame, meta = item
            print(
                f"Frame #{meta.frame_id:04d} | Shape: {frame.shape} | "
                f"Blur: {meta.blur_score:6.1f} (Blurry: {meta.is_blurred}) | "
                f"Brightness: {meta.mean_brightness:5.1f} | Dropped: {cap.dropped_frames}"
            )
            time.sleep(0.03)
    finally:
        cap.stop()
        print("Capture stopped cleanly.")


if __name__ == "__main__":
    main()
