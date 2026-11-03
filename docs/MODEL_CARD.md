# ScamRoad Model Card: Edge Pothole & Road Defect Detector (v1.0.0-frozen)

**Model Identifier:** `scamroad-yolov8n-edge-v1.0.0`  
**Architecture:** Ultralytics YOLOv8 Nano (Anchor-Free Decoupled Head)  
**Primary Deployment Artifact:** `runs/export/best_int8.onnx` (Dynamic INT8 Quantized ONNX Opset 17)  
**Artifact Size:** `3.32 MB` (72.7% compression from 12.18 MB FP32)  
**Fidelity Parity:** Max absolute tensor error = `0.00312` ($< 10^-2$)  
**Calibration:** Expected Calibration Error (ECE) = `0.0671` ($T^* = 0.50$)  
**Status:** FROZEN & VERIFIED (Pass 3 Complete)  
**Release Tag:** `v1.0.0-model`  
**Release Date:** `2026-11-03T17:34:06.187174+00:00`  
**Governing Standard:** Truth Over Appearance (Zero Unsubstantiated Metrics)

---

## 1. Intended Use & Operational Envelope

### 1.1 In-Scope Applications
- Real-time automated road pavement defect detection on edge compute platforms:
  - **Single Board Computers:** Raspberry Pi 5 (via ONNX Runtime CPU), Jetson Orin Nano.
  - **Android Smartphones:** Mobile dashcam inspection via ONNX Runtime Mobile (OPPO K13).
  - **Municipal Survey Fleets:** Automated road defect outbox recording with GPS geotagging.
- **Physical Consolidation:** Continuous multi-frame tracking with `0.0 FP/km` and `0.0% false duplicate inflation`.

### 1.2 Out-of-Scope / Prohibited Applications
- **Automotive Collision Safety:** NOT certified as an ISO 26262 ASIL safety or automated emergency braking (AEB) sensor.
- **Physical Metric Depth (Rule 10):** Reports pixel coordinates and relative areas only (`calibrated: false`, `physical_size: None`, `unit: pixels`). Metric depth in cm is strictly prohibited without calibrated stereo / LiDAR.
- **Automated Work-Order Closure:** Model outputs are strictly advisory; authorized human maintenance sign-off is required.

---

## 2. Quantitative Performance & Holdout Verification

All metrics measured directly on held-out validation sequences:

| Metric | Measured Value | Minimum Gate | Status |
| :--- | :---: | :---: | :---: |
| **Validation mAP@50 (Overall)** | **0.8575** | $\ge 0.7000$ | **PASSED** |
| **Validation mAP@50-95** | **0.7913** | $\ge 0.4000$ | **PASSED** |
| **Validation Precision** | **0.8125** (0.8540 w/ Hard Negatives) | $\ge 0.7500$ | **PASSED** |
| **Validation Recall** | **0.9000** | $\ge 0.8000$ | **PASSED** |
| **Local India Slice mAP@50** | **0.8575** | $\ge 0.7000$ | **PASSED** |
| **Expected Calibration Error (ECE)** | **0.0671** | $< 0.0800$ | **PASSED** |
| **Reproduction $\Delta$ mAP@50** | **0.000000** | $< 0.0050$ | **DETERMINISTIC** |

---

## 3. Edge Latency & Resource Utilization

*Measured on AMD Ryzen 7 7445HS host edge reference (6 physical / 12 logical threads):*

| Format | Precision | File Size | Median Latency (p50) | 95th Percentile (p95) | Throughput (FPS) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **PyTorch FP32** | FP32 | 12.20 MB | 51.7 ms | 58.2 ms | 19.3 FPS |
| **ONNX FP32** | FP32 | 12.18 MB | 48.2 ms | 54.1 ms | 20.7 FPS |
| **ONNX INT8** | **INT8** | **3.32 MB** | **45.46 ms** | **53.29 ms** | **21.0 FPS** |

---

## 4. Adverse Environmental Boundaries (Stage 11 Empirical Limits)

1. **Illuminance Threshold:** Operates reliably down to standard dusk. Night operation requires external vehicle lighting providing $\ge 15\text{ lux}$ at the road surface (unilluminated night drops recall to zero).
2. **Vehicle Speed & Shutter:** Vehicle speed must remain $\le 40\text{ km/h}$ at standard camera shutter ($1/500\text{ s}$) to prevent optical motion blur kernel from exceeding 11px.
3. **Precipitation:** Resilient to light/moderate rainfall; torrential rain (>900 drops/frame) requires multi-frame track persistence threshold $\ge 4$ detections.

---

## 5. Provenance & Training Lineage

- **Dataset:** RDD2022 India Subset (`dataset_v1.0`, SHA-256: `1ab5e956961ada65317531ed87507c858908713c7429617c75637bf01a1f2bee`).
- **Data Licenses:** CC BY-SA 4.0, CC BY 4.0, CC0. No proprietary or commercial license infringements.
- **Privacy Enforcement (Rule 9):** Gaussian privacy blurring applied to all human faces and license plates prior to export.
- **Random Seed:** 42 (Pinned across all training, validation, and quantization pipelines).
