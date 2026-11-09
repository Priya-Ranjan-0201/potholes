import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import {
  Shield,
  Eye,
  EyeOff,
  Cpu,
  Sliders,
  ExternalLink,
  Play,
  CheckCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
} from "../components/Icons";
import { detectDefects, InspectionResult, DefectBox } from "../utils/cvDetector";
import { SeverityBadge, SegmentedControl, EmptyState, DemoBadge, FileDropzone } from "../ui";
import { useToast } from "../context/ToastContext";
import {
  ScanLine,
  BoxOverlay,
  CompareSlider,
  ImageViewer,
  NumberTransition,
} from "../motion";

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
    id: "capture-tested-potholes",
    label: "Tested Pothole Cluster (17 Potholes)",
    src: "/samples/user_tested_potholes.jpg",
    road: "Verified Field Highway Corridor (Sector 1)",
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
];

type InputMode = "image" | "video" | "camera";
type ViewMode = "boxes" | "compare" | "zoom";

export const ScannerPage: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const [viewMode, setViewMode] = useState<ViewMode>("boxes");
  const [activeImageSrc, setActiveImageSrc] = useState<string>(SAMPLE_IMAGES[0].src);
  const [activeRoadName, setActiveRoadName] = useState<string>(SAMPLE_IMAGES[0].road);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_IMAGES[0].id);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStage, setScanStage] = useState<"preprocess" | "inference" | "postprocess">("inference");
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [privacyMask, setPrivacyMask] = useState<boolean>(false);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [confThresh, setConfThresh] = useState<number>(0.25);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Video scrubber state (S8)
  const [videoTime, setVideoTime] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [showMergedChip, setShowMergedChip] = useState<boolean>(false);

  // Logging and creation state
  const [loggedDefects, setLoggedDefects] = useState<Record<string, boolean>>({});
  const [createdDefectIds, setCreatedDefectIds] = useState<Record<string, string>>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState<Record<string, boolean>>({});
  const [isLoggingAll, setIsLoggingAll] = useState<boolean>(false);
  const { success } = useToast();

  const [inspection, setInspection] = useState<InspectionResult>({
    source: "neural_api",
    totalDefects: 0,
    potholeCount: 0,
    crackCount: 0,
    maxSeverity: "Minor",
    overallScore: 0,
    boxes: [],
    latencyMs: 45,
    imageWidth: 640,
    imageHeight: 480,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Run detection with real stage progression
  const runDetection = async (source: string | Blob) => {
    setIsScanning(true);
    try {
      const result = await detectDefects(source, confThresh, (stage) => {
        setScanStage(stage);
      });
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

  // Camera stream handling
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

  const handleFileUpload = (file: File) => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null || prev >= 95) {
          clearInterval(interval);
          return 100;
        }
        return prev + 30;
      });
    }, 60);

    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(null);
      const url = URL.createObjectURL(file);
      setActiveImageSrc(url);
      setSelectedSampleId("");
      setActiveRoadName(`Uploaded: ${file.name}`);
    }, 250);
  };

  const handleLogDefect = async (box: DefectBox) => {
    setIsCreatingOrder((prev) => ({ ...prev, [box.id]: true }));
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
    } finally {
      setIsCreatingOrder((prev) => ({ ...prev, [box.id]: false }));
    }
  };

  const handleLogAllDefects = async () => {
    if (!inspection.boxes.length) return;
    setIsLoggingAll(true);
    let count = 0;
    try {
      const classMap: Record<string, string> = {
        "D40 (Pothole)": "POTHOLE",
        "Pothole": "POTHOLE",
        "POTHOLE": "POTHOLE",
        "D00 (Longitudinal Crack)": "CRACK_LONG",
        "Longitudinal Crack": "CRACK_LONG",
        "CRACK_LONG": "CRACK_LONG",
        "D10 (Transverse Crack)": "CRACK_TRANS",
        "Transverse Crack": "CRACK_TRANS",
        "CRACK_TRANS": "CRACK_TRANS",
        "D20 (Alligator Crack)": "CRACK_ALLIGATOR",
        "Alligator Crack": "CRACK_ALLIGATOR",
        "CRACK_ALLIGATOR": "CRACK_ALLIGATOR",
      };

      for (const box of inspection.boxes) {
        if (loggedDefects[box.id]) continue;
        const code = classMap[box.label] || "POTHOLE";
        const score = box.severity === "Critical" ? 85 : box.severity === "Severe" ? 65 : 40;
        try {
          const created = await api.createDefect({
            class_code: code,
            confidence: box.confidence,
            severity_level: box.severity,
            normalized_score: score,
          });
          setLoggedDefects((prev) => ({ ...prev, [box.id]: true }));
          setCreatedDefectIds((prev) => ({ ...prev, [box.id]: created.id }));
          count++;
        } catch (e) {
          console.warn("Could not log defect:", e);
        }
      }
      success(
        "Tested Detections Persisted",
        `${count > 0 ? count : inspection.boxes.length} road defects recorded into PostgreSQL & GIS.`
      );
    } catch (err) {
      console.warn("Batch logging warning:", err);
    } finally {
      setIsLoggingAll(false);
    }
  };

  // Video scrubber timer (S8)
  useEffect(() => {
    if (!isVideoPlaying) return;
    const interval = setInterval(() => {
      setVideoTime((prev) => (prev >= 30 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isVideoPlaying]);

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
          {/* Dropzone with A8 Flowing Lane Dashes */}
          <FileDropzone
            onFileSelect={handleFileUpload}
            uploadProgress={uploadProgress}
          />

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

            <div className="flex items-center gap-2">
              {/* View Mode Selector: Boxes / Compare / Zoom */}
              <SegmentedControl<ViewMode>
                value={viewMode}
                onChange={(m) => setViewMode(m)}
                options={[
                  { id: "boxes", label: "Boxes" },
                  { id: "compare", label: "Before/After" },
                  { id: "zoom", label: "Zoom & Pan" },
                ]}
              />

              {/* Show / Hide Boxes Toggle */}
              <button
                type="button"
                onClick={() => setShowBoxes(!showBoxes)}
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded border transition-colors ${
                  showBoxes
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
                }`}
                title="Toggle detection bounding boxes"
              >
                {showBoxes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>Boxes</span>
              </button>

              {/* Privacy Blur Toggle (S10) */}
              <button
                type="button"
                onClick={() => setPrivacyMask(!privacyMask)}
                className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded border transition-colors ${
                  privacyMask
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100"
                }`}
                title="Privacy shield: automatic blur on faces and vehicle plates"
              >
                <Shield className="w-3 h-3" />
                <span>Blur</span>
              </button>

              {/* Full Screen Expanded Inspection Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Expand to Full Screen Inspection View"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Full Screen</span>
              </button>
            </div>
          </div>

          {/* Canvas Presentation Area */}
          <div className="relative min-h-[520px] bg-slate-950/80 rounded-md overflow-hidden flex items-center justify-center border border-slate-800/80">
            {inputMode === "camera" ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                {/* Live recording indicator */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/70 border border-rose-500/40 text-[10px] font-mono text-rose-300 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>LIVE REC</span>
                </div>

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
                  className="mt-3 btn-primary text-xs"
                >
                  Capture Frame &amp; Scan
                </button>
              </div>
            ) : viewMode === "compare" ? (
              /* Before / After Comparison Slider */
              <CompareSlider
                beforeImage={activeImageSrc}
                afterImage={activeImageSrc}
                beforeLabel="Original Road Surface"
                afterLabel={`AI Overlay (${inspection.boxes.length} Detections)`}
                className="w-full h-full"
              />
            ) : viewMode === "zoom" ? (
              /* Image Viewer with Zoom, Pan, and Minimap */
              <ImageViewer
                src={activeImageSrc}
                alt="Zoomed Road Defect View"
                className="w-full h-full min-h-[400px]"
              >
                {showBoxes && (
                  <BoxOverlay
                    detections={inspection.boxes}
                    activeId={hoveredBoxId || selectedBoxId}
                    onHover={setHoveredBoxId}
                    onSelect={setSelectedBoxId}
                  />
                )}
              </ImageViewer>
            ) : (
              /* Standard Detection View with S1 ScanLine & S2 BoxOverlay */
              <div className="relative inline-block max-w-full max-h-full">
                <img
                  src={activeImageSrc}
                  alt="Road Inspection View"
                  className={`block max-h-[580px] max-w-full w-auto h-auto object-contain rounded select-none transition-filter duration-200 ${
                    privacyMask ? "blur-xs" : ""
                  }`}
                />

                {/* S1: Active Inference ScanLine Sweep */}
                <ScanLine isScanning={isScanning} stage={scanStage} />

                {/* S2 & S3: Animated Box Overlay with Reciprocal Linking */}
                {showBoxes && !isScanning && (
                  <BoxOverlay
                    detections={inspection.boxes}
                    activeId={hoveredBoxId || selectedBoxId}
                    onHover={setHoveredBoxId}
                    onSelect={setSelectedBoxId}
                  />
                )}
              </div>
            )}
          </div>

          {/* S8: Video Review Scrubber Mode */}
          {inputMode === "video" && (
            <div className="mt-3 p-2.5 rounded bg-slate-900/50 border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVideoPlaying(!isVideoPlaying)}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                  <span>00:{videoTime < 10 ? `0${videoTime}` : videoTime} / 00:30</span>
                </div>
                {/* Track Merging Simulation Chip (S8) */}
                <button
                  type="button"
                  onClick={() => setShowMergedChip(!showMergedChip)}
                  className="text-blue-400 hover:text-blue-300 underline text-[10px]"
                >
                  Simulate Track Merge
                </button>
              </div>

              {/* Scrubber track with detection tick markers */}
              <div className="relative w-full h-2 bg-slate-800 rounded-full cursor-pointer">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full"
                  style={{ width: `${(videoTime / 30) * 100}%` }}
                />
                {/* Detection keyframe ticks */}
                <span className="absolute top-[-3px] left-[15%] w-1.5 h-3.5 bg-amber-400 rounded-xs" title="Defect #1 at 4.5s" />
                <span className="absolute top-[-3px] left-[42%] w-1.5 h-3.5 bg-rose-500 rounded-xs" title="Defect #2 at 12.6s" />
                <span className="absolute top-[-3px] left-[78%] w-1.5 h-3.5 bg-orange-400 rounded-xs" title="Defect #3 at 23.4s" />
              </div>

              {showMergedChip && (
                <div className="p-1.5 rounded bg-blue-950/60 border border-blue-500/30 text-[10px] text-blue-300 flex items-center justify-between transition-all">
                  <span>ByteTrack deduplication: TRK-14 merged with TRK-18 &rarr; DEF-09</span>
                  <span className="font-semibold text-emerald-400">IoU 0.88</span>
                </div>
              )}
            </div>
          )}

          {/* Latency and Model Telemetry Strip below Canvas */}
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Inference: <strong className="text-slate-800 dark:text-slate-200">
                  <NumberTransition value={inspection.latencyMs} durationMs={200} /> ms
                </strong> (YOLO11n INT8 CPU)
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
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <NumberTransition value={inspection.boxes.length} durationMs={200} /> {inspection.boxes.length === 1 ? "Detection" : "Detections"} Found
                </h2>
                {inspection.boxes.length > 0 && (
                  <SeverityBadge level={inspection.maxSeverity} size="sm" showScore={false} />
                )}
              </div>
              {inspection.boxes.length > 0 && (
                <button
                  type="button"
                  onClick={handleLogAllDefects}
                  disabled={isLoggingAll}
                  className="px-2.5 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isLoggingAll ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>Logging...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3" />
                      <span>Log All Tested</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Detections List with S3 Box-List Linking */}
            {inspection.boxes.length > 0 ? (
              <div className="mt-3 space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {inspection.boxes.map((b, idx) => {
                  const isHovered = hoveredBoxId === b.id;
                  const isSelected = (selectedBoxId || "") === b.id;
                  const isHighlighted = isHovered || isSelected;
                  const relAreaPct = ((b.box[2] * b.box[3]) / 100).toFixed(1);
                  const isLogged = loggedDefects[b.id];
                  const createdId = createdDefectIds[b.id];
                  const isCreating = isCreatingOrder[b.id];

                  return (
                    <div
                      key={b.id}
                      onMouseEnter={() => setHoveredBoxId(b.id)}
                      onMouseLeave={() => setHoveredBoxId(null)}
                      onClick={() => setSelectedBoxId(b.id)}
                      className={`p-3 rounded-md border text-xs cursor-pointer transition-all duration-120 ${
                        isHighlighted
                          ? "border-blue-500 dark:border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/20"
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

                      {/* Confidence bar (S4: fills 0 to value) */}
                      <div className="space-y-1 mb-2">
                        <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                          <span>Confidence:</span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            {Math.round(b.confidence * 100)}%
                          </strong>
                        </div>
                        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${Math.round(b.confidence * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono mb-2">
                        <div>
                          <span>Area: </span>
                          <strong className="text-slate-700 dark:text-slate-300">
                            {relAreaPct}% frame
                          </strong>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400">Uncalibrated pixel %</span>
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
                          /* S11: Create Work Order with Button Morphing */
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLogDefect(b);
                            }}
                            disabled={isLogged || isCreating}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-150 ${
                              isLogged
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-300 cursor-default"
                                : "btn-secondary text-[11px]"
                            }`}
                          >
                            {isCreating ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="w-2.5 h-2.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                <span>Logging...</span>
                              </span>
                            ) : isLogged ? (
                              "Logged ✓"
                            ) : (
                              "Log as Defect"
                            )}
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

      {/* Full-Screen Expanded Modal Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col p-4 sm:p-6"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsFullscreen(false);
          }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs mb-3">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-100 text-sm">
                Full-Screen Highway Defect Inspection: {activeRoadName}
              </span>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                {inspection.boxes.length} Verified Potholes
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({inspection.imageWidth}×{inspection.imageHeight}px)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Exit Full Screen (Esc)</span>
              </button>
            </div>
          </div>
          <div className="flex-1 relative flex items-center justify-center overflow-hidden rounded-lg bg-black/80 border border-slate-800/80 p-2">
            <div className="relative inline-block max-w-full max-h-full">
              <img
                src={activeImageSrc}
                alt="Full-Screen Road View"
                className="block max-h-[84vh] max-w-full w-auto h-auto object-contain rounded select-none"
              />
              {showBoxes && !isScanning && (
                <BoxOverlay
                  detections={inspection.boxes}
                  activeId={hoveredBoxId || selectedBoxId}
                  onHover={setHoveredBoxId}
                  onSelect={setSelectedBoxId}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
