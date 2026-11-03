"""ScamRoad Google Cloud Vertex AI Custom Training Job Dispatcher.

Launches scalable GPU training jobs on Google Cloud Vertex AI with automatic
checkpoint persistence to Google Cloud Storage (GCS) and fault-tolerant auto-resume.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def launch_vertex_training_job(
    project_id: str,
    region: str = "us-central1",
    bucket_name: str = "scamroad-vertex-artifacts",
    display_name: str = "scamroad-yolo11-training",
    accelerator_type: str = "NVIDIA_TESLA_T4",
    accelerator_count: int = 1,
    machine_type: str = "n1-standard-4",
) -> None:
    """Submit a custom training job to Google Cloud Vertex AI."""
    try:
        from google.cloud import aiplatform  # noqa: PLC0415
    except ImportError:
        print("[ERROR] google-cloud-aiplatform library is not installed.")
        print("        Install with: pip install google-cloud-aiplatform")
        sys.exit(1)

    print("=" * 65)
    print("      LAUNCHING SCAMROAD ON GOOGLE CLOUD VERTEX AI GPU       ")
    print("=" * 65)
    print(f" GCP Project ID   : {project_id}")
    print(f" Compute Region   : {region}")
    print(f" Storage Bucket   : gs://{bucket_name}")
    print(f" Accelerator Type : {accelerator_type} (Count: {accelerator_count})")
    print(f" Machine Type     : {machine_type}")
    print("=" * 65)

    aiplatform.init(project=project_id, location=region, staging_bucket=f"gs://{bucket_name}")

    job = aiplatform.CustomJob.from_local_script(
        display_name=display_name,
        script_path=str(Path(__file__).parent / "startup_gce_gpu.sh"),
        container_uri="us-docker.pkg.dev/vertex-ai/training/pytorch-gpu.2-1.py310:latest",
        requirements=[
            "ultralytics>=8.1.0",
            "onnx>=1.15.0",
            "pyyaml>=6.0",
            "psutil>=5.9.0",
            "imagehash>=4.3.1",
        ],
        machine_type=machine_type,
        accelerator_type=accelerator_type,
        accelerator_count=accelerator_count,
        environment_variables={
            "GCS_BUCKET": f"gs://{bucket_name}",
        },
    )

    print("[INFO] Submitting job to Vertex AI...")
    job.run(sync=False)
    print(f"[SUCCESS] Vertex AI Job submitted! Resource Name: {job.resource_name}")


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for GCP Vertex AI deployment."""
    parser = argparse.ArgumentParser(
        description="Deploy ScamRoad Training to Google Cloud Vertex AI"
    )
    parser.add_argument("--project-id", type=str, required=True, help="Google Cloud Project ID")
    parser.add_argument("--region", type=str, default="us-central1", help="Google Cloud Region")
    parser.add_argument(
        "--bucket", type=str, default="scamroad-vertex-artifacts", help="GCS Bucket"
    )
    parser.add_argument(
        "--accelerator", type=str, default="NVIDIA_TESLA_T4", help="GCP GPU Accelerator type"
    )
    return parser.parse_args()


if __name__ == "__main__":
    cli_args = parse_args()
    launch_vertex_training_job(
        project_id=cli_args.project_id,
        region=cli_args.region,
        bucket_name=cli_args.bucket,
        accelerator_type=cli_args.accelerator,
    )
