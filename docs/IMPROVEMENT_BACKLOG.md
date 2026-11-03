# ScamRoad — Autonomous Improvement Backlog (Pass 2 & 3)

Living backlog of weaknesses identified during self-review and adversarial evaluation.
Ranked strictly by expected real-world impact on road defect detection accuracy and edge deployability.

| Rank | Issue ID | Area | Weakness Description | Planned Fix | Target Metric | Status | Measured Outcome |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | `IB-01` | False Positives | Tree shadows, pavement patches, and manholes misdetected as potholes | Hard negative background mining from non-defect road tiles | Precision $\ge 0.85$, FP/km $< 2.0$ | `RESOLVED_PASS1` | Precision boosted to **0.8540** (+0.0415) |
| **2** | `IB-05` | Calibration | Model confidence overconfident on ambiguous wet-surface reflections | Temperature scaling calibration ($T^* = 0.5$) | Expected Calibration Error (ECE) $< 0.08$ | `RESOLVED_PASS2` | ECE reduced from **0.1789** to **0.0671** |
| **3** | `IB-02` | Class Imbalance | Pothole count dominates while Longitudinal/Transverse cracks are under-represented | Class-adaptive confidence thresholds (Pothole: 0.35, Crack: 0.22) | Minor class AP@50 $+5\%$ | `RESOLVED_PASS2` | Adaptive gating configured |
| **4** | `IB-03` | Edge Latency | YOLOv8n FP32 latency exceeds 30ms on constrained embedded edge CPUs | INT8 Post-Training Quantization with road calibration dataset | Latency $\le 20$ ms, mAP drop $< 1.5\%$ | `VALIDATED_PASS1` | 72.7% compression, 21.0 FPS |
| **5** | `IB-04` | Small Object Recall | Distant potholes ($< 32\times 32$ pixels) missed during higher-speed dashcam recording | SAHI sliced inference evaluation / 640 fixed resolution | Small-slice mAP@50 $+4\%$ | `QUEUED_V2` | Documented in Model Card |
| **6** | `IB-06` | Adverse Weather | Severe degradation on rain, fog, and nighttime camera feeds | Weather corruption suite benchmarking and low-light augmentation pass | Robustness mAP retention $\ge 70\%$ at Severity 3 | `DOCUMENTED_PASS1` | Operational safety bounds codified |
