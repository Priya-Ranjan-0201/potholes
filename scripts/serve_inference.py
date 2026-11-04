"""Standalone ScamRoad Inference Microservice.
Runs on http://localhost:8000/api/v1/infer with CORS enabled.
Supports real-time YOLO11n + CV pothole detection without database dependency.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.infer import router as infer_router

app = FastAPI(title="ScamRoad AI Inference Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(infer_router, prefix="/api/v1")

@app.get("/health")
@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "scamroad-inference-server"}

if __name__ == "__main__":
    print("[INFERENCE SERVER] Starting on http://0.0.0.0:8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

