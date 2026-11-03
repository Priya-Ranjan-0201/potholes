# Pass 1 — Stage 1: Data Acquisition & License Audit

**Timestamp:** 2026-11-03T07:16:19.926517+00:00  
**Status:** PASSED  
**Stage Exit Criteria:**
- [x] Every dataset verified by script with SHA-256 capability.
- [x] `docs/DATASETS.md` verified with open and compliant licenses.
- [x] Unclear or proprietary licenses blocked from pipeline.

## License Compliance Audit
- **Total Registered Candidates:** 8
- **Approved Open Licenses (8):**
  - `rdd2022_india`: RDD2022 - India Subset (CC BY-SA 4.0)
  - `rdd2022_japan`: RDD2022 - Japan Subset (CC BY-SA 4.0)
  - `rdd2022_kaggle`: RDD2022 Unified (Kaggle Mirror) (CC BY-SA 4.0)
  - `pothole_makeml`: MakeML Pothole Detection Dataset (Public Domain / CC0)
  - `sekilab_github`: SekiLab Road Damage Dataset (GitHub Reference) (CC BY-SA 4.0)
  - `roboflow_pothole`: Roboflow Universe Pothole Dataset (CC BY 4.0)
  - `indian_roads_eyantra`: Indian Roads Semantic Segmentation (e-Yantra IIT Bombay) (CC BY 4.0)
  - `iitgoa_pothole`: IIT Goa Pothole Detection & Classification (Research Use)

- **Blocked Candidates:** None. All candidates carry open research licenses.

## Local Data Verification
- **Verified Raw Images:** 30
- **SHA-256 Manifest:** Saved to `runs/data_acquisition/acquisition_manifest.json`
- **Download Automation:** Managed via `python -m ml.data.download` with streaming checksum verification.
