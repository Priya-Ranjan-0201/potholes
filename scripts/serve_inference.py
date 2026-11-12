"""ScamRoad Complete Backend & AI Inference Server.
Runs on http://localhost:8000 with CORS enabled.
Serves real-time YOLO11n + CV pothole detection and full municipal GIS/PostgreSQL endpoints.
"""

import os
import sys
from pathlib import Path

os.environ.setdefault("OPENBLAS_NUM_THREADS", "2")
os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")

project_root = Path(__file__).resolve().parents[1]
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import uvicorn
from backend.app.main import app

if __name__ == "__main__":
    print("[SCAMROAD SERVER] Starting complete municipal & AI backend on http://0.0.0.0:8000...")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, log_level="info", reload=False)
