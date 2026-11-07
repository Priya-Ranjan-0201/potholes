import { GeoCoordinate } from "../api/types";

export interface KalmanState {
  lat: number;
  lng: number;
  variance: number;
}

/**
 * High-precision GPS service for ScamRoad Mobile:
 * - Accuracy threshold gating (must be <= 15m for automatic outbox sync).
 * - Kalman filter smoothing on continuous coordinate streams.
 */
export class GeolocationManager {
  private lastKalman: KalmanState | null = null;
  private readonly processNoise: number = 0.00001; // Process variance Q
  private readonly measurementNoiseBase: number = 0.0001; // Measurement variance R

  /**
   * Evaluates if a GPS reading meets the ScamRoad spatial quality threshold (< 15 meters).
   */
  public isAccurate(accuracyM: number, thresholdM: number = 15.0): boolean {
    return accuracyM > 0 && accuracyM <= thresholdM;
  }

  /**
   * Applies 1D/2D Kalman filter update to incoming raw GPS coordinates.
   */
  public updateKalman(rawLat: number, rawLng: number, rawAccuracyM: number): { lat: number; lng: number } {
    if (!this.lastKalman) {
      this.lastKalman = {
        lat: rawLat,
        lng: rawLng,
        variance: rawAccuracyM * rawAccuracyM,
      };
      return { lat: rawLat, lng: rawLng };
    }

    // Time update (predict)
    const pPredicted = this.lastKalman.variance + this.processNoise;

    // Measurement update
    const rMeasurement = Math.max(rawAccuracyM * rawAccuracyM, this.measurementNoiseBase);
    const kalmanGain = pPredicted / (pPredicted + rMeasurement);

    const latFiltered = this.lastKalman.lat + kalmanGain * (rawLat - this.lastKalman.lat);
    const lngFiltered = this.lastKalman.lng + kalmanGain * (rawLng - this.lastKalman.lng);
    const pUpdated = (1 - kalmanGain) * pPredicted;

    this.lastKalman = {
      lat: latFiltered,
      lng: lngFiltered,
      variance: pUpdated,
    };

    return { lat: latFiltered, lng: lngFiltered };
  }

  /**
   * Creates a calibrated GeoCoordinate snapshot.
   */
  public createCoordinate(
    lat: number,
    lng: number,
    accuracyM: number,
    speedMps?: number,
    headingDeg?: number
  ): GeoCoordinate {
    const smoothed = this.updateKalman(lat, lng, accuracyM);
    return {
      latitude: Number(smoothed.lat.toFixed(7)),
      longitude: Number(smoothed.lng.toFixed(7)),
      accuracy_m: Number(accuracyM.toFixed(1)),
      speed_mps: speedMps !== undefined ? Number(speedMps.toFixed(1)) : undefined,
      heading_deg: headingDeg !== undefined ? Number(headingDeg.toFixed(1)) : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  public reset(): void {
    this.lastKalman = null;
  }
}

export const locationService = new GeolocationManager();

