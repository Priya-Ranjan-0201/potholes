import { describe, it, expect, beforeEach } from "vitest";
import { GeolocationManager } from "../services/location";

describe("Mobile Geolocation & Kalman Filtering", () => {
  let geo: GeolocationManager;

  beforeEach(() => {
    geo = new GeolocationManager();
  });

  it("enforces accuracy threshold (<= 15.0m threshold)", () => {
    expect(geo.isAccurate(4.2)).toBe(true);
    expect(geo.isAccurate(14.9)).toBe(true);
    expect(geo.isAccurate(15.0)).toBe(true);
    expect(geo.isAccurate(15.1)).toBe(false);
    expect(geo.isAccurate(55.0)).toBe(false);
    expect(geo.isAccurate(0)).toBe(false);
    expect(geo.isAccurate(-5)).toBe(false);
  });

  it("smooths consecutive GPS coordinates using Kalman filter updates", () => {
    // Initial coordinate
    const c1 = geo.updateKalman(30.900965, 75.857277, 4.0);
    expect(c1.lat).toBeCloseTo(30.900965, 5);
    expect(c1.lng).toBeCloseTo(75.857277, 5);

    // Noisy coordinate jump with high variance
    const c2 = geo.updateKalman(30.901500, 75.858000, 20.0);
    // Kalman filter should attenuate the jump
    expect(c2.lat).toBeLessThan(30.901500);
    expect(c2.lat).toBeGreaterThan(30.900965);
  });

  it("generates ISO-8601 timestamped GeoCoordinate objects", () => {
    const snapshot = geo.createCoordinate(30.900965, 75.857277, 3.5, 12.5, 90.0);
    expect(snapshot.latitude).toBeCloseTo(30.900965, 5);
    expect(snapshot.accuracy_m).toBe(3.5);
    expect(snapshot.speed_mps).toBe(12.5);
    expect(snapshot.heading_deg).toBe(90.0);
    expect(snapshot.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

