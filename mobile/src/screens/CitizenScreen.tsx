import React, { useState, useEffect } from "react";
import { DefectClassCode, CitizenComplaintReport, GeoCoordinate } from "../api/types";
import { apiClient } from "../api/client";
import { locationService } from "../api/../services/location";
import { t, getDamageClassName } from "../i18n";
import { CameraIcon, MapPinIcon, SendIcon, ThumbsUpIcon, CheckCircleIcon } from "../components/Icons";

const DAMAGE_CLASSES: DefectClassCode[] = [
  "POTHOLE",
  "CRACK_LONG",
  "CRACK_TRANS",
  "CRACK_ALLIGATOR",
];

export const CitizenScreen: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<DefectClassCode>("POTHOLE");
  const [description, setDescription] = useState("");
  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [location, setLocation] = useState<GeoCoordinate | null>(null);
  const [reports, setReports] = useState<CitizenComplaintReport[]>([]);

  // Initialize GPS snapshot
  useEffect(() => {
    // High-precision GPS simulation for OPPO K13
    const coord = locationService.createCoordinate(30.900965, 75.857277, 4.2);
    setLocation(coord);

    // Fetch existing complaints
    apiClient.getComplaints().then((data) => {
      setReports(data);
    });
  }, []);

  const handleCapturePhoto = () => {
    setPhotoCaptured(true);
    // Refresh GPS coordinate at exact capture moment
    const coord = locationService.createCoordinate(
      30.900965 + (Math.random() - 0.5) * 0.001,
      75.857277 + (Math.random() - 0.5) * 0.001,
      3.8
    );
    setLocation(coord);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) return;

    setIsSubmitting(true);
    setSubmitSuccess(null);

    try {
      const newReport = await apiClient.submitComplaint({
        class_code: selectedClass,
        description: description.trim() || `${selectedClass} reported by citizen`,
        latitude: location.latitude,
        longitude: location.longitude,
        image_base64: photoCaptured ? "mock_photo_data" : undefined,
      });

      setReports([newReport, ...reports]);
      setDescription("");
      setPhotoCaptured(false);
      setSubmitSuccess(t("report_success"));
      setTimeout(() => setSubmitSuccess(null), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = async (reportId: string) => {
    await apiClient.upvoteComplaint(reportId);
    setReports(
      reports.map((r) =>
        r.id === reportId
          ? { ...r, upvotes_count: r.upvotes_count + 1, has_upvoted: true }
          : r
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return "#10b981";
      case "IN_PROGRESS":
        return "#3b82f6";
      case "VERIFIED":
        return "#8b5cf6";
      case "REJECTED":
        return "#ef4444";
      default:
        return "#f59e0b";
    }
  };

  return (
    <div style={{ padding: "14px", maxWidth: "600px", margin: "0 auto" }}>
      {/* Title */}
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", color: "#111827", margin: "0 0 4px 0" }}>
          {t("report_title")}
        </h2>
        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
          {t("report_subtitle")}
        </p>
      </div>

      {submitSuccess && (
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
          fontSize: "13px",
          fontWeight: "600"
        }}>
          <CheckCircleIcon size={18} color="#10b981" />
          {submitSuccess}
        </div>
      )}

      {/* Reporting Form */}
      <form onSubmit={handleSubmit} style={{
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        padding: "14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        border: "1px solid #e5e7eb",
        marginBottom: "20px"
      }}>
        {/* Photo Capture Card */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
            {t("take_photo")}
          </label>
          <div
            onClick={handleCapturePhoto}
            style={{
              height: "120px",
              border: photoCaptured ? "2px solid #10b981" : "2px dashed #9ca3af",
              borderRadius: "8px",
              backgroundColor: photoCaptured ? "#f0fdf4" : "#f9fafb",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            {photoCaptured ? (
              <>
                <CheckCircleIcon size={32} color="#10b981" />
                <span style={{ fontSize: "12px", color: "#065f46", fontWeight: "600", marginTop: "6px" }}>
                  {t("photo_captured")} (OPPO K13 Camera)
                </span>
              </>
            ) : (
              <>
                <CameraIcon size={32} color="#6b7280" />
                <span style={{ fontSize: "12px", color: "#4b5563", marginTop: "6px" }}>
                  Tap to capture road surface photo
                </span>
              </>
            )}
          </div>
        </div>

        {/* GPS Coordinates Bar */}
        <div style={{
          backgroundColor: "#f3f4f6",
          borderRadius: "6px",
          padding: "8px 10px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: "11px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#374151" }}>
            <MapPinIcon size={14} color="#059669" />
            <span>
              {location ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}` : t("gps_acquiring")}
            </span>
          </div>
          {location && (
            <span style={{
              backgroundColor: "#d1fae5",
              color: "#065f46",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: "600"
            }}>
              ±{location.accuracy_m}m precision
            </span>
          )}
        </div>

        {/* Defect Category Selection */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>
            {t("select_damage_type")}
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {DAMAGE_CLASSES.map((code) => {
              const isSelected = selectedClass === code;
              return (
                <button
                  type="button"
                  key={code}
                  onClick={() => setSelectedClass(code)}
                  style={{
                    backgroundColor: isSelected ? "#064e3b" : "#f3f4f6",
                    color: isSelected ? "#ffffff" : "#1f2937",
                    border: isSelected ? "1px solid #059669" : "1px solid #e5e7eb",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    fontSize: "12px",
                    fontWeight: isSelected ? "700" : "500",
                    cursor: "pointer",
                    textAlign: "center"
                  }}
                >
                  {getDamageClassName(code)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description Field */}
        <div style={{ marginBottom: "14px" }}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("description_placeholder")}
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "8px",
              fontSize: "12px",
              fontFamily: "inherit"
            }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: "100%",
            backgroundColor: isSubmitting ? "#9ca3af" : "#059669",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            padding: "10px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px"
          }}
        >
          <SendIcon size={16} color="#ffffff" />
          {isSubmitting ? t("submitting") : t("submit_report")}
        </button>
      </form>

      {/* Recent Citizen Reports Section */}
      <div>
        <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#1f2937", marginBottom: "10px" }}>
          {t("recent_reports")} ({reports.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {reports.map((report) => (
            <div
              key={report.id}
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "12px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                <div>
                  <span style={{ fontWeight: "700", fontSize: "13px", color: "#111827" }}>
                    {getDamageClassName(report.class_code)}
                  </span>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>
                    {report.road_name || "Location tagged"}
                  </div>
                </div>
                <span style={{
                  backgroundColor: `${getStatusColor(report.status)}15`,
                  color: getStatusColor(report.status),
                  border: `1px solid ${getStatusColor(report.status)}`,
                  fontSize: "10px",
                  fontWeight: "700",
                  padding: "2px 6px",
                  borderRadius: "4px"
                }}>
                  {report.status}
                </span>
              </div>

              <p style={{ fontSize: "12px", color: "#374151", margin: "6px 0 10px 0" }}>
                {report.description}
              </p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px", borderTop: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                  {new Date(report.created_at).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleUpvote(report.id)}
                  style={{
                    backgroundColor: report.has_upvoted ? "#dcfce7" : "#f3f4f6",
                    color: report.has_upvoted ? "#059669" : "#4b5563",
                    border: "none",
                    borderRadius: "4px",
                    padding: "4px 8px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <ThumbsUpIcon size={12} color={report.has_upvoted ? "#059669" : "#6b7280"} />
                  {report.has_upvoted ? t("upvoted") : t("upvote")} ({report.upvotes_count})
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

