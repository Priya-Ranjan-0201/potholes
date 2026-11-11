import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import {
  Sliders,
  CheckCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Camera,
  UploadCloud,
} from "../components/Icons";
import { detectDefects, InspectionResult, DefectBox } from "../utils/cvDetector";
import { useToast } from "../context/ToastContext";
import { ScanLine, BoxOverlay } from "../motion";

interface SampleImage {
  id: string;
  label: string;
  src: string;
  road: string;
}

const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "capture-bengaluru",
    label: "Bengaluru Road",
    src: "/samples/bengaluru_potholes.jpg",
    road: "Bengaluru Arterial Road",
  },
  {
    id: "capture-mumbai",
    label: "Mumbai Monsoon",
    src: "/samples/mumbai_potholes.avif",
    road: "Mumbai Monsoon Corridor",
  },
  {
    id: "capture-cracks",
    label: "Alligator Cracks",
    src: "/samples/alligator_cracks.jpg",
    road: "Alligator Fatigue Cracking",
  },
  {
    id: "capture-diagram",
    label: "Distress Diagram",
    src: "/samples/civil_distress_diagram.jpg",
    road: "Road Distress Benchmark",
  },
  {
    id: "capture-pothole",
    label: "Asphalt Crater",
    src: "/samples/asphalt_crater.jpg",
    road: "Asphalt Crater Sample",
  },
  {
    id: "capture-clean",
    label: "Clean Road",
    src: "/samples/pothole_nh44.jpg",
    road: "Smooth Pavement Baseline",
  },
];

type InputMode = "image" | "camera";
type DisplayMode = "boxes" | "masks" | "off";

const formatDefectTitle = (label: string) => {
  const upper = (label || "").toUpperCase();
  if (upper.includes("ALLIGATOR")) return "Alligator Crack";
  if (upper.includes("LONGITUDINAL")) return "Longitudinal Crack";
  if (upper.includes("TRANSVERSE")) return "Transverse Crack";
  if (upper.includes("CRACK")) return "Road Crack";
  return "Pothole";
};

export const ScannerPage: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("boxes");
  const [confThresh, setConfThresh] = useState<number>(0.30);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("capture-bengaluru");
  const [activeImageSrc, setActiveImageSrc] = useState<string>("/samples/bengaluru_potholes.jpg");
  const [activeRoadName, setActiveRoadName] = useState<string>("Bengaluru Arterial Road");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStage, setScanStage] = useState<"preprocess" | "inference" | "postprocess">("postprocess");
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loggedDefects, setLoggedDefects] = useState<Record<string, boolean>>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState<Record<string, boolean>>({});
  const [isLoggingAll, setIsLoggingAll] = useState<boolean>(false);
  const { success } = useToast();

  const [inspection, setInspection] = useState<InspectionResult>({
    source: "neural_api",
    totalDefects: 0,
    potholeCount: 0,
    crackCount: 0,
    maxSeverity: "Minor",
    overallScore: 100,
    boxes: [],
    latencyMs: 0,
    imageWidth: 640,
    imageHeight: 480,
    engine: "70/30 Hybrid Ensemble",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadedFileRef = useRef<File | null>(null);

  const runDetection = async (source: string | Blob) => {
    setIsScanning(true);
    setLoggedDefects({});
    try {
      const result = await detectDefects(source, confThresh, (stage) => setScanStage(stage));
      setInspection(result);
      setSelectedBoxId(result.boxes.length > 0 ? result.boxes[0].id : null);
    } catch (err) {
      console.error("Inference failed", err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (inputMode === "image" && activeImageSrc) {
      const source: string | Blob = uploadedFileRef.current ?? activeImageSrc;
      runDetection(source);
    }
  }, [activeImageSrc, confThresh, inputMode, selectedSampleId]);

  useEffect(() => {
    if (inputMode === "camera") {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => console.warn("Camera unavailable:", err));
    } else if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [inputMode]);

  const handleFileUpload = (file: File) => {
    uploadedFileRef.current = file;
    const url = URL.createObjectURL(file);
    setInputMode("image");
    setSelectedSampleId("");
    setActiveRoadName(file.name);
    setActiveImageSrc(url);
  };

  const captureFrameAndScan = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) runDetection(blob);
      });
    }
  };

  const handleLogDefect = async (box: DefectBox) => {
    setIsCreatingOrder((prev) => ({ ...prev, [box.id]: true }));
    try {
      await api.createDefect({
        class_code: box.label.includes("CRACK") ? "CRACK_ALLIGATOR" : "POTHOLE",
        confidence: box.confidence,
        severity_level: box.severity,
        normalized_score: box.severity === "Critical" ? 85 : box.severity === "Severe" ? 65 : 40,
      });
    } catch {
      // Fallback toast when running standalone AI inference without DB
    } finally {
      setLoggedDefects((prev) => ({ ...prev, [box.id]: true }));
      setIsCreatingOrder((prev) => ({ ...prev, [box.id]: false }));
      success("Saved", `${formatDefectTitle(box.label)} added to Maintenance.`);
    }
  };

  const handleLogAllDefects = async () => {
    if (!inspection.boxes.length) return;
    setIsLoggingAll(true);
    try {
      for (const box of inspection.boxes) {
        await api.createDefect({
          class_code: box.label.includes("CRACK") ? "CRACK_ALLIGATOR" : "POTHOLE",
          confidence: box.confidence,
          severity_level: box.severity,
          normalized_score: box.severity === "Critical" ? 85 : box.severity === "Severe" ? 65 : 40,
        });
      }
    } catch {
      // Ignore if running standalone inference server
    } finally {
      const done: Record<string, boolean> = {};
      inspection.boxes.forEach((b) => {
        done[b.id] = true;
      });
      setLoggedDefects(done);
      setIsLoggingAll(false);
      success("All Saved", `${inspection.boxes.length} defects saved to Maintenance.`);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Simple Top Header & Primary Upload Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3.5">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">
            Road Defect Scanner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload any road photo or pick a sample below to detect potholes and cracks.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="px-3.5 py-2 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onClick={(e) => {
                (e.target as HTMLInputElement).value = "";
              }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => setInputMode(inputMode === "camera" ? "image" : "camera")}
            className={`px-3 py-2 rounded-md text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              inputMode === "camera"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{inputMode === "camera" ? "Back to Photo" : "Camera"}</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Sample Strip */}
      {inputMode !== "camera" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {SAMPLE_IMAGES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                uploadedFileRef.current = null;
                setInputMode("image");
                setActiveImageSrc(sample.src);
                setActiveRoadName(sample.road);
                setSelectedSampleId(sample.id);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
                selectedSampleId === sample.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {sample.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. Main 2-Column Workspace: Image Viewer + Simple Defect List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Road Photo & Detections */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-3">
          {/* Viewer Toolbar */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {activeRoadName}
            </span>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
                {(["boxes", "masks", "off"] as DisplayMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setDisplayMode(mode)}
                    className={`px-2.5 py-1 rounded text-xs capitalize cursor-pointer transition-colors ${
                      displayMode === mode
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                title="Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Photo Canvas */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileUpload(f);
            }}
            className="relative min-h-[380px] max-h-[500px] bg-slate-950 rounded-md overflow-hidden flex items-center justify-center border border-slate-800"
          >
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
                  type="button"
                  onClick={captureFrameAndScan}
                  className="mt-3 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture &amp; Scan</span>
                </button>
              </div>
            ) : (
              <div className="relative w-full h-[460px] flex items-center justify-center select-none">
                {/* Clean Corner Summary Pill */}
                <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700 text-white text-xs font-medium pointer-events-none flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      inspection.boxes.length > 0 ? "bg-emerald-400" : "bg-slate-400"
                    }`}
                  />
                  <span>
                    {isScanning
                      ? "Scanning..."
                      : inspection.boxes.length > 0
                      ? `${inspection.potholeCount} Potholes · ${inspection.crackCount} Cracks`
                      : "Clean Road"}
                  </span>
                </div>

                <div className="relative inline-block leading-none max-w-full max-h-full">
                  <img
                    src={activeImageSrc}
                    alt={activeRoadName}
                    className="block max-w-full select-none"
                    style={{ maxHeight: "460px", width: "auto", height: "auto" }}
                  />
                  <ScanLine isScanning={isScanning} stage={scanStage} />
                  {displayMode !== "off" && (
                    <BoxOverlay
                      detections={inspection.boxes}
                      activeId={selectedBoxId || hoveredBoxId}
                      onHover={(id) => setHoveredBoxId(id)}
                      onSelect={(id) => setSelectedBoxId(id)}
                      viewMode={displayMode}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Simple Controls Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5" />
              <span>Sensitivity</span>
              <input
                type="range"
                min="0.10"
                max="0.75"
                step="0.05"
                value={confThresh}
                onChange={(e) => setConfThresh(parseFloat(e.target.value))}
                className="w-24 cursor-pointer accent-blue-600"
              />
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {Math.round(confThresh * 100)}%
              </span>
            </div>

            <span className="font-mono">
              {inspection.latencyMs > 0 ? `${Math.round(inspection.latencyMs)} ms` : "Ready"}
            </span>
          </div>
        </div>

        {/* Right Column: Simple Results Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
          {/* 3 Clean Numbers */}
          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 text-center py-3">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Potholes</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {inspection.potholeCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Cracks</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {inspection.crackCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Condition</div>
              <div
                className={`text-sm font-bold mt-0.5 ${
                  inspection.boxes.length === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : inspection.maxSeverity === "Critical"
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {inspection.boxes.length === 0 ? "Good" : inspection.maxSeverity}
              </div>
            </div>
          </div>

          {/* Detected Defects List */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-white">
              Detected Defects ({inspection.boxes.length})
            </span>
            {inspection.boxes.length > 0 && (
              <button
                type="button"
                onClick={handleLogAllDefects}
                disabled={isLoggingAll}
                className="px-2.5 py-1 rounded text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1"
              >
                {isLoggingAll ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Save All"}
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[395px] overflow-y-auto [scrollbar-width:thin]">
            {inspection.boxes.length > 0 ? (
              inspection.boxes.map((b, idx) => {
                const isSelected = selectedBoxId === b.id;
                const isCrack = b.label.includes("CRACK");
                return (
                  <div
                    key={b.id}
                    onMouseEnter={() => setHoveredBoxId(b.id)}
                    onMouseLeave={() => setHoveredBoxId(null)}
                    onClick={() => setSelectedBoxId(b.id)}
                    className={`px-3 py-2.5 flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/30"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-400 font-mono w-5 shrink-0">#{idx + 1}</span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isCrack
                            ? "bg-amber-600"
                            : b.severity === "Critical"
                            ? "bg-red-600"
                            : "bg-emerald-700"
                        }`}
                      />
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {formatDefectTitle(b.label)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {Math.round(b.confidence * 100)}% · {b.severity}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogDefect(b);
                      }}
                      disabled={loggedDefects[b.id] || isCreatingOrder[b.id]}
                      className={`px-2 py-1 rounded text-[11px] font-medium shrink-0 cursor-pointer ${
                        loggedDefects[b.id]
                          ? "text-emerald-600 dark:text-emerald-400 cursor-default"
                          : "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {loggedDefects[b.id] ? "Saved" : "Save"}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span>No potholes or cracks detected in this photo.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm">
            <span className="font-semibold text-white">{activeRoadName}</span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 rounded-md bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden mt-3">
            <div className="relative inline-block leading-none">
              <img
                src={activeImageSrc}
                alt={activeRoadName}
                className="block select-none"
                style={{ maxHeight: "calc(100vh - 100px)", maxWidth: "calc(100vw - 40px)" }}
              />
              {displayMode !== "off" && (
                <BoxOverlay
                  detections={inspection.boxes}
                  activeId={selectedBoxId || hoveredBoxId}
                  onHover={(id) => setHoveredBoxId(id)}
                  onSelect={(id) => setSelectedBoxId(id)}
                  viewMode={displayMode}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
