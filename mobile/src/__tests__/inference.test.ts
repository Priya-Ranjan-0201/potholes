import { describe, it, expect, beforeEach } from "vitest";
import { NativeEdgeInferenceEngine, ModelNotReadyError } from "../services/inference";

describe("Native Edge Inference Engine & Quality Gate", () => {
  let engine: NativeEdgeInferenceEngine;

  beforeEach(() => {
    engine = new NativeEdgeInferenceEngine();
  });

  it("strictly raises ModelNotReadyError when model weights are not loaded", () => {
    expect(() => {
      engine.predict(640, 480);
    }).toThrow(ModelNotReadyError);

    expect(engine.getModelStatus().loaded).toBe(false);
  });

  it("evaluates frame brightness and blur quality gates", () => {
    // Underexposed
    const dark = engine.evaluateQualityGate(20, 100);
    expect(dark.pass).toBe(false);
    expect(dark.reason).toContain("underexposed");

    // Overexposed
    const glare = engine.evaluateQualityGate(245, 100);
    expect(glare.pass).toBe(false);
    expect(glare.reason).toContain("overexposed");

    // Motion blurred
    const blurred = engine.evaluateQualityGate(120, 35);
    expect(blurred.pass).toBe(false);
    expect(blurred.reason).toContain("blurred");

    // Clear frame
    const good = engine.evaluateQualityGate(130, 120);
    expect(good.pass).toBe(true);
  });

  it("calculates relative defect area percentage without fabricating depth", () => {
    engine.loadModel("mock_model.onnx", "onnxruntime-mobile");
    expect(engine.getModelStatus().loaded).toBe(true);

    const result = engine.predict(640, 480, { simulateDetections: true });
    expect(result.boxes.length).toBeGreaterThan(0);
    expect(result.roadCoveragePct).toBeGreaterThan(0);
    expect(result.roadCoveragePct).toBeLessThanOrEqual(100);
    expect(result.modelEngine).toBe("onnxruntime-mobile");
  });
});

