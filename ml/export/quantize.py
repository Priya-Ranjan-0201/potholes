"""INT8 calibration and post-training quantization for edge deployment.

Re-exports quantize_model, RoadCalibrationDataReader, and evaluate_quantization_drift
under ml.export for unified export and quantization workflows.
"""

from __future__ import annotations

from ml.quantization.quantize import (
    RoadCalibrationDataReader,
    compute_file_hash,
    evaluate_quantization_drift,
    main,
    parse_args,
    quantize_model,
)

__all__ = [
    "RoadCalibrationDataReader",
    "compute_file_hash",
    "evaluate_quantization_drift",
    "main",
    "parse_args",
    "quantize_model",
]

if __name__ == "__main__":
    main()

