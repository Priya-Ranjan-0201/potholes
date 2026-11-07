import React, { useState, useEffect, useRef } from "react";
import { BoundingBox, DefectObservationPayload } from "../api/types";
import { inferenceEngine } from "../services/inference";
import { defectTracker } from "../services/tracker";
import { locationService } from "../services/location";
import { privacyRedactor } from "../services/privacy";
import { outboxService } from "../services/outbox";
import { audioAlertService } from "../services/audio";
import { t } from "../i18n";
import { AlertTriangleIcon, ActivityIcon } from "../components/Icons";

export const DriveScreen: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [fps, setFps] = useState(0);
  const [latencyMs, setLatencyMs] = useState(0);
  const [speedKmh] = useState(38);
  const [detectedCratersCount, setDetectedCratersCount] = useState(0);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [activeBoxes, setActiveBoxes] = useState<BoundingBox[]>([]);

  const frameIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Check initial model state
    const status = inferenceEngine.getModelStatus();
    setModelLoaded(status.loaded);

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
    };
  }, []);

  const handleToggleModelLoad = () => {
    if (modelLoaded) {
      inferenceEngine.unloadModel();
      setModelLoaded(false);
      if (isScanning) handleStopScanning();
    } else {
      inferenceEngine.loadModel("ml/export/weights/scamroad_yolo_nano.onnx", "onnxruntime-mobile");
      setModelLoaded(true);
    }
  };

  const handleStartScanning = () => {
    if (!modelLoaded) return;
    setIsScanning(true);

    frameIntervalRef.current = setInterval(() => {
      try {
        // Run edge inference cycle on 640x480 frame
        const result = inferenceEngine.predict(640, 480, { simulateDetections: Math.random() > 0.4 });
        setLatencyMs(result.inferenceTimeMs);
        setFps(Math.round(1000 / (result.inferenceTimeMs + 40)));
        setActiveBoxes(result.boxes);

        // Update temporal tracker
        const newlyConfirmed = defectTracker.update(result.boxes);

        if (newlyConfirmed.length > 0) {
          // Trigger glanceable visual and audio alert for driver safety
          setActiveAlert(t("drive_hazard_alert"));
          audioAlertService.playHazardChime();
          setTimeout(() => setActiveAlert(null), 2500);

          for (const track of newlyConfirmed) {
            setDetectedCratersCount((prev) => prev + 1);

            // Geotag and privacy blur on-device before enqueuing to outbox
            const location = locationService.createCoordinate(
              30.900965 + Math.random() * 0.002,
              75.857277 + Math.random() * 0.002,
              3.5,
              speedKmh / 3.6
            );

            privacyRedactor.redactMedia("mock_frame_buffer").then((privacy) => {
              const payload: DefectObservationPayload = {
                track_id: track.trackId,
                class_code: track.box.class_code,
                confidence: track.box.confidence,
                bounding_box: track.box,
                relative_area_pct: result.roadCoveragePct,
                location,
                image_sha256: privacy.privacySha256,
                is_privacy_blurred: true,
                captured_at: new Date().toISOString(),
              };

              // Enqueue to offline SQLite WAL outbox
              outboxService.enqueue(payload, "normal");
            });
          }
        }
      } catch (err) {
        console.error("Edge inference error:", err);
      }
    }, 400); // 2.5 Hz simulated inspection sample rate
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    setActiveBoxes([]);
    setFps(0);
    setLatencyMs(0);
    defectTracker.reset();
  };

  return (
    <div style={{ backgroundColor: "#0f172a", minHeight: "100%", color: "#f8fafc", padding: "14px" }}>
      {/* Top Status & Model Toggle */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#1e293b",
        padding: "10px 14px",
        borderRadius: "8px",
        marginBottom: "12px",
        border: "1px solid #334155"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: modelLoaded ? "#10b981" : "#ef4444"
          }} />
          <span style={{ fontSize: "12px", fontWeight: "600" }}>
            {modelLoaded ? t("model_ready") : t("model_not_loaded")}
          </span>
        </div>
        <button
          onClick={handleToggleModelLoad}
          style={{
            backgroundColor: modelLoaded ? "#475569" : "#059669",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "4px 8px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer"
          }}
        >
          {modelLoaded ? "Unload Model" : "Load ONNX Model"}
        </button>
      </div>

      {/* Glanceable Driver Hazard Alert Banner */}
      {activeAlert && (
        <div style={{
          backgroundColor: "#b91c1c",
          border: "2px solid #ef4444",
          borderRadius: "8px",
          padding: "14px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          animation: "pulse 1s infinite"
        }}>
          <AlertTriangleIcon size={28} color="#ffffff" />
          <span style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "1px", color: "#ffffff" }}>
            {activeAlert}
          </span>
        </div>
      )}

      {/* High-Contrast Simulated Viewfinder */}
      <div style={{
        height: "220px",
        backgroundColor: "#020617",
        borderRadius: "10px",
        position: "relative",
        overflow: "hidden",
        border: isScanning ? "2px solid #10b981" : "2px solid #334155",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "14px"
      }}>
        {/* Road Perspective Guide Lines */}
        <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.25 }}>
          <line x1="30%" y1="100%" x2="45%" y2="40%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4" />
          <line x1="70%" y1="100%" x2="55%" y2="40%" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4" />
          <line x1="15%" y1="40%" x2="85%" y2="40%" stroke="#38bdf8" strokeWidth="1" />
        </svg>

        {/* Live Detected Bounding Boxes */}
        {activeBoxes.map((box, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${(box.x_min / 640) * 100}%`,
              top: `${(box.y_min / 480) * 100}%`,
              width: `${((box.x_max - box.x_min) / 640) * 100}%`,
              height: `${((box.y_max - box.y_min) / 480) * 100}%`,
              border: "3px solid #ef4444",
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              borderRadius: "4px",
              boxShadow: "0 0 10px rgba(239, 68, 68, 0.8)"
            }}
          >
            <span style={{
              position: "absolute",
              top: "-18px",
              left: 0,
              backgroundColor: "#ef4444",
              color: "#ffffff",
              fontSize: "10px",
              fontWeight: "800",
              padding: "1px 4px",
              borderRadius: "2px"
            }}>
              POTHOLE 88%
            </span>
          </div>
        ))}

        {!isScanning && (
          <div style={{ textAlign: "center", zIndex: 10 }}>
            <ActivityIcon size={36} color="#64748b" />
            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
              {modelLoaded ? "Press Start to begin hands-free driving inspection" : "Load ONNX model to begin"}
            </div>
          </div>
        )}

        {isScanning && (
          <div style={{
            position: "absolute",
            top: "8px",
            left: "8px",
            backgroundColor: "rgba(0,0,0,0.6)",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#10b981",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981" }} />
            LIVE ROAD SCAN
          </div>
        )}
      </div>

      {/* Driver Telemetry Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{t("drive_fps")}</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#38bdf8", marginTop: "2px" }}>
            {fps} <span style={{ fontSize: "12px", color: "#64748b" }}>FPS</span>
          </div>
        </div>

        <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{t("drive_latency")}</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#38bdf8", marginTop: "2px" }}>
            {latencyMs} <span style={{ fontSize: "12px", color: "#64748b" }}>ms</span>
          </div>
        </div>

        <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{t("drive_speed")}</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#facc15", marginTop: "2px" }}>
            {speedKmh} <span style={{ fontSize: "12px", color: "#64748b" }}>km/h</span>
          </div>
        </div>

        <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "8px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>{t("drive_detected_craters")}</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#ef4444", marginTop: "2px" }}>
            {detectedCratersCount}
          </div>
        </div>
      </div>

      {/* Start / Stop Control Button */}
      <button
        onClick={isScanning ? handleStopScanning : handleStartScanning}
        disabled={!modelLoaded}
        style={{
          width: "100%",
          backgroundColor: !modelLoaded ? "#334155" : isScanning ? "#dc2626" : "#059669",
          color: "#ffffff",
          border: "none",
          borderRadius: "8px",
          padding: "14px",
          fontSize: "15px",
          fontWeight: "800",
          cursor: !modelLoaded ? "not-allowed" : "pointer",
          letterSpacing: "0.5px"
        }}
      >
        {isScanning ? t("drive_stop_scan") : t("drive_start_scan")}
      </button>
    </div>
  );
};
