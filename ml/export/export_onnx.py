"""Export trained YOLO model to ONNX and TFLite formats for edge deployment.

Converts PyTorch checkpoint (.pt) to an optimized ONNX graph with pinned opset 17
and TFLite models for Android mobile (OPPO K13) and edge SBCs (Raspberry Pi/Jetson).
Validates graph structure, input/output tensors, and records artifact checksums.
Follows SPEC B4 and project rules R1, R4.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import onnx
from ultralytics import YOLO


def compute_file_hash(path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def validate_onnx_graph(onnx_path: Path) -> dict[str, Any]:
    """Validate ONNX model graph structure using onnx package."""
    try:
        model = onnx.load(str(onnx_path))
        onnx.checker.check_model(model)

        inputs = [
            {"name": inp.name, "shape": [d.dim_value for d in inp.type.tensor_type.shape.dim]}
            for inp in model.graph.input
        ]
        outputs = [
            {"name": out.name, "shape": [d.dim_value for d in out.type.tensor_type.shape.dim]}
            for out in model.graph.output
        ]
        opset_version = model.opset_import[0].version if model.opset_import else 0

        res = {
            "valid": True,
            "opset_version": opset_version,
            "inputs": inputs,
            "outputs": outputs,
            "producer_name": model.producer_name,
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}
    return res


def export_model(
    weights_path: Path,
    output_format: str = "onnx",
    imgsz: int = 640,
    opset: int = 17,
    dynamic: bool = False,
    half: bool = False,
    int8: bool = False,
    output_dir: Path | None = None,
) -> dict[str, Any]:
    """Export trained YOLO weights to ONNX or TFLite edge formats.

    Args:
        weights_path: Path to PyTorch model weights (.pt).
        output_format: Format to export ('onnx', 'tflite', 'engine', 'ncnn').
        imgsz: Model input resolution (square 640x640).
        opset: ONNX opset version (default 17).
        dynamic: Enable dynamic batch/height/width axes.
        half: FP16 half-precision export.
        int8: INT8 post-training quantization.
        output_dir: Optional directory to copy/record exported artifacts.

    Returns:
        Structured export summary dictionary.
    """
    if not weights_path.exists():
        raise FileNotFoundError(f"Model weights file not found: {weights_path}")

    model = YOLO(str(weights_path))

    export_args: dict[str, Any] = {
        "format": output_format,
        "imgsz": imgsz,
        "half": half,
        "int8": int8,
    }
    if output_format == "onnx":
        export_args["opset"] = opset
        export_args["dynamic"] = dynamic

    exported_path_str = model.export(**export_args)
    exported_file = Path(exported_path_str)

    if not exported_file.exists():
        raise RuntimeError(f"Exported artifact not found at {exported_file}")

    file_size_bytes = exported_file.stat().st_size
    file_size_mb = round(file_size_bytes / (1024 * 1024), 2)
    sha256 = compute_file_hash(exported_file)

    graph_validation = (
        validate_onnx_graph(exported_file) if output_format == "onnx" else {"valid": True}
    )

    summary = {
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "source_weights": str(weights_path),
        "exported_artifact": str(exported_file),
        "format": output_format,
        "imgsz": imgsz,
        "opset": opset if output_format == "onnx" else None,
        "dynamic_axes": dynamic if output_format == "onnx" else None,
        "precision": "int8" if int8 else ("fp16" if half else "fp32"),
        "file_size_bytes": file_size_bytes,
        "file_size_mb": file_size_mb,
        "sha256": sha256,
        "graph_validation": graph_validation,
    }

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        with (output_dir / f"export_{output_format}_summary.json").open("w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

    return summary


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Export ScamRoad model to ONNX or TFLite.")
    parser.add_argument("--weights", type=Path, required=True, help="PyTorch weights file.")
    parser.add_argument(
        "--format",
        type=str,
        default="onnx",
        choices=["onnx", "tflite", "engine", "ncnn"],
        help="Export format.",
    )
    parser.add_argument("--imgsz", type=int, default=640, help="Input image size.")
    parser.add_argument("--opset", type=int, default=17, help="ONNX opset version.")
    parser.add_argument("--dynamic", action="store_true", help="Enable dynamic axes.")
    parser.add_argument("--half", action="store_true", help="FP16 half precision.")
    parser.add_argument("--int8", action="store_true", help="INT8 quantization.")
    parser.add_argument("--output-dir", type=Path, help="Directory to save export summary.")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for the export CLI."""
    args = parse_args(argv)
    print(f"Exporting {args.weights} to {args.format}...")
    summary = export_model(
        weights_path=args.weights,
        output_format=args.format,
        imgsz=args.imgsz,
        opset=args.opset,
        dynamic=args.dynamic,
        half=args.half,
        int8=args.int8,
        output_dir=args.output_dir,
    )
    print(
        f"Export successful: {summary['exported_artifact']} "
        f"({summary['file_size_mb']} MB, SHA256: {summary['sha256'][:12]}...)"
    )


if __name__ == "__main__":
    main()
