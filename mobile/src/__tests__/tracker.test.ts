import { describe, it, expect, beforeEach } from "vitest";
import { MobileDefectTracker } from "../services/tracker";
import { BoundingBox } from "../api/types";

describe("Mobile Defect Temporal Tracker", () => {
  let tracker: MobileDefectTracker;

  beforeEach(() => {
    tracker = new MobileDefectTracker();
  });

  it("accurately computes Intersection over Union (IoU)", () => {
    const boxA: BoundingBox = {
      x_min: 0,
      y_min: 0,
      x_max: 100,
      y_max: 100,
      confidence: 0.9,
      class_code: "POTHOLE",
    };

    const boxB: BoundingBox = {
      x_min: 50,
      y_min: 0,
      x_max: 150,
      y_max: 100,
      confidence: 0.9,
      class_code: "POTHOLE",
    };

    // Intersection: 50 * 100 = 5000
    // Union: 10000 + 10000 - 5000 = 15000
    // IoU: 5000 / 15000 = 0.333...
    const iou = tracker.computeIoU(boxA, boxB);
    expect(iou).toBeCloseTo(0.3333, 3);
  });

  it("requires minimum 2 consecutive hits to confirm defect before outbox dispatch", () => {
    const box: BoundingBox = {
      x_min: 100,
      y_min: 200,
      x_max: 200,
      y_max: 300,
      confidence: 0.85,
      class_code: "POTHOLE",
    };

    // Frame 1: Initial sighting (hits = 1, not confirmed yet)
    const confirmedF1 = tracker.update([box]);
    expect(confirmedF1.length).toBe(0);

    const activeTracks = tracker.getActiveTracks();
    expect(activeTracks.length).toBe(1);
    expect(activeTracks[0].hits).toBe(1);
    expect(activeTracks[0].confirmed).toBe(false);

    // Frame 2: Overlapping sighting (hits = 2 -> confirmed!)
    const boxF2: BoundingBox = {
      x_min: 105,
      y_min: 205,
      x_max: 205,
      y_max: 305,
      confidence: 0.89,
      class_code: "POTHOLE",
    };

    const confirmedF2 = tracker.update([boxF2]);
    expect(confirmedF2.length).toBe(1);
    expect(confirmedF2[0].confirmed).toBe(true);
    expect(confirmedF2[0].hits).toBe(2);
  });
});

