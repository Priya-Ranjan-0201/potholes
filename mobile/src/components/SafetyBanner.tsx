import React from "react";
import { AlertTriangleIcon } from "./Icons";
import { t } from "../i18n";

export const SafetyBanner: React.FC = () => {
  return (
    <div style={{
      backgroundColor: "#451a03",
      borderLeft: "4px solid #f59e0b",
      padding: "10px 14px",
      margin: "8px 12px",
      borderRadius: "6px",
      display: "flex",
      alignItems: "flex-start",
      gap: "10px"
    }}>
      <AlertTriangleIcon size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
      <div>
        <div style={{ color: "#fef3c7", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {t("safety_notice")}
        </div>
        <div style={{ color: "#fde68a", fontSize: "11px", marginTop: "2px", lineHeight: "1.3" }}>
          {t("safety_detail")}
        </div>
      </div>
    </div>
  );
};

