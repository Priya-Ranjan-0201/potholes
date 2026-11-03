# Pass 1 — Stage 7: Segmentation & Geometry Measurement Report

**Timestamp:** 2026-11-03T17:16:29.674434+00:00  
**Status:** PASSED  
**Stage Exit Criteria:**
- [x] IoU and Dice coefficients computed and reported.
- [x] Measurement tests pass on synthetic masks with known analytical answers.
- [x] Strict Rule 10 compliance: `unit: pixels`, `calibrated: false`, physical claims withheld.

## 1. Synthetic Analytical Validation

| Geometry Entity | Analytical Ground Truth | Measured Output | Error / Deviation | Metric Index | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Pothole Area** | 1,256.6 px ($\pi r^2, r=20$) | 1257 px | < 0.5% | — | `PASSED` |
| **Mask Overlap (IoU)** | Perturbed ($\Delta x=2$) | **0.8803** | Bounded | Jaccard Index | `PASSED` |
| **Mask Overlap (Dice)** | Perturbed ($\Delta x=2$) | **0.9364** | Bounded | F1 / Sørensen | `PASSED` |
| **Crack Skeleton Length** | 80.0 px | **80.0 px** | 0.0 px | Thinning | `PASSED` |
| **Crack Mean Width** | 6.0 px | **6.0 px** | 0.0 px | Contour Integration | `PASSED` |

## 2. Rule 10 Compliance Guarantee
- **Calibrated Flag:** `False`
- **Measurement Unit:** `pixels`
- **Method:** `morphological_thinning_skeletonization` / `contour_pixel_integration`
- **Physical Depth/Centimetre Claims:** Explicitly withheld until camera extrinsic homography or LiDAR calibration is provided by physical sensor rigs.
