# ScamRoad — Human Actions & Decision Queue (Rule R15)

The autonomous agent pauses only for items in this file that strictly require human authorization or physical hardware access. All other development proceeds autonomously.

---

| Item ID | Category | Description | Status | Added Date |
| :--- | :--- | :--- | :--- | :--- |
| `H-001` | Data / Labelling | Collect and label targeted local Indian road corridor test videos (e.g. Ludhiana / Punjab road sequences) for spatial deduplication ground truth. | PENDING | 2026-11-07 |
| `H-002` | Hardware | Run real physical on-device inference latency benchmarks on target devices (OPPO K13, Raspberry Pi 5, NVIDIA Jetson Orin) and provide raw `bench/*.json` outputs. | PENDING | 2026-11-07 |
| `H-003` | Secrets / Cloud | Provide cloud GPU production credentials or API tokens if cloud training outside Colab/Kaggle free tier is requested. | OPTIONAL | 2026-11-07 |
| `H-004` | Field Drive / IMU | Record smartphone accelerometer/gyroscope drive data over real potholes to empirically validate bump detection threshold (pipeline implemented in `edge/agent/sensor_fusion.py`). | PENDING | 2026-11-07 |
| `H-005` | Rater Study | Distribute `bench/rater_study_template.csv` to 3–5 classmates/engineers to rate defect severity and compute real inter-annotator Kappa agreement via `scripts/rater_study_kit.py`. | PENDING | 2026-11-07 |
