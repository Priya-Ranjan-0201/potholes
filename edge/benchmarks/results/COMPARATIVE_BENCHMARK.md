# ScamRoad Model Comparative Benchmark Report

**Evaluated At**: 2026-10-31T02:51:45.410895+00:00  
**Device Profile**: `generic`  
**Platform**: `Windows-11-10.0.26300-SP0`  
**Iterations**: `50` (Warmup: `10`)  

## 1. FP32 vs INT8 Performance Comparison

| Metric | FP32 Baseline | INT8 Quantized | Delta / Improvement |
|---|---|---|---|
| **Model Size** | 12.18 MB | 3.35 MB | **-72.5%** |
| **Latency p50** | 41.16 ms | 20.75 ms | **1.98x faster** |
| **Latency p95** | 55.08 ms | 22.78 ms | -32.3 ms |
| **Latency Mean** | 42.38 ms | 20.84 ms | -21.54 ms |
| **Throughput (FPS)** | 23.6 FPS | 47.98 FPS | **+2.03x FPS** |
| **Peak Process RSS** | 130.61 MB | 96.54 MB | -34.07 MB |

## 2. Hardware Telemetry Details

- **Processor**: `AMD64 Family 25 Model 124 Stepping 0, AuthenticAMD`
- **Logical CPU Cores**: `12`
- **System RAM**: `15.23 GB`
- **Runtime Provider**: `CPUExecutionProvider`

---
*Report generated automatically by `edge/benchmarks/run_benchmark.py`.*  
*Adheres strictly to Rule R1 (Truth over appearance).*
