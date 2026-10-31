import React, { useState, useEffect } from "react";
import { LanguageCode } from "./api/types";
import { setLanguage, getLanguage } from "./i18n";
import { outboxService } from "./services/outbox";
import { Header } from "./components/Header";
import { SafetyBanner } from "./components/SafetyBanner";
import { CitizenScreen } from "./screens/CitizenScreen";
import { DriveScreen } from "./screens/DriveScreen";
import { OutboxScreen } from "./screens/OutboxScreen";
import { ChecklistScreen } from "./screens/ChecklistScreen";

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<"citizen" | "drive" | "outbox" | "checklist">("citizen");
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageCode>(getLanguage());
  const [pendingOutboxCount, setPendingOutboxCount] = useState<number>(0);

  useEffect(() => {
    // Poll or sync outbox counter
    const updateCount = () => {
      const stats = outboxService.getStats();
      setPendingOutboxCount(stats.pendingCount);
    };

    updateCount();
    const interval = setInterval(updateCount, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLanguageChange = (lang: LanguageCode) => {
    setLanguage(lang);
    setCurrentLanguageState(lang);
  };

  return (
    <div style={{
      maxWidth: "480px",
      margin: "0 auto",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      boxShadow: "0 0 20px rgba(0,0,0,0.15)",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      {/* App Header */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleLanguageChange}
        pendingOutboxCount={pendingOutboxCount}
      />

      {/* Safety Banner (Rule R16) */}
      <SafetyBanner />

      {/* Main Screen Content */}
      <main style={{ flex: 1, overflowY: "auto" }}>
        {currentMode === "citizen" && <CitizenScreen />}
        {currentMode === "drive" && <DriveScreen />}
        {currentMode === "outbox" && <OutboxScreen />}
        {currentMode === "checklist" && <ChecklistScreen />}
      </main>
    </div>
  );
};

export default App;

