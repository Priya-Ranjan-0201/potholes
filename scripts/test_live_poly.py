"""Live 70/30 Ensemble Inference Smoke Test across all repository benchmark samples."""

from pathlib import Path
import sys
import requests

REPO_ROOT = Path(__file__).resolve().parent.parent
SAMPLES_DIR = REPO_ROOT / "web" / "public" / "samples"
API_URL = "http://127.0.0.1:8000/api/v1/infer"

BENCHMARK_SAMPLES = [
    ("Bengaluru Arterial", SAMPLES_DIR / "bengaluru_potholes.jpg"),
    ("Mumbai Monsoon", SAMPLES_DIR / "mumbai_potholes.avif"),
    ("Alligator Cracks", SAMPLES_DIR / "alligator_cracks.jpg"),
    ("Civil Distress Diagram", SAMPLES_DIR / "civil_distress_diagram.jpg"),
    ("Asphalt Crater", SAMPLES_DIR / "asphalt_crater.jpg"),
]


def main() -> int:
    for name, path in BENCHMARK_SAMPLES:
        if not path.exists():
            print(f"[MISSING] {name}: {path}")
            return 1
        with path.open("rb") as f:
            resp = requests.post(API_URL, files={"file": (path.name, f)}, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        print(f"\n=== {name} ({path.name}) ===")
        print(f"Engine: {data.get('engine')} | Latency: {data.get('latency_ms')} ms")
        print(
            f"Defects: {data.get('total_defects')} | "
            f"Potholes: {data.get('pothole_count')} | Cracks: {data.get('crack_count')}"
        )
        for d in data.get("detections", [])[:4]:
            poly = d.get("polygon") or []
            print(
                f"  {d['label']} ({d['confidence'] * 100:.0f}%): "
                f"box={d['box']}, poly_pts={len(poly)}, model={d.get('model_source')}"
            )
    return 0


if __name__ == "__main__":
    sys.exit(main())
