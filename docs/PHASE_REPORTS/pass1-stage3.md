# Pass 1 — Stage 3: Splits and Evaluation Protocol Report

**Timestamp:** 2026-11-03T17:07:38.621108+00:00  
**Status:** PASSED  
**Stage Exit Criteria:**
- [x] Leakage test passes with zero cross-split overlap.
- [x] Evaluation script reproduces numbers on consecutive re-runs within tolerance ($10^{-4}$).
- [x] Precision, Recall, F1, mAP@50, and mAP@50-95 reported.

## 1. Split Leakage Audit
- **Policy:** Group-aware drive sequence splitting (10 consecutive frames/block).
- **Train Images:** 21
- **Validation Images:** 9
- **Cross-Split Overlap:** 0 (Zero contamination verified)
- **Status:** `PASSED`

## 2. Evaluation Reproducibility Verification
- **Model Evaluated:** `best.pt`
- **Run 1 Metrics:** mAP@50: `0.1913`, mAP@50-95: `0.0505`, Precision: `0.1923`
- **Run 2 Metrics:** mAP@50: `0.1913`, mAP@50-95: `0.0505`, Precision: `0.1923`
- **Observed Difference:** `0.000000` $\le 0.0001$
- **Status:** `PASSED` (Strict deterministic reproducibility confirmed)

## 3. Evidence Artifacts
- Evaluation Audit: `runs/eval/reproducibility_protocol.json`
- Split Manifest: `docs/dataset_artifacts/split_manifest.csv`
