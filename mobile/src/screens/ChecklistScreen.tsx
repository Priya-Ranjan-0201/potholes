import React, { useState } from "react";
import { RoadChecklistItem } from "../api/types";
import { t } from "../i18n";
import { QrCodeIcon, CheckCircleIcon, ListCheckIcon } from "../components/Icons";

const INITIAL_CHECKLIST: RoadChecklistItem[] = [
  { id: "c1", category: "surface", title_key: "item_surface", completed: false },
  { id: "c2", category: "drainage", title_key: "item_drainage", completed: false },
  { id: "c3", category: "shoulder", title_key: "item_shoulder", completed: false },
  { id: "c4", category: "marking", title_key: "item_markings", completed: false },
];

export const ChecklistScreen: React.FC = () => {
  const [items, setItems] = useState<RoadChecklistItem[]>(INITIAL_CHECKLIST);
  const [scannedSegment, setScannedSegment] = useState<string | null>("RD-SEG-PB-LUDH-401");
  const [submitted, setSubmitted] = useState(false);

  const handleToggleItem = (id: string) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleScanQR = () => {
    // QR Code scanner simulation
    setScannedSegment(`RD-SEG-PB-LUDH-${Math.floor(100 + Math.random() * 900)}`);
  };

  const handleSubmitAudit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div style={{ padding: "14px", maxWidth: "600px", margin: "0 auto" }}>
      {/* Title */}
      <div style={{ marginBottom: "14px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>
          {t("checklist_title")}
        </h2>
        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
          Digital road condition and maintenance compliance audit form.
        </p>
      </div>

      {submitted && (
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
          Field inspection checklist verified and logged to municipal ledger!
        </div>
      )}

      {/* QR Segment Identification Card */}
      <div style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "14px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ backgroundColor: "#f3f4f6", padding: "8px", borderRadius: "6px" }}>
            <QrCodeIcon size={24} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>{t("segment_scanned")}</div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#111827", fontFamily: "monospace" }}>
              {scannedSegment}
            </div>
          </div>
        </div>
        <button
          onClick={handleScanQR}
          style={{
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            padding: "6px 10px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          {t("scan_qr_segment")}
        </button>
      </div>

      {/* Checklist Items */}
      <div style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "14px",
        marginBottom: "16px"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
          paddingBottom: "8px",
          borderBottom: "1px solid #f3f4f6"
        }}>
          <span style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>
            {t("inspection_items")}
          </span>
          <span style={{
            backgroundColor: completedCount === items.length ? "#d1fae5" : "#fef3c7",
            color: completedCount === items.length ? "#065f46" : "#92400e",
            fontSize: "11px",
            fontWeight: "700",
            padding: "2px 8px",
            borderRadius: "4px"
          }}>
            {completedCount} / {items.length} Done
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleItem(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px",
                borderRadius: "6px",
                backgroundColor: item.completed ? "#f0fdf4" : "#f9fafb",
                border: item.completed ? "1px solid #86efac" : "1px solid #e5e7eb",
                cursor: "pointer"
              }}
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => {}} // Handled by div onClick
                style={{ width: "16px", height: "16px", cursor: "pointer" }}
              />
              <span style={{
                fontSize: "12px",
                color: item.completed ? "#065f46" : "#374151",
                fontWeight: item.completed ? "600" : "500",
                textDecoration: item.completed ? "none" : "none"
              }}>
                {t(item.title_key as any)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitAudit}
        disabled={completedCount === 0}
        style={{
          width: "100%",
          backgroundColor: completedCount === 0 ? "#9ca3af" : "#059669",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "12px",
          fontSize: "13px",
          fontWeight: "700",
          cursor: completedCount === 0 ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}
      >
        <ListCheckIcon size={16} color="#ffffff" />
        {t("submit_inspection")}
      </button>
    </div>
  );
};

