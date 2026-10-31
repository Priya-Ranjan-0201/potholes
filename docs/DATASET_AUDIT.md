# ScamRoad Dataset Audit Report

> **Generated at:** 2026-10-31T02:40:24.011941+00:00
> **Audit Status:** Verified from disk files (Rule R1: Truth over appearance).

---

## 1. Image Quality and Integrity

- **Total Images Inspected:** 30
- **Valid Images:** 30
- **Corrupt Images:** 0
- **Exact Duplicate Groups (SHA-256):** 0
- **Perceptual Duplicate Pairs (pHash <= 4):** 24

### Common Resolutions

| Width | Height | Count |
|---|---|---|
| 720 | 720 | 30 |

---

## 2. Annotation & Class Distribution

- **Total Annotation Files:** 30
- **Total Bounding Boxes:** 33
- **Invalid / Degraded Lines:** 0

### Class Breakdown

| Class Code | Instances | Percentage |
|---|---|---|
| `POTHOLE` | 18 | 54.5% |
| `CRACK_LONG` | 15 | 45.5% |

### Object Scale (COCO Criteria @ 640px equivalent)

- **Small (< 32² px):** 0
- **Medium (32²-96² px):** 0
- **Large (> 96² px):** 33

---

## 3. Data Leakage Verification

- **Leakage Detected:** ✅ NONE (PASSED)
- **Train Samples:** 21
- **Val Samples:** 9
- **Test Samples:** 0
- **Train/Val Overlap:** 0
- **Train/Test Overlap:** 0

