# Pass 1 — Stage 0: Environment Check & Hardware Diagnostics

**Timestamp:** 2026-11-03T07:15:04.536447+00:00  
**Status:** PASSED  
**Stage Exit Criteria:**
- [x] Hardware specifications reported.
- [x] VRAM probe log generated and batch size justified.
- [x] 1-epoch smoke test passes with verified artifacts.
- [x] Estimated GPU hours recorded in `ml/STATE.json`.

## Hardware Diagnostics
- **Platform:** `Windows-11-10.0.26300-SP0`
- **CPU:** `AMD64 Family 25 Model 124 Stepping 0, AuthenticAMD` (12 logical cores)
- **GPU:** `NVIDIA GeForce RTX 3050 6GB Laptop GPU` (6.0 GB VRAM)
- **CUDA Version:** `Hardware Driver Present`
- **PyTorch:** `2.15.0+cpu` | **Ultralytics:** `8.4.194`
- **Free Disk:** `23.18 GB`

## VRAM Probe & Batch Size Justification
- **Hardware Tier:** Entry (RTX 3050 4-6GB)
- **Selected Batch Size:** 8 (Gradient Accumulation: 4)
- **Effective Batch Size:** 32
- **Justification:** VRAM of 6.0 GB places runner in Entry (RTX 3050 4-6GB). Physical batch=8 with accumulation=4 preserves effective batch=32 without Out-Of-Memory hazards.

## End-to-End Smoke Test
- **Status:** `PASSED`
- **Execution Time:** `13.31 s`
- **Measured Throughput:** `2.25 images/sec`
- **Artifacts:**
  - `runs/env_check/smoke_test/weights/last.pt`
  - `runs/env_check/smoke_test/args.yaml`
