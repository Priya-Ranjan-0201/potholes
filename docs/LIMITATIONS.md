# Known Limitations

This document tracks current limitations of the ScamRoad system. Each
limitation includes its impact and the phase in which it is expected to be
resolved.

---

## Model & Inference

### L-001: No Trained Model Yet
**Status:** Active
**Impact:** The inference endpoint returns `503 MODEL_NOT_READY` with a
`Retry-After` header for all detection requests. No road-damage detection
is functional.
**Resolution:** Phase 3 — train YOLO-nano on RDD2022-India and deploy the
first model checkpoint.

### L-002: Training Limited to YOLO Nano/Small on Local GPU
**Status:** Active
**Impact:** The development machine has an RTX 3050 with 6 GB VRAM, which
can only train YOLO-nano (`yolov8n`) and YOLO-small (`yolov8s`) variants.
Medium, large, and xlarge variants exceed available VRAM and will OOM.
**Workaround:** Use Kaggle notebooks (free T4/P100 GPU, 16 GB VRAM) for
training larger model variants.
**Resolution:** Long-term — access to cloud GPU instances or dedicated
training hardware.

### L-003: No Real Metrics or Benchmarks
**Status:** Active
**Impact:** No mAP, precision, recall, or latency benchmarks exist yet.
Performance claims cannot be validated.
**Resolution:** Phase 3 — evaluate trained model on RDD2022-India test split
and publish metrics in the phase report.

---

## Data

### L-004: No Dataset Downloaded Yet
**Status:** Active
**Impact:** No training data is available locally. The data pipeline
(`make data-download`, `make data-prepare`) has not been exercised.
**Resolution:** Phase 2 — download RDD2022-India subset from Figshare.

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
**Status:** Active
**Impact:** The web dashboard does not exist yet. The only accessible endpoint
is `GET /api/v1/health`, which returns a JSON status response. There is no
map, no charts, no user interface.
**Resolution:** Phase 7 — build the React web dashboard.

### L-007: No Mobile App Built
**Status:** Active
**Impact:** The React Native mobile app has not been created. Citizens cannot
capture or submit road images via phone.
**Resolution:** Phase 8 — build the React Native (Expo) mobile app.

---

## Edge & Capture

### L-008: Edge Agent Skeleton Only
**Status:** Active
**Impact:** The edge agent (`src/edge/`) is a minimal skeleton with no
functional image capture, inference, or sync capabilities. It cannot process
images or communicate with the backend.
**Resolution:** Phase 5 — implement the full edge capture pipeline.

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
**Status:** Active
**Impact:** Faces and licence plates in uploaded images are NOT automatically
blurred. Images are stored as-is, which may violate privacy requirements
(rule R12) if images contain identifiable information.
**Resolution:** Phase 9 — implement the privacy blur pipeline using a
face/plate detection model before image storage.

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
