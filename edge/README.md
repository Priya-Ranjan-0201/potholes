# ScamRoad — Edge Agent

On-device inference agent designed to run on low-power hardware (Jetson Nano/Orin, Raspberry Pi 5, Coral Dev Board).

## Capabilities

| Module | Responsibility |
|---|---|
| `capture.py` | Non-blocking camera ring-buffer capture |
| `infer.py` | ONNX / TFLite model inference |
| `track.py` | Multi-object tracking (ByteTrack / BoT-SORT) |
| `geotag.py` | GPS geotagging with Kalman-filter smoothing |
| `blur_privacy.py` | Face & licence-plate privacy blur |
| `outbox.py` | SQLite WAL outbox for offline-first queuing |
| `sync.py` | Resumable upload sync to backend API |
| `health.py` | Device health monitoring (FPS, temp, RAM) |

## Deployment

```bash
# Install systemd service (Linux)
sudo cp edge/systemd/scamroad-edge.service /etc/systemd/system/
sudo systemctl enable --now scamroad-edge

# Run manually
python -m edge.agent.infer --config edge/configs/edge_config.yaml
```

## Benchmarks

Run device benchmarks with:

```bash
python -m edge.benchmarks.run_benchmark --device jetson
```
