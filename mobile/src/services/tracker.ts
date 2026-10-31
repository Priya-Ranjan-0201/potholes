import { BoundingBox } from "../api/types";

export interface ActiveTrack {
  trackId: string;
  box: BoundingBox;
  hits: number;
  misses: number;
  confirmed: boolean;
  firstSeenMs: number;
  lastSeenMs: number;
}

export class MobileDefectTracker {
  private tracks: Map<string, ActiveTrack> = new Map();
  private nextTrackId: number = 1;
  private readonly iouThreshold: number = 0.35;
  private readonly minHitsToConfirm: number = 2;
  private readonly maxMisses: number = 3;

  public computeIoU(b1: BoundingBox, b2: BoundingBox): number {
    const x1 = Math.max(b1.x_min, b2.x_min);
    const y1 = Math.max(b1.y_min, b2.y_min);
    const x2 = Math.min(b1.x_max, b2.x_max);
    const y2 = Math.min(b1.y_max, b2.y_max);

    const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const b1Area = Math.max(0, b1.x_max - b1.x_min) * Math.max(0, b1.y_max - b1.y_min);
    const b2Area = Math.max(0, b2.x_max - b2.x_min) * Math.max(0, b2.y_max - b2.y_min);
    const unionArea = b1Area + b2Area - intersectionArea;

    return unionArea > 0 ? intersectionArea / unionArea : 0;
  }

  /**
   * Updates tracks with newly detected bounding boxes.
   * Returns newly confirmed tracks ready for Outbox staging.
   */
  public update(detections: BoundingBox[]): ActiveTrack[] {
    const now = Date.now();
    const unmatchedDetections = new Set(detections);
    const newlyConfirmed: ActiveTrack[] = [];

    // Match existing tracks with best IoU
    for (const [id, track] of this.tracks.entries()) {
      let bestIoU = 0;
      let bestMatch: BoundingBox | null = null;

      for (const det of unmatchedDetections) {
        if (det.class_code === track.box.class_code) {
          const iou = this.computeIoU(track.box, det);
          if (iou > bestIoU) {
            bestIoU = iou;
            bestMatch = det;
          }
        }
      }

      if (bestMatch && bestIoU >= this.iouThreshold) {
        track.box = bestMatch;
        track.hits += 1;
        track.misses = 0;
        track.lastSeenMs = now;
        unmatchedDetections.delete(bestMatch);

        if (track.hits >= this.minHitsToConfirm && !track.confirmed) {
          track.confirmed = true;
          newlyConfirmed.push(track);
        }
      } else {
        track.misses += 1;
      }

      // Evict dead tracks
      if (track.misses > this.maxMisses) {
        this.tracks.delete(id);
      }
    }

    // Initialize new tracks for remaining detections
    for (const det of unmatchedDetections) {
      const id = `trk-m-${this.nextTrackId++}`;
      this.tracks.set(id, {
        trackId: id,
        box: det,
        hits: 1,
        misses: 0,
        confirmed: false,
        firstSeenMs: now,
        lastSeenMs: now,
      });
    }

    return newlyConfirmed;
  }

  public getActiveTracks(): ActiveTrack[] {
    return Array.from(this.tracks.values());
  }

  public reset(): void {
    this.tracks.clear();
    this.nextTrackId = 1;
  }
}

export const defectTracker = new MobileDefectTracker();

