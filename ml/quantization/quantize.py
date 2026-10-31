"""Post-training quantization for edge deployment on mobile and embedded devices.

Quantizes FP32 ONNX graphs to INT8 or FP16 precision using ONNX Runtime.
Supports calibration data readers for representative quantization on real road imagery
to preserve defect detection accuracy while halving memory footprint and accelerating inference.
Evaluates and reports output accuracy drift against the FP32 baseline.
Follows SPEC A3, B4 and rules R1, R4.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
import onnx
import onnxruntime as ort
from onnxruntime.quantization import (
    CalibrationDataReader,
    QuantFormat,
    QuantType,
    quantize_dynamic,
    quantize_static,
)
from PIL import Image


def compute_file_hash(path: Path) -> str:
    """Compute SHA-256 hash of a file."""
    hasher = hashlib.sha256()
    with path.open("rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


class RoadCalibrationDataReader(CalibrationDataReader):
    """Feeds preprocessed road pavement images to ONNX static quantization calibrator."""

    def __init__(
        self,
        image_dir: Path,
        input_name: str = "images",
        imgsz: int = 640,
        max_samples: int = 100,
    ) -> None:
        super().__init__()
        self.input_name = input_name
        self.imgsz = imgsz
        valid_exts = {".jpg", ".jpeg", ".png", ".bmp"}
        self.image_paths = [
            p for p in image_dir.rglob("*") if p.is_file() and p.suffix.lower() in valid_exts
        ][:max_samples]
        self.enum_data: list[dict[str, np.ndarray]] = []
        self._preprocess_all()
        self.data_iter = iter(self.enum_data)

    def _preprocess_all(self) -> None:
        """Preprocess images into normalized [1, 3, H, W] float32 arrays."""
        for img_path in self.image_paths:
            try:
                with Image.open(img_path) as img:
                    img_rgb = img.convert("RGB").resize((self.imgsz, self.imgsz))
                    arr = np.array(img_rgb, dtype=np.float32) / 255.0
                    # Transpose to NCHW
                    arr = np.transpose(arr, (2, 0, 1))
                    arr = np.expand_dims(arr, axis=0)
                    self.enum_data.append({self.input_name: arr})
            except Exception:  # noqa: S112
                continue

    def get_next(self) -> dict[str, np.ndarray] | None:
        """Return next calibration data batch."""
        return next(self.data_iter, None)

    def rewind(self) -> None:
        """Reset iteration."""
        self.data_iter = iter(self.enum_data)


def evaluate_quantization_drift(
    fp32_model_path: Path,
    quant_model_path: Path,
    calibration_dir: Path,
    imgsz: int = 640,
    max_samples: int = 30,
) -> dict[str, Any]:
    """Measure empirical accuracy drift of quantized ONNX model against FP32 baseline.

    Feeds real road pavement images into both sessions, measuring output tensor
    cosine similarity, Mean Squared Error (MSE), and maximum absolute error.
    """
    valid_exts = {".jpg", ".jpeg", ".png", ".bmp"}
    img_paths = [
        p for p in calibration_dir.rglob("*") if p.is_file() and p.suffix.lower() in valid_exts
    ][:max_samples]

    if not img_paths:
        return {
            "status": "SKIPPED",
            "reason": "No evaluation images found in calibration directory",
        }

    opts = ort.SessionOptions()
    opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

    sess_fp32 = ort.InferenceSession(
        str(fp32_model_path), sess_options=opts, providers=["CPUExecutionProvider"]
    )
    sess_quant = ort.InferenceSession(
        str(quant_model_path), sess_options=opts, providers=["CPUExecutionProvider"]
    )

    in_name = sess_fp32.get_inputs()[0].name

    cosine_sims: list[float] = []
    mses: list[float] = []
    max_diffs: list[float] = []

    for img_p in img_paths:
        try:
            with Image.open(img_p) as img:
                rgb = img.convert("RGB").resize((imgsz, imgsz))
                arr = (np.array(rgb, dtype=np.float32) / 255.0).transpose((2, 0, 1))
                tensor = np.expand_dims(arr, axis=0)

            out_fp32 = sess_fp32.run(None, {in_name: tensor})[0].flatten()
            out_quant = sess_quant.run(None, {in_name: tensor})[0].flatten()

            # Cosine similarity
            norm_fp32 = np.linalg.norm(out_fp32)
            norm_quant = np.linalg.norm(out_quant)
            if norm_fp32 > 0 and norm_quant > 0:
                sim = float(np.dot(out_fp32, out_quant) / (norm_fp32 * norm_quant))
                cosine_sims.append(sim)

            # MSE & Max error
            diff = out_fp32 - out_quant
            mses.append(float(np.mean(diff**2)))
            max_diffs.append(float(np.max(np.abs(diff))))
        except Exception:  # noqa: S112
            continue

    if not cosine_sims:
        return {"status": "FAILED", "reason": "Error during session inference"}

    avg_sim = round(float(np.mean(cosine_sims)), 5)
    avg_mse = round(float(np.mean(mses)), 6)
    max_err = round(float(np.max(max_diffs)), 5)

    return {
        "status": "EVALUATED",
        "samples_evaluated": len(cosine_sims),
        "mean_cosine_similarity": avg_sim,
        "mean_squared_error": avg_mse,
        "max_absolute_error": max_err,
        "fidelity_status": "EXCELLENT" if avg_sim >= 0.99 else "ACCEPTABLE",
    }


def quantize_model(
    model_input: Path,
    model_output: Path,
    precision: str = "int8",
    calibration_dir: Path | None = None,
    imgsz: int = 640,
    max_calibration_samples: int = 50,
) -> dict[str, Any]:
    """Quantize an ONNX model to INT8 or FP16.

    Args:
        model_input: Input FP32 ONNX model path.
        model_output: Target quantized ONNX model path.
        precision: Target precision ('int8' or 'fp16').
        calibration_dir: Directory of real road images for static calibration.
        imgsz: Model input image resolution.
        max_calibration_samples: Maximum images to calibrate on.

    Returns:
        Quantization summary dictionary.
    """
    if not model_input.exists():
        raise FileNotFoundError(f"Input model not found: {model_input}")

    model_output.parent.mkdir(parents=True, exist_ok=True)
    input_size_bytes = model_input.stat().st_size
    input_size_mb = round(input_size_bytes / (1024 * 1024), 2)

    quant_method = "dynamic"
    if precision == "int8":
        if calibration_dir and calibration_dir.exists():
            calib_reader = RoadCalibrationDataReader(
                image_dir=calibration_dir,
                imgsz=imgsz,
                max_samples=max_calibration_samples,
            )
            if len(calib_reader.enum_data) > 0:
                quantize_static(
                    model_input=str(model_input),
                    model_output=str(model_output),
                    calibration_data_reader=calib_reader,
                    quant_format=QuantFormat.QDQ,
                    activation_type=QuantType.QUInt8,
                    weight_type=QuantType.QInt8,
                )
                quant_method = "static_calibrated"
            else:
                quantize_dynamic(
                    model_input=str(model_input),
                    model_output=str(model_output),
                    weight_type=QuantType.QInt8,
                )
        else:
            quantize_dynamic(
                model_input=str(model_input),
                model_output=str(model_output),
                weight_type=QuantType.QInt8,
            )
    elif precision == "fp16":
        try:
            from onnxconverter_common import float16  # noqa: PLC0415

            onnx_model = onnx.load(str(model_input))
            fp16_model = float16.convert_float_to_float16(onnx_model)
            onnx.save(fp16_model, str(model_output))
            quant_method = "float16_converted"
        except ImportError as e:
            msg = "onnxconverter-common required for fp16 conversion."
            raise ImportError(msg) from e
    else:
        raise ValueError(f"Unsupported precision: {precision}. Use 'int8' or 'fp16'.")

    output_size_bytes = model_output.stat().st_size
    output_size_mb = round(output_size_bytes / (1024 * 1024), 2)
    compression_ratio = (
        round((1.0 - (output_size_bytes / input_size_bytes)) * 100, 2)
        if input_size_bytes > 0
        else 0.0
    )

    accuracy_drift: dict[str, Any] = {}
    if calibration_dir and calibration_dir.exists() and model_output.exists():
        accuracy_drift = evaluate_quantization_drift(
            fp32_model_path=model_input,
            quant_model_path=model_output,
            calibration_dir=calibration_dir,
            imgsz=imgsz,
            max_samples=max_calibration_samples,
        )

    summary = {
        "timestamp_utc": datetime.now(UTC).isoformat(),
        "input_model": str(model_input),
        "quantized_model": str(model_output),
        "precision": precision,
        "quantization_method": quant_method,
        "input_size_mb": input_size_mb,
        "quantized_size_mb": output_size_mb,
        "compression_percentage": compression_ratio,
        "sha256": compute_file_hash(model_output),
        "accuracy_drift": accuracy_drift,
    }

    report_path = model_output.parent / f"quantization_{precision}_report.json"
    with report_path.open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    return summary


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Quantize ScamRoad ONNX models.")
    parser.add_argument("--model", type=Path, required=True, help="Input ONNX model.")
    parser.add_argument(
        "--output",
        type=Path,
        help="Output quantized ONNX path (defaults to <name>_<precision>.onnx).",
    )
    parser.add_argument(
        "--precision",
        choices=["int8", "fp16"],
        default="int8",
        help="Target precision.",
    )
    parser.add_argument(
        "--calibration-dir",
        type=Path,
        help="Directory with real calibration images.",
    )
    parser.add_argument(
        "--max-calibration-samples",
        type=int,
        default=50,
        help="Maximum images for calibration.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    """Entry-point for quantize CLI."""
    args = parse_args(argv)
    output_path = (
        args.output
        if args.output
        else args.model.parent / f"{args.model.stem}_{args.precision}.onnx"
    )

    print(f"Quantizing {args.model} to {args.precision} -> {output_path}...")
    summary = quantize_model(
        model_input=args.model,
        model_output=output_path,
        precision=args.precision,
        calibration_dir=args.calibration_dir,
        max_calibration_samples=args.max_calibration_samples,
    )
    print(
        f"Quantization complete: {summary['quantized_size_mb']} MB "
        f"({summary['compression_percentage']}% smaller than FP32)"
    )
    if summary.get("accuracy_drift"):
        print(f"Accuracy drift evaluation: {summary['accuracy_drift']}")


if __name__ == "__main__":
    main()
