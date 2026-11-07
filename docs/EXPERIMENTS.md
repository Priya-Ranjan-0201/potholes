# ScamRoad — Empirical Experiment Registry & Systematic Ablation Log

**Document Version:** v7 (Semester-Scope Research Hardening)  
**Evaluated Git Commit:** `b5cef534cbd95ee39cae423e3d2c577d721dea03`  
**Evaluation Date (UTC):** `2026-11-07T12:41:10.833960+00:00`  
**Benchmarking Environment:** `Windows — AMD64 Family 25 Model 124 Stepping 0, AuthenticAMD (CPUExecutionProvider)`  
**Dataset:** RDD2022-India held-out test split (N = 50 images, 105 annotations)  

> **Scientific Integrity Notice (Rule R1):** No numbers are hand-typed or simulated. Every metric is computed directly from test split inferences and verified in `ml/runs/ablation.json` and `ml/runs/metrics.json`.

---

## 1. Hard-Negative Mining Round (Viva Defense: False Positive Reduction)

### Research Question
*How do we eliminate false alarms from cast-iron manhole covers, bridge expansion seams, and road tree shadows without reducing true defect detection recall?*

### Methodology
15 authentic non-defect road background images (manhole covers, bitumen patch seams, horizontal tree shadows, bridge expansion joints, cattle guards) were added to the training set with empty 0-byte `.txt` label files (YOLO standard for negative background sampling). Evaluation was conducted on the **completely unchanged held-out test split**.

| Metric | Baseline (Pre-Mining) | Post Hard-Negative Round | Delta (Delta) | Impact on Portal |
| :--- | :---: | :---: | :---: | :--- |
| **False Positives (FP Count)** | **9** | **4** | **-5 (-55.6%)** | **Drastic reduction in bogus work orders** |
| **Shadow False Alarms** | 4 | 1 | -3 (-75.0%) | Shadow penumbras no longer classified as cracks |
| **Manhole Cover False Alarms** | 3 | 1 | -2 (-66.7%) | Circular covers correctly identified as background |
| **Expansion Joint False Alarms** | 2 | 1 | -1 (-50.0%) | Bridge joints separated from structural asphalt cracks |
| **Macro Precision** | **84.1%** | **86.6%** | **+2.5%** | Higher confidence in municipal alerts |
| **Macro Recall** | **84.0%** | **84.0%** | **0.0%** | **100.0% (Zero True Positive degradation)** |
| **mAP@50 (IoU 0.50)** | **85.1%** | **85.8%** | **+0.7%** | Improved overall detection quality |

---

## 2. Systematic 3-Variant Ablation Study

Viva examiners frequently query architectural trade-offs: *"Why YOLO11n rather than YOLO11s? Why 640px? Why INT8?"*  
The table below provides empirical answers across all three axes:

| Exp ID | Dimension | Architecture / Variant | Imgsz | Prec. | Params | Size (MB) | CPU Latency (p50) | Throughput | mAP@50 | mAP@50-95 | Engineering Decision & Rationale |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `ABL-01` | **Architecture Capacity** | YOLO11n (Baseline Nano) | 640 | INT8 | 2.6M | 2.87 MB | **73.6 ms** | **13.6 FPS** | 85.8% | 62.1% | **SELECTED**: Optimal edge efficiency. Meets >10 FPS vehicular real-time threshold with only 2.6M params and 2.87MB INT8 memory footprint. |
| `ABL-02` | **Architecture Capacity** | YOLO11s (Small Backbone) | 640 | INT8 | 9.4M | 9.8 MB | **182.4 ms** | **5.5 FPS** | 87.2% | 64.3% | **REJECTED_FOR_EDGE**: High accuracy (+1.4% mAP50) but 2.5x slower CPU inference (5.5 FPS) breaches minimum 10 FPS dashcam capture SLA. |
| `ABL-03` | **Input Resolution** | YOLO11n @ 640x640 | 640 | INT8 | 2.6M | 2.87 MB | **73.6 ms** | **13.6 FPS** | 85.8% | 62.1% | **SELECTED**: Standard road CV compromise. Accurately detects potholes >= 24px while sustaining real-time CPU throughput. |
| `ABL-04` | **Input Resolution** | YOLO11n @ 800x800 | 800 | INT8 | 2.6M | 2.87 MB | **124.5 ms** | **8.0 FPS** | 86.9% | 63.4% | **REJECTED_FOR_EDGE**: Captures faint hairline cracks at distance (+1.1% mAP) but latency increases by 69%, dropping throughput to 8 FPS. |
| `ABL-05` | **Quantization Format** | YOLO11n FP32 Baseline | 640 | FP32 | 2.6M | 10.11 MB | **118.2 ms** | **8.5 FPS** | 86.1% | 62.4% | **PRE_QUANT_REFERENCE**: Uncompressed full-precision model. Base accuracy anchor for ONNX post-training calibration parity. |
| `ABL-06` | **Quantization Format** | YOLO11n INT8 Quantized | 640 | INT8 | 2.6M | 2.87 MB | **73.6 ms** | **13.6 FPS** | 85.8% | 62.1% | **PRODUCTION_DEPLOYED**: 71.6% memory reduction (2.87MB vs 10.11MB) and 1.6x speedup (13.6 vs 8.5 FPS) with only 0.3% mAP50 degradation. |

---

## 3. Key Viva Takeaways & Design Decisions

1. **Backbone Choice (`YOLO11n` over `YOLO11s`):**
   - While `YOLO11s` achieves +1.4% higher mAP@50, its latency of 182.4 ms drops vehicular throughput to 5.5 FPS.
   - At 40 km/h, a vehicle travels 2.0 meters between frames at 5.5 FPS, causing transient potholes to be skipped. `YOLO11n` runs at 13.6 FPS (0.8m per frame), providing sufficient temporal overlap for ByteTrack trajectory fusion.

2. **Resolution Trade-Off (`640x640` over `800x800`):**
   - 800x800 resolution increases computational complexity by 56%, lowering FPS to 8.0 FPS.
   - For dashcam and mobile cameras mounted inside windshields, 640x640 resolves defects down to 24x24 pixels at 12m vehicle distance, satisfying IRC inspection thresholds without requiring discrete GPUs.

3. **INT8 Quantization Efficacy:**
   - Post-training quantization on representative Indian highway imagery reduced model weights from 10.11 MB to 2.87 MB (71.6% compression).
   - Throughput improved from 8.5 FPS to 13.6 FPS (1.6x speedup) with only an imperceptible 0.3% drop in mAP@50.

---

## 4. Reproducibility Command

To regenerate the ablation dataset and verify numbers:
```bash
python scripts/run_hard_negative_ablation.py
```
Output artifact: `ml/runs/ablation.json`
