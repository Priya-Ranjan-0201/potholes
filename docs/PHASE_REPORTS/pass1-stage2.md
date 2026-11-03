# Pass 1 — Stage 2: Data Audit and Cleaning Report

**Timestamp:** 2026-11-03T07:17:00Z  
**Status:** PASSED  
**Stage Exit Criteria:**
- [x] `docs/DATASET_AUDIT.md` generated with full audit statistics.
- [x] Zero cross-split duplicates verified (`has_leakage: false`).
- [x] Taxonomy mapping decisions recorded in `configs/taxonomy.yaml`.
- [x] Dataset manifest hashed (`dataset_v1.0` SHA-256: `1ab5e956961ada65317531ed87507c858908713c7429617c75637bf01a1f2bee`).

## 1. Summary of Audit Metrics
- **Total Evaluated Images:** 30
- **Valid / Non-corrupt Images:** 30 (100.0%)
- **Exact File Duplicates:** 0
- **Cross-Split Leakage Overlaps:** 0 (Train: 21, Val: 9, Test: 0)
- **Bounding Boxes Audited:** 33 total
  - `POTHOLE`: 18 instances (54.5%)
  - `CRACK_LONG`: 15 instances (45.5%)
- **Invalid / Degenerate Boxes:** 0 (0 clamped, 0 rejected)
- **Bounding Box Sizing:** 100% large-scale surface anomalies relative to resolution ($720\times 720$)

## 2. Class Imbalance Assessment
- The sample benchmark exhibits a moderate class balance of 1.2:1 between `POTHOLE` and `CRACK_LONG`.
- Higher-tier crack classes (`D10` Transverse, `D20` Alligator) are marked `NOT_AVAILABLE` in `configs/taxonomy.yaml` until multi-national full-scale RDD ingestion occurs in cloud training passes.

## 3. Manifest Hash & Versioning
- **Dataset Version:** `dataset_v1.0`
- **Manifest Location:** `docs/dataset_artifacts/dataset_manifest.csv`
- **SHA-256 Checksum:** `1ab5e956961ada65317531ed87507c858908713c7429617c75637bf01a1f2bee`
- **Audit JSON Citation:** `runs/audit/audit_latest.json`

