# ScamRoad Camera Calibration & Physical Measurement Specification

**Document Version:** 1.0.0  
**Effective Date:** November 7, 2026  
**Compliance Standard:** Rule R4 (No uncalibrated depth or physical dimensions)

---

## 1. Overview & Core Principle (Rule R4)

Single-lens monocular optical cameras (such as standard consumer smartphones and vehicle dashcams) lack inherent depth perception. A pixel bounding box on a 1080p image can correspond to either:
- A small defect close to the vehicle hood, or
- A massive crater 30 meters down the highway corridor.

**Hard Rule R4 Principle:**
> All single-lens image measurements must be reported in **2D pixel coordinates and relative image area percentages (`px_relative_pct`)**. Physical metric dimensions ($\text{mm}$, $\text{cm}$, $\text{m}$) or volumetric depth ($\text{cm}^3$, $\text{m}^3$) are **strictly forbidden** unless the recording device has undergone a certified calibration procedure and carries `is_calibrated = true`.

---

## 2. Calibration Protocols

ScamRoad specifies two sanctioned calibration protocols for transitioning from relative pixel telemetry to physical metric measurements:

### Protocol A: Monocular Planar Homography (Ground Plane Mapping)

This protocol applies to fixed vehicle-mounted dashcams with constant pitch, roll, and elevation above the road surface.

#### Equipment & Setup:
1. Rigid camera mount on vehicle windshield or front bumper.
2. Rigid $8 \times 6$ checkerboard calibration target ($50\text{ mm} \times 50\text{ mm}$ grid square size).
3. Flat, level asphalt test strip.

#### Mathematical Formulation:
Let $(u, v, 1)^T$ be homogeneous image pixel coordinates and $(X_w, Y_w, 1)^T$ be metric coordinates on the ground plane ($Z_w = 0$):

$$\begin{bmatrix} u \\ v \\ 1 \end{bmatrix} \sim \mathbf{H} \begin{bmatrix} X_w \\ Y_w \\ 1 \end{bmatrix} = \mathbf{K} \begin{bmatrix} \mathbf{r}_1 & \mathbf{r}_2 & \mathbf{t} \end{bmatrix} \begin{bmatrix} X_w \\ Y_w \\ 1 \end{bmatrix}$$

Where:
- $\mathbf{K}$ is the intrinsic camera matrix ($f_x, f_y, c_x, c_y$ plus distortion coefficients $k_1, k_2, p_1, p_2$).
- $\mathbf{H}$ is the $3 \times 3$ ground-plane homography matrix computed using `cv2.findHomography` with RANSAC.

#### Operating Bounds:
- Forward distance range: $2.0\text{ m} \le d \le 8.0\text{ m}$.
- Expected lateral measurement accuracy: $\pm 8\%$ within the calibrated window.
- Invalidation trigger: Any adjustment to camera pitch angle or tire pressure $> 5\text{ PSI}$.

---

### Protocol B: Stereo Optical Disparity (Volumetric 3D Depth)

For volumetric depth measurement (e.g. measuring whether a pothole is $> 50\text{ mm}$ deep per IRC:82 guidelines), a calibrated stereo camera rig or active stereo depth sensor is required.

#### Depth Triangulation:
$$Z = \frac{f \cdot B}{d}$$

Where:
- $f$ is camera focal length in pixels.
- $B$ is physical stereo baseline separation (e.g. $120\text{ mm}$).
- $d = u_L - u_R$ is horizontal stereo disparity.

#### Volumetric Surface Integration:
$$\text{Volume} = \iint_{(x,y) \in \text{Mask}} \max(0, Z(x, y) - Z_{\text{road}}) \, dx \, dy$$

---

## 3. Data Schema Representation

Every measurement emitted by edge agents or backend inference engines must serialize measurement metadata:

```json
{
  "id": "det-1",
  "label": "POTHOLE",
  "confidence": 0.842,
  "areaPx": 14200,
  "relative_area_pct": 2.45,
  "is_calibrated": false,
  "measurement_method": "uncalibrated_pixel_area",
  "unit": "px_relative_pct",
  "calibrated_depth_mm": null,
  "calibrated_volume_cm3": null
}
```

If `is_calibrated == true`, physical values are populated with calibration metadata:

```json
{
  "is_calibrated": true,
  "measurement_method": "planar_homography_v1",
  "unit": "cm",
  "physical_length_cm": 42.5,
  "physical_width_cm": 38.0,
  "calibration_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

## 4. UI Representation Rules

1. When `is_calibrated == false`, UI elements must display dimensions as **pixels (`px²`)** or relative surface percentage.
2. Numerical depths in centimeters or repair volumes in cubic meters must **never** be synthesized from single-lens 2D bounding boxes.
3. Every uncalibrated measurement card must display an indicative notice: `*Relative 2D image coordinates (uncalibrated)`.
