import React, { useState, useEffect } from "react";
import { OutboxItem } from "../api/types";
import { outboxService, OutboxStats } from "../services/outbox";
import { apiClient } from "../api/client";
import { t, getDamageClassName } from "../i18n";
import { RefreshCwIcon, ShieldIcon, CheckCircleIcon } from "../components/Icons";

export const OutboxScreen: React.FC = () => {
  const [items, setItems] = useState<OutboxItem[]>([]);
  const [stats, setStats] = useState<OutboxStats>({
    pendingCount: 0,
    uploadingCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    totalSizeEstimatedKb: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const refreshOutbox = () => {
    setItems(outboxService.getAllItems());
    setStats(outboxService.getStats());
  };

  useEffect(() => {
    refreshOutbox();
  }, []);

  const handleSyncNow = async () => {
    const pending = outboxService.getPendingBatch(30);
    if (pending.length === 0) return;

    setIsSyncing(true);
    setSyncMessage(t("outbox_syncing"));
    outboxService.markUploading(pending.map((p) => p.id));
    refreshOutbox();

    try {
      const result = await apiClient.syncBatch("OPPO-K13-MOBILE-01", pending);

      if (result.syncedIds.length > 0) {
        outboxService.markDelivered(result.syncedIds);
        setSyncMessage(`Successfully synced ${result.syncedIds.length} observations to cloud!`);
      } else if (result.failedIds.length > 0) {
        outboxService.markFailed(result.failedIds, result.error || "Sync error");
        setSyncMessage(`Sync failed: ${result.error}`);
      }
    } finally {
      setIsSyncing(false);
      refreshOutbox();
      setTimeout(() => setSyncMessage(null), 4000);
    }
  };

  return (
    <div style={{ padding: "14px", maxWidth: "600px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "14px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>
          {t("outbox_title")}
        </h2>
        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
          {t("outbox_desc")}
        </p>
      </div>

      {syncMessage && (
        <div style={{
          backgroundColor: "#ecfdf5",
          border: "1px solid #10b981",
          borderRadius: "8px",
          padding: "10px 14px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#065f46",
          fontSize: "12px",
          fontWeight: "600"
        }}>
          <CheckCircleIcon size={16} color="#10b981" />
          {syncMessage}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", padding: "10px", borderRadius: "8px" }}>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Pending Sync</div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#059669", marginTop: "2px" }}>
            {stats.pendingCount}
          </div>
        </div>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", padding: "10px", borderRadius: "8px" }}>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Synced</div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#3b82f6", marginTop: "2px" }}>
            {stats.deliveredCount}
          </div>
        </div>
        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", padding: "10px", borderRadius: "8px" }}>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Queue Size</div>
          <div style={{ fontSize: "18px", fontWeight: "800", color: "#6b7280", marginTop: "2px" }}>
            {stats.totalSizeEstimatedKb} <span style={{ fontSize: "10px" }}>KB</span>
          </div>
        </div>
      </div>

      {/* Sync Button */}
      <button
        onClick={handleSyncNow}
        disabled={isSyncing || stats.pendingCount === 0}
        style={{
          width: "100%",
          backgroundColor: isSyncing || stats.pendingCount === 0 ? "#9ca3af" : "#059669",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "12px",
          fontSize: "13px",
          fontWeight: "700",
          cursor: isSyncing || stats.pendingCount === 0 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "16px"
        }}
      >
        <RefreshCwIcon size={16} color="#ffffff" className={isSyncing ? "spin" : ""} />
        {isSyncing ? t("outbox_syncing") : t("outbox_sync_btn")}
      </button>

      {/* Outbox Items List */}
      <div>
        <h3 style={{ fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>
          Queue Items ({items.length})
        </h3>

        {items.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "32px 14px",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px dashed #d1d5db",
            color: "#6b7280",
            fontSize: "12px"
          }}>
            {t("outbox_empty")}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                  padding: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px", color: "#111827" }}>
                      {getDamageClassName(item.payload.class_code)}
                    </span>
                    <span style={{
                      backgroundColor: item.priority === "high" ? "#fee2e2" : "#f3f4f6",
                      color: item.priority === "high" ? "#b91c1c" : "#4b5563",
                      fontSize: "9px",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      fontWeight: "700",
                      textTransform: "uppercase"
                    }}>
                      {item.priority}
                    </span>
                  </div>

                  <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                    {item.payload.location.latitude.toFixed(5)}, {item.payload.location.longitude.toFixed(5)}
                    {" • "}
                    Area: {item.payload.relative_area_pct}%
                  </div>

                  {item.payload.is_privacy_blurred && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      <ShieldIcon size={12} color="#059669" />
                      <span style={{ fontSize: "10px", color: "#065f46", fontWeight: "600" }}>
                        {t("outbox_privacy_blurred")}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span style={{
                    backgroundColor: item.status === "delivered" ? "#d1fae5" : item.status === "uploading" ? "#dbeafe" : "#fef3c7",
                    color: item.status === "delivered" ? "#065f46" : item.status === "uploading" ? "#1e40af" : "#92400e",
                    fontSize: "10px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "4px"
                  }}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

