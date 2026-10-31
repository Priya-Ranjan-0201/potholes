# Software Requirements Specification (SRS)
## Project: ScamRoad (scam_road)
### Edge-AI Pothole & Road Damage Tracking Architecture
**Standard**: IEEE 830-1998 Compliant  
**Version**: 1.0  
**Status**: Approved & Baselined  

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) details the functional, non-functional, interface, and safety requirements for **ScamRoad**, an edge-first computer vision and geospatial road damage tracking platform. The target audience includes ML researchers, edge embedded engineers, backend GIS architects, mobile developers, municipal road authorities, and QA specialists.

### 1.2 Scope
ScamRoad detects road surface anomalies—specifically potholes, longitudinal cracks, alligator cracking, and rutting—directly on edge compute devices (smartphones, Raspberry Pi 4, Jetson Orin Nano). Detections are tracked temporally across video frames using ByteTrack, geotagged with high-precision GPS coordinates, stored locally in a crash-resilient SQLite WAL outbox during network dead zones, and synchronized with a PostGIS-powered FastAPI cloud backend. The backend handles spatial clustering/deduplication, defect severity scoring, work order dispatch, and human-in-the-loop repair verification.

### 1.3 Definitions, Acronyms, and Abbreviations
- **PCI**: Pavement Condition Index (standard ASTM D6433 rating from 0 to 100).
- **WAL**: Write-Ahead Logging (SQLite persistence journal ensuring ACID compliance without corruption).
- **GiST**: Generalized Search Tree (PostgreSQL indexing mechanism for 2D spatial queries).
- **GSD**: Ground Sample Distance.
- **IoU**: Intersection over Union (bounding box overlap metric).
- **NPU**: Neural Processing Unit.
- **SLA**: Service Level Agreement.
- **WGS 84**: World Geodetic System 1984 (EPSG:4326 coordinate reference system).

### 1.4 References
- IEEE Std 830-1998: Recommended Practice for Software Requirements Specifications.
- ASTM D6433-20: Standard Practice for Roads and Parking Lots Pavement Condition Index Surveys.
- ScamRoad Architecture Specification (`docs/ARCHITECTURE.md`).
- ScamRoad Master Global Rules (`.agent/rules/00-global.md`).

---

## 2. Overall Description

### 2.1 Product Perspective
ScamRoad operates as a distributed edge-cloud hybrid platform:
```
[ Vehicle Camera / Phone ]
          │ (Live video feed)
          ▼
[ Edge Agent / Mobile ] ── (Inference: YOLOv8n + Tracking: ByteTrack)
          │ (Geotagged observations)
[ SQLite WAL Outbox ] ── (Offline storage & exponential retry queue)
          │ (HTTPS batch sync with idempotency keys)
          ▼
[ FastAPI Backend + PostGIS 16 ]
          ├── Spatial Deduplication (<2.0m geodesic clustering)
          ├── Severity Scoring Engine (Renormalized missing factors)
          ├── Maintenance & Work Order Dispatch (SLA tracking)
          └── Advisory AI Repair Verification (Human approval required)
```

### 2.2 User Classes and Roles
1. **Field Inspector / Surveyor**: Mounts edge device or mobile phone; conducts automated road surveys while driving without manual screen touches.
2. **Road Engineer / Municipal Authority**: Reviews consolidated defect maps, spatial heatmaps, PCI scores, and sets maintenance budgets.
3. **Maintenance Contractor**: Receives assigned work orders, performs road repairs, and uploads photographic proof of completion.
4. **Citizen**: Submits geotagged road defect complaints, tracks repair progress, and upvotes community issues.
5. **System Administrator**: Manages device keys, model rollouts, and reviews immutable audit logs.

### 2.3 Operating Environment
- **Edge Mobile**: Android 12+ (tested on OPPO K13), ARM64 architecture, minimum 4 GB RAM.
- **Edge Embedded**: Raspberry Pi 4 (4 GB+), NVIDIA Jetson Orin Nano / Xavier NX, Ubuntu 22.04 LTS.
- **Server Infrastructure**: Linux x86_64 / ARM64, Docker Engine 24+, PostgreSQL 16 with PostGIS 3, Redis 7, MinIO S3 storage.
- **Client Web Browser**: Chrome 110+, Firefox 110+, Safari 16+, Edge 110+.

### 2.4 Design and Implementation Constraints
- **Rule R1 (Truth Over Appearance)**: No synthetic or fabricated metrics; all numbers in UI or documentation must trace to generated repository artifacts.
- **Rule R2 (No Fake AI)**: When models are unavailable, endpoints return HTTP 503 `MODEL_NOT_READY`.
- **Rule R4 (Uncalibrated Physical Dimensions)**: Single images report pixels and relative road area only. Physical units (cm, m²) require verified camera calibration; sensor-measured depth is never synthesized from 2D pixels.
- **Rule R8 (AI Advisory Limit)**: AI models cannot close work orders; authorized humans must approve all repair verifications.
- **Rule R15 (Privacy by Design)**: License plates and human faces must be redacted/blurred on edge devices prior to cloud transmission.
- **Rule R16 (Driver Safety)**: Edge mobile UI must offer zero-touch driving mode with high-contrast glanceable HUD.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### FR-01: Real-time Edge Object Detection
- **FR-01.1**: The edge runtime shall execute YOLOv8n object detection on input camera frames at a target rate of ≥15 FPS on mobile and ≥20 FPS on edge accelerators.
- **FR-01.2**: The model shall recognize classes defined in `shared/taxonomy.yaml` (`pothole`, `crack_longitudinal`, `crack_transverse`, `alligator_crack`).
- **FR-01.3**: Bounding boxes with confidence below configurable threshold (default `0.35`) shall be suppressed.

#### FR-02: Multi-Frame Tracking & Consolidation
- **FR-02.1**: The edge agent shall assign persistent trajectory IDs using ByteTrack to associate bounding boxes across successive video frames.
- **FR-02.2**: When a defect exits the camera view, the edge agent shall extract the best-quality frame (highest confidence, least motion blur) and consolidate the track into a single observation record.

#### FR-03: Geotagging & Coordinate Mapping
- **FR-03.1**: Every observation shall be tagged with WGS 84 latitude, longitude, altitude, and horizontal accuracy in meters.
- **FR-03.2**: Observations with horizontal GPS error >15 meters shall be flagged as degraded accuracy.

#### FR-04: Offline-First SQLite WAL Outbox
- **FR-04.1**: Observations, telemetry, and media records shall be committed to a local SQLite database in WAL mode before any network transmission attempt.
- **FR-04.2**: The outbox shall prioritize high-severity events and apply exponential backoff on network failures.
- **FR-04.3**: A disk quota manager shall enforce storage limits, evicting oldest completed items when storage usage exceeds the allocated threshold.

#### FR-05: Cloud Spatial Deduplication & Aggregation
- **FR-05.1**: Upon ingestion, the backend shall execute PostGIS `ST_DWithin` spatial proximity searches against existing active defects within a 2.0-meter radius.
- **FR-05.2**: If a matching defect exists, a new `defect_observation` shall be appended and defect coordinates recalculated using weighted average centroid. If no match exists, a new `defects` entity shall be created.

#### FR-06: Severity Assessment Engine
- **FR-06.1**: Defect severity shall be computed on a 0–100 scale using area, road type, traffic classification, and environmental factors.
- **FR-06.2**: In accordance with Rule R7, missing parameters shall remain NULL, and the scoring algorithm shall renormalize over available factors without inventing default values.

#### FR-07: Maintenance Dispatch & Repair Verification
- **FR-07.1**: The system shall generate work orders for defects exceeding severity thresholds based on SLA policies.
- **FR-07.2**: Contractors shall submit post-repair imagery.
- **FR-07.3**: In accordance with Rule R8, an automated image-matching model shall produce an advisory verification score (0.0 to 1.0), but final approval requires human role authorization.

#### FR-08: Edge Privacy Redaction
- **FR-08.1**: All media frames containing pedestrians or vehicles shall pass through a Haar/YOLO face and license plate detector before cloud transmission.
- **FR-08.2**: Detected regions shall be Gaussian blurred (kernel size 31×31) on the edge device; raw unblurred frames shall not be uploaded.

---

### 3.2 Non-Functional Requirements

#### NFR-01: Performance & Latency
- **NFR-01.1**: Edge inference latency on mobile device (OPPO K13) shall not exceed 45ms per frame at 640×640 resolution using INT8/FP16 acceleration.
- **NFR-01.2**: Backend ingestion endpoint `/api/v1/sync` shall process a batch of 50 observations within 250ms (excluding network transit).
- **NFR-01.3**: Map viewport bounding-box queries for 1,000 defects shall execute in <50ms utilizing spatial GiST indexes.

#### NFR-02: Reliability & Fault Tolerance
- **NFR-02.1**: The edge outbox shall guarantee zero data loss across unexpected power terminations or application crashes via SQLite WAL atomic commits.
- **NFR-02.2**: The backend shall implement idempotency keys for all upload endpoints, preventing duplicate defects on network retries.

#### NFR-03: Security & Access Control
- **NFR-03.1**: User passwords shall be hashed using Argon2id with memory cost 65536 KiB, time cost 3 iterations, and parallelism 4.
- **NFR-03.2**: Edge devices shall authenticate via unique HMAC SHA-256 API tokens; revoked device tokens shall be rejected immediately.
- **NFR-03.3**: All state-changing administrative operations shall be recorded in an immutable, append-only `audit_logs` table.

#### NFR-04: Usability & Safety
- **NFR-04.1**: The mobile field agent UI shall provide an automated "Drive Mode" requiring zero touchscreen interactions while the vehicle is in motion.
- **NFR-04.2**: Driver alerts shall be delivered via brief auditory chimes and high-contrast visual status indicators.

---

## 4. Verification and Acceptance Criteria
Every requirement in this specification is validated by automated test suites executed via `make test`:
- Schema contracts validated via `shared/tests/test_schemas.py`.
- Database models and spatial indexes validated via `backend/tests/test_models.py`.
- Alembic migrations validated via `backend/tests/test_migrations.py`.
- SQLite WAL outbox validated via `edge/tests/test_outbox.py`.
- Dataset pipelines and converters validated via `ml/tests/test_convert.py`, `test_audit.py`, `test_split.py`.
