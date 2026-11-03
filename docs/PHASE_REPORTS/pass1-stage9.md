# Pass 1 — Stage 9: Export, Quantization & Edge Benchmark Report

**Timestamp:** 2026-11-03T17:22:02.316187+00:00  
**Status:** PASSED  
**Stage Exit Criteria:**
- [x] Model exported to ONNX with pinned opset 17 and valid graph structure.
- [x] INT8 dynamic quantization applied (72.7% size reduction).
- [x] PyTorch vs ONNX numerical parity test passed within tolerance ($10^{-2}$).
- [x] Host laptop benchmark generated; physical edge hardware marked `UNTESTED` and queued in `docs/HUMAN_TODO.md`.

## 1. Export & Quantization Summary

| Format | Precision | File Size (MB) | Compression | SHA-256 | Graph Validation |
| :--- | :---: | :---: | :---: | :--- | :---: |
| **PyTorch Checkpoint** | FP32 | 6.2 MB | Baseline | Verified | — |
| **ONNX Runtime** | FP32 | 12.18 MB | 0.0% | `02056684af4e176b...` | `VALID` (Opset 17) |
| **Quantized ONNX** | INT8 | 3.32 MB | **72.7%** | Checksummed | `VALID` |

## 2. Numerical Parity Verification
- **Test:** PyTorch tensor output vs ONNX Runtime output across sample images.
- **Mean Maximum Discrepancy:** `0.00097` $\le 10^{-2}$
- **Status:** `PASSED`

## 3. Edge Hardware Benchmark Matrix

| Hardware Target | Runtime Engine | FPS | Latency p50 (ms) | Latency p95 (ms) | Status | Action Required |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Host Laptop CPU** | ONNX Runtime (CPU) | **21.0** | 45.46 | 53.29 | `BENCHMARKED` | Ready |
| **Raspberry Pi 5** | TFLite / ONNX Runtime | — | — | — | `UNTESTED` | Queued in `docs/HUMAN_TODO.md` (HT-03) |
| **Jetson Orin Nano** | TensorRT 8.6 | — | — | — | `UNTESTED` | Queued in `docs/HUMAN_TODO.md` (HT-03) |
| **OPPO K13 Smartphone**| NNAPI / TFLite INT8 | — | — | — | `UNTESTED` | Queued in `docs/HUMAN_TODO.md` (HT-03) |
