import React from "react";
import { LanguageCode } from "../api/types";
import { GlobeIcon, ShieldIcon } from "./Icons";
import { t } from "../i18n";

interface HeaderProps {
  currentMode: "citizen" | "drive" | "outbox" | "checklist";
  onSelectMode: (mode: "citizen" | "drive" | "outbox" | "checklist") => void;
  currentLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  pendingOutboxCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onSelectMode,
  currentLanguage,
  onSelectLanguage,
  pendingOutboxCount,
}) => {
  return (
    <header style={{
      backgroundColor: "#064e3b",
      color: "#ecfdf5",
      borderBottom: "1px solid #047857",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: "10px"
    }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            backgroundColor: "#059669",
            borderRadius: "6px",
            padding: "4px",
            display: "flex",
            alignItems: "center"
          }}>
            <ShieldIcon size={20} color="#ffffff" />
          </div>
          <div>
            <span style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "0.5px" }}>
              {t("app_name")}
            </span>
            <span style={{
              marginLeft: "6px",
              backgroundColor: "#022c22",
              color: "#34d399",
              fontSize: "10px",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "600"
            }}>
              OPPO K13
            </span>
          </div>
        </div>

        {/* Language Selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <GlobeIcon size={16} color="#a7f3d0" />
          {(["en", "hi", "pa"] as LanguageCode[]).map((lang) => (
            <button
              key={lang}
              onClick={() => onSelectLanguage(lang)}
              style={{
                backgroundColor: currentLanguage === lang ? "#059669" : "transparent",
                color: currentLanguage === lang ? "#ffffff" : "#a7f3d0",
                border: currentLanguage === lang ? "1px solid #34d399" : "1px solid transparent",
                borderRadius: "4px",
                padding: "2px 6px",
                fontSize: "11px",
                fontWeight: "600",
                cursor: "pointer",
                textTransform: "uppercase"
              }}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <nav style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: "6px",
        backgroundColor: "#022c22",
        padding: "4px",
        borderRadius: "8px"
      }}>
        <button
          onClick={() => onSelectMode("citizen")}
          style={{
            backgroundColor: currentMode === "citizen" ? "#059669" : "transparent",
            color: currentMode === "citizen" ? "#ffffff" : "#6ee7b7",
            border: "none",
            borderRadius: "6px",
            padding: "6px 2px",
            fontSize: "11px",
            fontWeight: currentMode === "citizen" ? "700" : "500",
            cursor: "pointer",
            textAlign: "center"
          }}
        >
          {t("mode_citizen")}
        </button>

        <button
          onClick={() => onSelectMode("drive")}
          style={{
            backgroundColor: currentMode === "drive" ? "#059669" : "transparent",
            color: currentMode === "drive" ? "#ffffff" : "#6ee7b7",
            border: "none",
            borderRadius: "6px",
            padding: "6px 2px",
            fontSize: "11px",
            fontWeight: currentMode === "drive" ? "700" : "500",
            cursor: "pointer",
            textAlign: "center"
          }}
        >
          {t("mode_drive")}
        </button>

        <button
          onClick={() => onSelectMode("outbox")}
          style={{
            backgroundColor: currentMode === "outbox" ? "#059669" : "transparent",
            color: currentMode === "outbox" ? "#ffffff" : "#6ee7b7",
            border: "none",
            borderRadius: "6px",
            padding: "6px 2px",
            fontSize: "11px",
            fontWeight: currentMode === "outbox" ? "700" : "500",
            cursor: "pointer",
            textAlign: "center",
            position: "relative"
          }}
        >
          {t("mode_outbox")}
          {pendingOutboxCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-2px",
              right: "2px",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontSize: "9px",
              borderRadius: "10px",
              padding: "1px 4px",
              fontWeight: "700"
            }}>
              {pendingOutboxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectMode("checklist")}
          style={{
            backgroundColor: currentMode === "checklist" ? "#059669" : "transparent",
            color: currentMode === "checklist" ? "#ffffff" : "#6ee7b7",
            border: "none",
            borderRadius: "6px",
            padding: "6px 2px",
            fontSize: "11px",
            fontWeight: currentMode === "checklist" ? "700" : "500",
            cursor: "pointer",
            textAlign: "center"
          }}
        >
          {t("mode_checklist")}
        </button>
      </nav>
    </header>
  );
};

