import { OutboxItem, DefectObservationPayload } from "../api/types";

export interface OutboxStats {
  pendingCount: number;
  uploadingCount: number;
  deliveredCount: number;
  failedCount: number;
  totalSizeEstimatedKb: number;
}

export class OfflineOutboxService {
  private queue: OutboxItem[] = [];
  private readonly maxCapacity: number = 5000;
  private readonly maxRetries: number = 5;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof localStorage !== "undefined") {
      try {
        const saved = localStorage.getItem("scamroad_mobile_outbox");
        if (saved) {
          this.queue = JSON.parse(saved);
        }
      } catch {
        this.queue = [];
      }
    }
  }

  private persistToStorage(): void {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("scamroad_mobile_outbox", JSON.stringify(this.queue));
      } catch {
        // Handle storage quota
      }
    }
  }

  /**
   * Enqueues a confirmed defect observation for offline storage.
   */
  public enqueue(
    payload: DefectObservationPayload,
    priority: "high" | "normal" = "normal",
    imageBase64?: string
  ): OutboxItem {
    // Evict oldest if capacity exceeded
    if (this.queue.length >= this.maxCapacity) {
      const evictIdx = this.queue.findIndex((item) => item.priority === "normal" && item.status !== "uploading");
      if (evictIdx !== -1) {
        this.queue.splice(evictIdx, 1);
      }
    }

    const item: OutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      priority,
      status: "pending",
      retry_count: 0,
      payload,
      image_base64: imageBase64,
    };

    this.queue.push(item);
    this.persistToStorage();
    return item;
  }

  /**
   * Returns items ready for sync (pending or failed with retries left), sorted by priority then timestamp.
   */
  public getPendingBatch(batchSize: number = 20): OutboxItem[] {
    return this.queue
      .filter((item) => item.status === "pending" || (item.status === "failed" && item.retry_count < this.maxRetries))
      .sort((a, b) => {
        if (a.priority === "high" && b.priority !== "high") return -1;
        if (b.priority === "high" && a.priority !== "high") return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, batchSize);
  }

  public markUploading(ids: string[]): void {
    const idSet = new Set(ids);
    for (const item of this.queue) {
      if (idSet.has(item.id)) {
        item.status = "uploading";
      }
    }
    this.persistToStorage();
  }

  public markDelivered(ids: string[]): void {
    const idSet = new Set(ids);
    for (const item of this.queue) {
      if (idSet.has(item.id)) {
        item.status = "delivered";
      }
    }
    this.persistToStorage();
  }

  public markFailed(ids: string[], errorMessage: string): void {
    const idSet = new Set(ids);
    for (const item of this.queue) {
      if (idSet.has(item.id)) {
        item.status = "failed";
        item.retry_count += 1;
        item.last_error = errorMessage;
      }
    }
    this.persistToStorage();
  }

  public getStats(): OutboxStats {
    let pending = 0;
    let uploading = 0;
    let delivered = 0;
    let failed = 0;

    for (const item of this.queue) {
      if (item.status === "pending") pending++;
      else if (item.status === "uploading") uploading++;
      else if (item.status === "delivered") delivered++;
      else if (item.status === "failed") failed++;
    }

    const totalSizeEstimatedKb = Math.round(JSON.stringify(this.queue).length / 1024);

    return {
      pendingCount: pending,
      uploadingCount: uploading,
      deliveredCount: delivered,
      failedCount: failed,
      totalSizeEstimatedKb,
    };
  }

  public getAllItems(): OutboxItem[] {
    return [...this.queue];
  }

  public clearDelivered(): void {
    this.queue = this.queue.filter((item) => item.status !== "delivered");
    this.persistToStorage();
  }

  public reset(): void {
    this.queue = [];
    this.persistToStorage();
  }
}

export const outboxService = new OfflineOutboxService();

