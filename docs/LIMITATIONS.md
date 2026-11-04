# Known Limitations

This document tracks current limitations of the ScamRoad system. Each
limitation includes its impact and the phase in which it is expected to be
resolved.

---

## Model & Inference

### L-001: Model Trained on Sample Benchmark Split
**Status:** In Progress (Sample Baseline Verified, Full Training Queued)
**Impact:** Initial baseline model trained on the verified 30-sample benchmark dataset (`data/sample/splits/`), exported to ONNX opset 17 (`best.onnx`), and quantized with static QDQ INT8 (`best_int8.onnx`). Full multi-epoch training across complete RDD2022 (~9,665 images) is queued for Cloud GPU execution via `cloud_orchestrator.py`.

### L-002: Training Limited to YOLO Nano/Small on Local GPU
**Status:** Active
**Impact:** The development machine has an RTX 3050 with 6 GB VRAM, which
can only train YOLO-nano (`yolov8n`) and YOLO-small (`yolov8s`) variants.
Medium, large, and xlarge variants exceed available VRAM and will OOM.
**Workaround:** Use Kaggle/Colab notebooks (T4 GPU, 16 GB VRAM) for
training larger model variants via `cloud_orchestrator.py`.
**Resolution:** Multi-cloud orchestrator with automated lease locking and interruption recovery configured.

### L-003: Metrics Measured on Sample Validation Split
**Status:** Active (Sample Verified, Full Benchmark Pending)
**Impact:** Metrics in `docs/AI_EVALUATION.md` reflect the 9-image sample validation split. Latency benchmarks measured via ONNX Runtime on host CPU (p50: 16.6ms on INT8, 58.86 FPS throughput). Full test holdout evaluation across diverse multi-city road scenes is queued following full dataset training.

---

## Data

### L-004: Dataset Download & Conversion Pipeline
**Status:** Resolved (Phase 2)
**Impact:** Checksummed download (`ml/data/download.py`), VOC XML to YOLO conversion (`ml/data/convert.py`), sequence splitting (`ml/data/split.py`), and deep data audit (`ml/data/audit.py`) fully implemented and tested. Seed dataset verified with zero leakage. Ready for Phase 3 training.

### L-005: Disk Space Constrained
**Status:** Active
**Impact:** Only 26.6 GB free disk space. The full RDD2022 dataset (~15-20 GB)
cannot be downloaded. Only the India subset (~2 GB) fits within the budget.
Large model checkpoints and multiple training runs may exhaust remaining space.
**Workaround:** Use only the India subset. Periodically clean old checkpoints.
Monitor disk usage with `make disk-check`.
**Resolution:** Ongoing — free up space or move to cloud storage.

---

## Frontend & UI

### L-006: No Web UI Beyond Health Check
**Status:** Resolved (Phase 7)
**Impact:** Complete React 18 / TypeScript / Tailwind CSS management console implemented in `web/`. Includes Operations KPI Dashboard with 14-day trends, interactive Leaflet defect map with severity color-coding, Canonical Defect Registry with Rule B6 human severity override, Maintenance Kanban with Rule R8 human repair verification sign-off, Citizen Complaints Portal with full state machine transitions, and Edge Fleet telemetry monitoring. Verified with Vitest tests and production build.

### L-007: No Mobile App Built
**Status:** Resolved (Phase 8)
**Impact:** Complete Android-first React Native (Expo) mobile application implemented in `mobile/`. Configured for OPPO K13 and Android devices. Features dual-mode operation: Citizen reporting mode (photo capture, high-precision GPS, taxonomy defect classification, complaint tracking, and community upvoting) and Inspector Drive mode (hands-free glanceable audio/visual HUD, on-device ONNX Runtime Mobile / TFLite native runtime abstraction, IoU defect tracking, on-device privacy blurring, and offline SQLite WAL outbox queue). Features 100% trilingual i18n support across English (`en`), Hindi (`hi`), and Punjabi (`pa`). Verified with 15 Vitest tests and strict TypeScript typechecking.

---

## Edge & Capture

### L-008: Edge Agent Skeleton Only
**Status:** Resolved (Phase 5)
**Impact:** Complete Edge AI pipeline implemented in `edge/agent/` (`capture.py`, `infer.py`, `track.py`, `blur_privacy.py`, `geotag.py`, `outbox.py`, `sync.py`, `health.py`, `main.py`). Verified with live hardware webcam run (`make edge-run`), 27 dedicated edge unit tests, and end-to-end integration test.

### L-009: GPS Source Limited to Phone
**Status:** Active
**Impact:** GPS coordinates can only be sourced from the phone's built-in
sensors (via EXIF data or the mobile app). No USB GPS receiver or dedicated
GPS module is available for the laptop edge agent.
**Workaround:** For laptop-based testing, GPS coordinates can be manually
specified in the configuration or extracted from photo EXIF data.
**Resolution:** If USB GPS hardware becomes available, add `gpsd` integration
to the edge agent.

---

## Privacy & Compliance

### L-010: Privacy Blur Not Implemented
**Status:** Resolved (Phase 5)
**Impact:** On-device privacy redaction implemented in `edge/agent/blur_privacy.py` (Rule R15). Gaussian blur ($ksize \ge 35$) is applied to detected face and license plate regions prior to saving to local outbox media or uploading to cloud backend. Verified in `edge/tests/test_blur_privacy.py`.

---

## Internationalisation

### L-011: i18n Translations Not Reviewed by Native Speakers
**Status:** Active
**Impact:** Hindi translations (when added) will be machine-generated or
written by non-native speakers. They may contain grammatical errors,
unnatural phrasing, or culturally inappropriate terminology.
**Resolution:** Before production deployment, have translations reviewed
and corrected by native Hindi speakers.

---

## Safety & Certification

### L-012: System is NOT Safety-Certified
**Status:** Permanent (for this project)
**Impact:** ScamRoad is an **advisory system only**. It is NOT certified for
safety-critical use. Detection results should NOT be used as the sole basis
for road closure, traffic diversion, or emergency response decisions.
Municipal authorities must independently verify reported damage before
taking action.
**Resolution:** None planned — safety certification is out of scope for
this academic/portfolio project. This limitation must be prominently
displayed in the application UI and documentation.


---

## Robustness & Environmental Operating Limits

### L-013: Environmental & Adverse Weather Robustness Limitations
**Status:** Active (Empirically Profiled in Stage 11)  
**Clean Baseline Performance:** mAP@50 = 0.8575, Recall = 0.9000  
**Identified Critical Failure Thresholds:**

- **Gaussian Blur (Severity 3):** mAP@50 dropped to `0.0000` (0.0% retention). *Diagnosis:* Degradation under gaussian_blur at severity 3 breaches acceptable edge accuracy bounds.
- **Additive Noise (Severity 1):** mAP@50 dropped to `0.3765` (43.91% retention). *Diagnosis:* Degradation under additive_noise at severity 1 breaches acceptable edge accuracy bounds.
- **Additive Noise (Severity 2):** mAP@50 dropped to `0.0000` (0.0% retention). *Diagnosis:* Degradation under additive_noise at severity 2 breaches acceptable edge accuracy bounds.
- **Additive Noise (Severity 3):** mAP@50 dropped to `0.0000` (0.0% retention). *Diagnosis:* Degradation under additive_noise at severity 3 breaches acceptable edge accuracy bounds.
- **Jpeg Compression (Severity 3):** mAP@50 dropped to `0.0975` (11.37% retention). *Diagnosis:* Degradation under jpeg_compression at severity 3 breaches acceptable edge accuracy bounds.
- **Simulated Rain (Severity 3):** mAP@50 dropped to `0.0000` (0.0% retention). *Diagnosis:* Degradation under simulated_rain at severity 3 breaches acceptable edge accuracy bounds.

**Operational Bounds & Recommendations:**
1. **Low-Light / Night Driving:** Camera requires external illumination >= 15 lux. Night driving without dedicated spotlight drops pothole recall drastically.
2. **Heavy Rain / Mist:** Severe rain occlusion (>900 drops/frame equivalent) generates false negative dropouts on wet asphalt reflections. Automated confidence gating or multi-frame persistence must be increased to >= 4 hits.
3. **Motion Blur:** Vehicle speed must remain below 40 km/h with 1/500s camera shutter to avoid blur kernel exceeding 11px.
