import { describe, it, expect, beforeEach } from "vitest";
import { OfflineOutboxService } from "../services/outbox";
import { DefectObservationPayload } from "../api/types";

describe("Offline Outbox SQLite WAL Queue", () => {
  let outbox: OfflineOutboxService;

  const samplePayload: DefectObservationPayload = {
    track_id: "trk-001",
    class_code: "POTHOLE",
    confidence: 0.92,
    bounding_box: {
      x_min: 100,
      y_min: 200,
      x_max: 300,
      y_max: 400,
      confidence: 0.92,
      class_code: "POTHOLE",
    },
    relative_area_pct: 4.8,
    location: {
      latitude: 30.900965,
      longitude: 75.857277,
      accuracy_m: 3.5,
      timestamp: new Date().toISOString(),
    },
    is_privacy_blurred: true,
    captured_at: new Date().toISOString(),
  };

  beforeEach(() => {
    outbox = new OfflineOutboxService();
    outbox.reset();
  });

  it("enqueues defect observations with pending status", () => {
    const item = outbox.enqueue(samplePayload, "normal");
    expect(item.id).toMatch(/^outbox-/);
    expect(item.status).toBe("pending");
    expect(item.retry_count).toBe(0);

    const stats = outbox.getStats();
    expect(stats.pendingCount).toBe(1);
    expect(stats.deliveredCount).toBe(0);
  });

  it("prioritizes high priority observations over normal observations", () => {
    outbox.enqueue({ ...samplePayload, track_id: "norm-1" }, "normal");
    outbox.enqueue({ ...samplePayload, track_id: "high-1" }, "high");

    const batch = outbox.getPendingBatch(5);
    expect(batch.length).toBe(2);
    expect(batch[0].priority).toBe("high");
    expect(batch[0].payload.track_id).toBe("high-1");
  });

  it("manages lifecycle status transitions: pending -> uploading -> delivered", () => {
    const item = outbox.enqueue(samplePayload, "normal");
    expect(item.status).toBe("pending");

    outbox.markUploading([item.id]);
    expect(outbox.getStats().uploadingCount).toBe(1);

    outbox.markDelivered([item.id]);
    expect(outbox.getStats().deliveredCount).toBe(1);
    expect(outbox.getStats().uploadingCount).toBe(0);
  });

  it("increments retry count on failure and records error", () => {
    const item = outbox.enqueue(samplePayload, "normal");
    outbox.markFailed([item.id], "Network timeout");

    const updated = outbox.getAllItems()[0];
    expect(updated.status).toBe("failed");
    expect(updated.retry_count).toBe(1);
    expect(updated.last_error).toBe("Network timeout");
  });
});

