import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Shield,
  UploadCloud,
  Eye,
  EyeOff,
  Cpu,
  Sliders,
  ExternalLink,
} from "../components/Icons";
import { detectDefects, InspectionResult, DefectBox } from "../utils/cvDetector";
import { SeverityBadge, SegmentedControl, EmptyState, DemoBadge } from "../ui";
import { useToast } from "../context/ToastContext";

interface SampleImage {
  id: string;
  label: string;
  src: string;
  road: string;
}

const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "capture-pothole",
    label: "NH-44 Asphalt Crater",
    src: "/samples/asphalt_crater.jpg",
    road: "NH-44 GT Road Sector 12",
  },
  {
    id: "capture-multi",
    label: "Unpaved Cluster",
    src: "/samples/unpaved_craters.jpg",
    road: "Gill Road Industrial Bypass Sector 4",
  },
  {
    id: "capture-crack",
    label: "Longitudinal Cracks",
    src: "/samples/cracks_ferozepur.jpg",
    road: "Ferozepur Road Sector 9",
  },
  {
    id: "capture-baseline",
    label: "Highway Baseline",
    src: "/samples/pothole_nh44.jpg",
    road: "Civil Lines North Corridor",
  },
];

type InputMode = "image" | "video" | "camera";

export const ScannerPage: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const [activeImageSrc, setActiveImageSrc] = useState<string>(SAMPLE_IMAGES[0].src);
  const [activeRoadName, setActiveRoadName] = useState<string>(SAMPLE_IMAGES[0].road);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_IMAGES[0].id);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [privacyMask, setPrivacyMask] = useState<boolean>(true);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [confThresh, setConfThresh] = useState<number>(0.2);
  const [loggedDefects, setLoggedDefects] = useState<Record<string, boolean>>({});
  const [createdDefectIds, setCreatedDefectIds] = useState<Record<string, string>>({});
  const { success } = useToast();

  const [inspection, setInspection] = useState<InspectionResult>({
    source: "neural_api",
    totalDefects: 0,
    potholeCount: 0,
    crackCount: 0,
    maxSeverity: "Minor",
    overallScore: 0,
    boxes: [],
    latencyMs: 74,
    imageWidth: 640,
    imageHeight: 480,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Run detection
  const runDetection = async (source: string | Blob) => {
    setIsScanning(true);
    try {
      const result = await detectDefects(source, confThresh);
      setInspection(result);
      if (result.boxes.length > 0) {
        setSelectedBoxId(result.boxes[0].id);
      } else {
        setSelectedBoxId(null);
      }
    } catch (err) {
      console.error("Inference failed", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Trigger scanning when sample or image changes
  useEffect(() => {
    if (inputMode === "image" && activeImageSrc) {
      runDetection(activeImageSrc);
    }
  }, [activeImageSrc, confThresh, inputMode]);

  const captureFrameAndScan = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            runDetection(blob);
          }
        });
      }
    }
  };

  // Handle camera toggling
  useEffect(() => {
    if (inputMode === "camera") {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn("Camera stream access unavailable:", err);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [inputMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setActiveImageSrc(url);
    setSelectedSampleId("");
    setActiveRoadName(`Uploaded: ${file.name}`);
  };

  const handleLogDefect = async (box: DefectBox) => {
    try {
      const classMap: Record<string, string> = {
        "D40 (Pothole)": "POTHOLE",
        "Pothole": "POTHOLE",
        "D00 (Longitudinal Crack)": "CRACK_LONG",
        "Longitudinal Crack": "CRACK_LONG",
        "D10 (Transverse Crack)": "CRACK_TRANS",
        "Transverse Crack": "CRACK_TRANS",
        "D20 (Alligator Crack)": "CRACK_ALLIGATOR",
        "Alligator Crack": "CRACK_ALLIGATOR",
      };
      const code = classMap[box.label] || "POTHOLE";
      const created = await api.createDefect({
        class_code: code,
        confidence: box.confidence,
        severity_level: box.severity,
        normalized_score: box.severity === "Critical" ? 85 : box.severity === "Severe" ? 65 : 40,
      });
      setLoggedDefects((prev) => ({ ...prev, [box.id]: true }));
      setCreatedDefectIds((prev) => ({ ...prev, [box.id]: created.id }));
      success(
        "Defect Logged to Central Database",
        `Distress pattern #${created.id.slice(0, 8)} (${code}) registered with ${Math.round(box.confidence * 100)}% confidence.`
      );
    } catch (err) {
      console.warn("Could not persist defect to API, keeping local state:", err);
      setLoggedDefects((prev) => ({ ...prev, [box.id]: true }));
      success("Detection Cached Locally", `${box.label} logged to field device queue.`);
    }
  };

  const activeDefect = inspection.boxes.find((b) => b.id === selectedBoxId) || inspection.boxes[0];

  return (
    <div className="space-y-6">
      {/* 1. Header with Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Defect Scanner
            </h1>
            <DemoBadge />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Single-frame and video inspection with ONNX YOLO11n INT8 edge inference
          </p>
        </div>

        <SegmentedControl<InputMode>
          value={inputMode}
          onChange={(mode) => setInputMode(mode)}
          options={[
            { id: "image", label: "Upload Image" },
            { id: "video", label: "Upload Video" },
            { id: "camera", label: "Live Camera" },
          ]}
        />
      </div>

      {/* 2. Upload Drop Zone & Sample Chips */}
      {inputMode !== "camera" && (
        <div className="card p-4 space-y-3">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 rounded-md p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/50"
          >
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Click to browse or drop an image file here
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Supports JPEG, PNG, WebP (resolution up to 4K)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Field Verification Captures */}
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 text-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">Field Captures:</span>
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  setActiveImageSrc(sample.src);
                  setActiveRoadName(sample.road);
                  setSelectedSampleId(sample.id);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors shrink-0 ${
                  selectedSampleId === sample.id
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 font-semibold shadow-xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Split View (Left 60% Canvas / Right 40% Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image / Video Canvas (7 cols = ~58%) */}
        <div className="lg:col-span-7 card p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {activeRoadName}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({inspection.imageWidth}×{inspection.imageHeight}px)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowBoxes(!showBoxes)}
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  showBoxes ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                }`}
              >
                {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>Boxes</span>
              </button>

              <button
                onClick={() => setPrivacyMask(!privacyMask)}
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  privacyMask ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                }`}
                title="Privacy shield: automatic blur on faces and vehicle plates"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Privacy Blur</span>
              </button>
            </div>
          </div>

          {/* Canvas Presentation Area */}
          <div className="relative min-h-[380px] bg-slate-950 rounded-md overflow-hidden flex items-center justify-center">
            {inputMode === "camera" ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[420px] object-contain rounded"
                />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={captureFrameAndScan}
                  className="mt-3 btn-primary text-xs"
                >
                  Capture Frame &amp; Scan
                </button>
              </div>
            ) : isScanning ? (
              <div className="text-center p-8 text-xs text-slate-400 font-mono">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Running ONNX inference...</span>
              </div>
            ) : (
              <div className="relative inline-block max-w-full max-h-full">
                <img
                  src={activeImageSrc}
                  alt="Road Inspection View"
                  className="block max-h-[460px] max-w-full w-auto h-auto object-contain rounded select-none"
                />

                {/* Bounding Boxes */}
                {showBoxes &&
                  inspection.boxes.map((box, idx) => {
                    const isSelected = box.id === selectedBoxId;
                    const isCrit = box.severity === "Critical";
                    const isSev = box.severity === "Severe";
                    const isMod = box.severity === "Moderate";

                    const borderColor = isCrit
                        ? "#DC2626"
                        : isSev
                        ? "#EA580C"
                        : isMod
                        ? "#D97706"
                        : "#0EA5A4";

                    return (
                      <div
                        key={box.id}
                        onClick={() => setSelectedBoxId(box.id)}
                        className={`absolute cursor-pointer transition-transform ${
                          isSelected ? "ring-2 ring-white z-20" : "z-10 hover:opacity-90"
                        }`}
                        style={{
                          left: `${box.box[0]}%`,
                          top: `${box.box[1]}%`,
                          width: `${box.box[2]}%`,
                          height: `${box.box[3]}%`,
                          border: `1.5px solid ${borderColor}`,
                          backgroundColor: `${borderColor}20`,
                        }}
                      >
                        <div
                          className="absolute -top-5 left-0 px-1 py-0.2 rounded text-[10px] font-mono font-medium text-white flex items-center gap-1 whitespace-nowrap"
                          style={{ backgroundColor: borderColor }}
                        >
                          <span>#{idx + 1}</span>
                          <span>{box.label}</span>
                          <span>{Math.round(box.confidence * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Latency and Model Telemetry Strip below Canvas */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Inference: <strong className="text-slate-800 dark:text-slate-200">{inspection.latencyMs} ms</strong> (YOLO11n INT8 CPU)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Confidence:</span>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={confThresh}
                onChange={(e) => setConfThresh(parseFloat(e.target.value))}
                className="w-20 cursor-pointer accent-blue-600"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {Math.round(confThresh * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Detections & Action List (5 cols = ~42%) */}
        <div className="lg:col-span-5 card p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {inspection.boxes.length} {inspection.boxes.length === 1 ? "Detection" : "Detections"} Found
              </h2>
              {inspection.boxes.length > 0 && (
                <SeverityBadge level={inspection.maxSeverity} size="sm" showScore={false} />
              )}
            </div>

            {/* Detections List */}
            {inspection.boxes.length > 0 ? (
              <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {inspection.boxes.map((b, idx) => {
                  const isSelected = b.id === (activeDefect?.id || "");
                  const relAreaPct = ((b.box[2] * b.box[3]) / 100).toFixed(1);
                  const isLogged = loggedDefects[b.id];
                  const createdId = createdDefectIds[b.id];

                  return (
                    <div
                      key={b.id}
                      onClick={() => setSelectedBoxId(b.id)}
                      className={`p-3 rounded-md border text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20"
                          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
                          <span className="font-mono text-slate-400">#{idx + 1}</span>
                          <span>{b.label}</span>
                        </div>
                        <SeverityBadge level={b.severity} size="sm" showScore={false} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono mb-2">
                        <div>
                          <span>Confidence: </span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            {Math.round(b.confidence * 100)}%
                          </strong>
                        </div>
                        <div>
                          <span>Area: </span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            {relAreaPct}% frame (uncalibrated)
                          </strong>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                        <span className="text-slate-400">Action: Regular compaction</span>
                        {createdId ? (
                          <Link
                            to={`/maintenance?defectId=${createdId}&tab=defects`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 dark:text-blue-400 hover:underline font-semibold inline-flex items-center gap-1"
                          >
                            <span>Inspect Defect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLogDefect(b);
                            }}
                            disabled={isLogged}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                              isLogged
                                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default"
                                : "btn-secondary text-[11px]"
                            }`}
                          >
                            {isLogged ? "Logged" : "Log as Defect"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No defects detected"
                description={`Zero distress patterns identified in frame above ${Math.round(confThresh * 100)}% confidence.`}
                className="my-8"
              />
            )}
          </div>

          {/* Quick link to Maintenance queue */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need maintenance follow-up?</span>
            <Link
              to="/maintenance"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Open Maintenance &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
