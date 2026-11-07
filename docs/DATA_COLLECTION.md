# ScamRoad — Road Surface Data Collection Protocol (Local Test Set)

**Protocol Specification:** B.Tech Capstone / Semester Project Field Data Acquisition  
**Standard Compliance:** Aligned with MoRTH / IRC:82 guidelines for visual road distress surveys  
**Version:** 1.0 (Student Research Protocol)  

---

## 1. Objective & Scope

This protocol establishes a standardized, repeatable methodology for acquiring high-resolution dashcam and smartphone road distress imagery across Indian urban arterial, campus, and municipal road networks. The captured datasets form the local held-out validation benchmark to audit edge AI detection performance under authentic Indian pavement conditions (unpaved shoulders, bitumen patches, and speed breakers).

---

## 2. Hardware Mounting & In-Vehicle Setup

1. **Smartphone / Camera Mounting:**
   - **Mount Location:** Centerline of the front vehicle windshield, directly behind or adjacent to the interior rear-view mirror.
   - **Bracket Specification:** Rigid, short-arm suction mount with dual lock mechanical tightening to eliminate engine and road vibration harmonics.
   - **Orientation:** Landscape mode ($16:9$ aspect ratio), level with the vehicle's transverse axis.
2. **Camera Height & Angles:**
   - **Optical Height:** $1.2\text{ m}$ to $1.5\text{ m}$ above road surface level (dependent on vehicle class, e.g., hatchback/sedan vs. compact SUV).
   - **Pitch Angle:** $10^\circ$ to $15^\circ$ downward tilt below the horizontal plane. The hood edge must occupy less than $10\%$ of the lower frame, ensuring the road surface spans from $3\text{ m}$ to $35\text{ m}$ ahead of the bumper.
   - **Roll / Yaw:** Calibrated to $0^\circ \pm 1.5^\circ$ alignment with the vehicle direction of travel.

---

## 3. Optical & Recording Parameters

| Parameter | Specification | Engineering Justification |
| :--- | :--- | :--- |
| **Video Resolution** | **1080p Full HD ($1920 \times 1080$)** | Resolves hairline cracks ($>2\text{ mm}$ width) at $8\text{ m}$ vehicle standoff. |
| **Frame Rate** | **$30\text{ FPS}$ (Constant Frame Rate - CFR)** | Prevents frame drop desynchronization during ByteTrack motion gating. |
| **Shutter Speed** | $\ge 1/500\text{ s}$ (Sports / Action exposure) | Prevents motion blur at urban survey speeds ($30\text{--}50\text{ km/h}$). |
| **Focal Length** | $24\text{ mm}$ to $28\text{ mm}$ equivalent ($80^\circ\text{--}88^\circ\text{ FOV}$) | Wide-angle lane coverage without severe fisheye distortion. |
| **Focus Mode** | Locked Infinite Focus ($\infty$) | Eliminates focus hunting on raindrops or windshield dust. |
| **White Balance** | Daylight ($5500\text{ K}$) Fixed | Ensures consistent tarmac color temperature for HSV thresholding. |

---

## 4. Environmental & Survey Conditions

1. **Illumination Window:**
   - Surveys must be conducted between **10:00 AM and 04:00 PM** local solar time.
   - *Rationale:* Restricting collection to high solar elevation prevents acute, elongated tree and building shadows from generating false-positive crack predictions.
2. **Weather & Surface State:**
   - Asphalt surface must be **completely dry**.
   - Standing water pools and rain-soaked asphalt cause specular sunlight glare and obscure pothole bottom textures.
3. **Survey Vehicle Dynamics:**
   - Survey vehicle speed must be maintained between **$25\text{ km/h}$ and $45\text{ km/h}$**.
   - Minimum follow distance behind preceding vehicles: $>15\text{ m}$ (unobstructed road field of view).

---

## 5. Privacy Protection Protocol (Rule R6)

1. **Mandatory On-Device Redaction:**
   - In accordance with Rule R6, **no raw frames containing unblurred human faces or identifiable vehicle license plates may be stored or uploaded to municipal clouds**.
   - The capture agent executes `edge/agent/blur_privacy.py` before local outbox persistence.
   - Blurring uses an elliptical Gaussian kernel ($\sigma = 15$, kernel size $31 \times 31$) over all pedestrian and vehicle ROIs.
2. **Metadata Sanitization:**
   - GPS coordinates are truncated to $5$ decimal places ($\approx 1.1\text{ m}$ precision).
   - EXIF camera serial numbers and device IMSI identifiers are stripped during ingest.

---

## 6. Geotagging & Temporal Synchronization

1. **GPS Receiver Integration:**
   - External USB GNSS receiver or internal smartphone GPS running at $\ge 1\text{ Hz}$ update frequency.
   - NMEA `$GPRMC` and `$GPGGA` sentences parsed using `edge/agent/geotag.py`.
2. **Kalman Filter Smoothing:**
   - Raw GNSS readings pass through a 2D constant-velocity Kalman filter with horizontal accuracy rejection threshold set to $\le 5.0\text{ m}$.
3. **Frame-to-Coordinate Mapping:**
   - Each frame timestamp (UTC millisecond precision) is interpolated along the vehicle trajectory vector.

