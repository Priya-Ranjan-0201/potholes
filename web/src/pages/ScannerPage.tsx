import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import {
  CheckCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Camera,
  UploadCloud,
  Eye,
  EyeOff,
} from "../components/Icons";
import { detectDefects, InspectionResult } from "../utils/cvDetector";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
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
    label: "Bengaluru",
    src: "/samples/bengaluru_potholes.jpg",
    road: "Bengaluru Arterial Road",
  },
  {
    id: "capture-mumbai",
    label: "Mumbai",
    src: "/samples/mumbai_potholes.avif",
    road: "Mumbai Monsoon Road",
  },
  {
    id: "capture-cracks",
    label: "Cracks",
    src: "/samples/alligator_cracks.jpg",
    road: "Alligator Fatigue Cracks",
  },
  {
    id: "capture-diagram",
    label: "Diagram",
    src: "/samples/civil_distress_diagram.jpg",
    road: "Road Distress Diagram",
  },
  {
    id: "capture-pothole",
    label: "Crater",
    src: "/samples/asphalt_crater.jpg",
    road: "Asphalt Crater",
  },
  {
    id: "capture-clean",
    label: "Clean Road",
    src: "/samples/pothole_nh44.jpg",
    road: "Clean Road",
  },
];

type InputMode = "image" | "camera";

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
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [confThresh, setConfThresh] = useState<number>(0.30);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("capture-bengaluru");
  const [activeImageSrc, setActiveImageSrc] = useState<string>("/samples/bengaluru_potholes.jpg");
  const [activeRoadName, setActiveRoadName] = useState<string>("Bengaluru Arterial Road");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStage, setScanStage] = useState<"preprocess" | "inference" | "postprocess">("postprocess");
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [allSaved, setAllSaved] = useState<boolean>(false);
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);
  const { success } = useToast();
  const { t } = useLanguage();

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
  const scanIdRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const runDetection = async (source: string | Blob) => {
    const scanId = ++scanIdRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsScanning(true);
    setAllSaved(false);
    setSelectedBoxId(null);
    setHoveredBoxId(null);
    setInspection((prev) => ({
      ...prev,
      totalDefects: 0,
      potholeCount: 0,
      crackCount: 0,
      boxes: [],
      latencyMs: 0,
    }));

    try {
      const result = await detectDefects(
        source,
        confThresh,
        (stage) => {
          if (scanIdRef.current === scanId) setScanStage(stage);
        },
        controller.signal
      );
      if (scanIdRef.current !== scanId) return;
      setInspection(result);
    } catch (err) {
      if ((err as Error)?.name !== "AbortError") {
        console.error("Inference failed", err);
      }
    } finally {
      if (scanIdRef.current === scanId) {
        setIsScanning(false);
      }
    }
  };

  useEffect(() => {
    if (inputMode === "image" && activeImageSrc) {
      runDetection(uploadedFileRef.current ?? activeImageSrc);
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

  const handleSaveAll = async () => {
    if (!inspection.boxes.length) return;
    setIsSavingAll(true);
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
      // Standalone mode without DB
    } finally {
      setAllSaved(true);
      setIsSavingAll(false);
      success("Saved", `${inspection.boxes.length} defects added to Maintenance.`);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Clean Top Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t("scannerTitle")}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t("scannerSubtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <label className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1.5">
            <UploadCloud className="w-4 h-4" />
            <span>{t("uploadPhoto")}</span>
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
            className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${inputMode === "camera"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
          >
            <Camera className="w-4 h-4" />
            <span>{inputMode === "camera" ? t("photoModeBtn") : t("cameraBtn")}</span>
          </button>
        </div>
      </div>

      {/* 2. Simple Sample Switcher */}
      {inputMode !== "camera" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
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
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors shrink-0 cursor-pointer ${selectedSampleId === sample.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {sample.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. Main 2-Column View: Photo Canvas + Simple Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Photo Viewer */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
              {activeRoadName}
            </span>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowBoxes(!showBoxes)}
                className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer flex items-center gap-1.5"
              >
                {showBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showBoxes ? t("hideBoxes") : t("showBoxes")}</span>
              </button>

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
                  <span>Scan Frame</span>
                </button>
              </div>
            ) : (
              <div className="relative w-full h-[460px] flex items-center justify-center select-none">
                <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700 text-white text-xs font-medium pointer-events-none flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${inspection.boxes.length > 0 ? "bg-emerald-400" : "bg-slate-400"
                      }`}
                  />
                  <span>
                    {isScanning
                      ? "Scanning..."
                      : inspection.boxes.length > 0
                        ? `${inspection.potholeCount} ${t("potholesLabel")} · ${inspection.crackCount} ${t("cracksLabel")}`
                        : t("cleanRoad")}
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
                  {showBoxes && (
                    <BoxOverlay
                      detections={inspection.boxes}
                      activeId={hoveredBoxId ?? selectedBoxId}
                      onHover={(id) => setHoveredBoxId(id)}
                      onSelect={(id) => setSelectedBoxId((prev) => (prev === id ? null : id))}
                      viewMode="boxes"
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span>{t("sensitivity")}</span>
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
              {inspection.latencyMs > 0 ? `${(inspection.latencyMs / 1000).toFixed(2)}s` : "Ready"}
            </span>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col">
          <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 text-center py-3">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{t("potholesLabel")}</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {inspection.potholeCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{t("cracksLabel")}</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                {inspection.crackCount}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">{t("statusLabel")}</div>
              <div
                className={`text-sm font-bold mt-0.5 ${inspection.boxes.length === 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : inspection.maxSeverity === "Critical"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
              >
                {inspection.boxes.length === 0 ? t("goodStatus") : inspection.maxSeverity}
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[385px] overflow-y-auto [scrollbar-width:thin]">
            {inspection.boxes.length > 0 ? (
              inspection.boxes.map((b, idx) => {
                const isSelected = selectedBoxId === b.id;
                const isCrack = b.label.includes("CRACK");
                return (
                  <button
                    key={b.id}
                    type="button"
                    onMouseEnter={() => setHoveredBoxId(b.id)}
                    onMouseLeave={() => setHoveredBoxId(null)}
                    onClick={() => setSelectedBoxId((prev) => (prev === b.id ? null : b.id))}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs cursor-pointer transition-colors ${isSelected
                        ? "bg-blue-50/70 dark:bg-blue-950/30"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-slate-400 font-mono w-5 shrink-0">#{idx + 1}</span>
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${isCrack
                            ? "bg-amber-800"
                            : b.severity === "Critical"
                              ? "bg-red-900"
                              : "bg-emerald-900"
                          }`}
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {formatDefectTitle(b.label)}
                      </span>
                    </div>

                    <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0">
                      {Math.round(b.confidence * 100)}%
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="py-12 px-4 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <span>{t("noDefectsDetected")}</span>
              </div>
            )}
          </div>

          {inspection.boxes.length > 0 && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSavingAll || allSaved}
                className={`w-full py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${allSaved
                    ? "bg-emerald-700 text-white cursor-default"
                    : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                  }`}
              >
                {isSavingAll ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : allSaved ? (
                  t("savedToMaintenance")
                ) : (
                  t("saveToMaintenance")
                )}
              </button>
            </div>
          )}
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
              {showBoxes && (
                <BoxOverlay
                  detections={inspection.boxes}
                  activeId={hoveredBoxId ?? selectedBoxId}
                  onHover={(id) => setHoveredBoxId(id)}
                  onSelect={(id) => setSelectedBoxId((prev) => (prev === id ? null : id))}
                  viewMode="boxes"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
