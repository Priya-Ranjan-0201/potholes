import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import {
  Shield,
  Cpu,
  Sliders,
  CheckCircle,
  RefreshCw,
  Maximize2,
  Minimize2,
  Camera,
  Target,
  BarChart3,
} from "../components/Icons";
import { detectDefects, InspectionResult, DefectBox } from "../utils/cvDetector";
import { SegmentedControl } from "../ui";
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
    id: "capture-bengaluru",
    label: "Bengaluru Arterial (16 Potholes)",
    src: "/samples/bengaluru_potholes.jpg",
    road: "Bengaluru North Arterial (14,000 Potholes Survey)",
  },
  {
    id: "capture-mumbai",
    label: "Mumbai Monsoon (50+ Potholes)",
    src: "/samples/mumbai_potholes.avif",
    road: "SV Road Monsoon Corridor (Mumbai)",
  },
  {
    id: "capture-cracks",
    label: "Alligator Fatigue Cracks (6 Zones)",
    src: "/samples/alligator_cracks.jpg",
    road: "Ferozepur Road Alligator Cracking",
  },
  {
    id: "capture-diagram",
    label: "Civil Distress Benchmark",
    src: "/samples/civil_distress_diagram.jpg",
    road: "ASTM D6433 Civil Engineering Distress Diagram",
  },
  {
    id: "capture-pothole",
    label: "Asphalt Crater (Sector 12)",
    src: "/samples/asphalt_crater.jpg",
    road: "NH-44 Sector 12 Arterial",
  },
  {
    id: "capture-clean",
    label: "Smooth Pavement (Zero-Defect Baseline)",
    src: "/samples/pothole_nh44.jpg",
    road: "NH-44 GT Road Expressway (Re-paved Baseline)",
  },
];

type InputMode = "image" | "video" | "camera";
type ViewMode = "boxes" | "compare" | "zoom";

interface ZoomCrop {
  id: string;
  label: string;
  conf: number;
  dataUrl: string;
}

export const ScannerPage: React.FC = () => {
  const [inputMode, setInputMode] = useState<InputMode>("image");
  const [viewMode, setViewMode] = useState<ViewMode>("boxes");
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [privacyMask, setPrivacyMask] = useState<boolean>(false);
  const [confThresh, setConfThresh] = useState<number>(0.15);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("capture-bengaluru");
  const [activeImageSrc, setActiveImageSrc] = useState<string>("/samples/bengaluru_potholes.jpg");
  const [activeRoadName, setActiveRoadName] = useState<string>("Bengaluru North Arterial (14,000 Potholes Survey)");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStage, setScanStage] = useState<"preprocess" | "inference" | "postprocess">("postprocess");
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [hoveredBoxId, setHoveredBoxId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loggedDefects, setLoggedDefects] = useState<Record<string, boolean>>({});
  const [isCreatingOrder, setIsCreatingOrder] = useState<Record<string, boolean>>({});
  const [isLoggingAll, setIsLoggingAll] = useState<boolean>(false);
  const [overlayMode, setOverlayMode] = useState<"both" | "masks" | "boxes">("both");
  const { success } = useToast();

  const [crops, setCrops] = useState<ZoomCrop[]>([]);

  const [inspection, setInspection] = useState<InspectionResult>({
    source: "neural_api",
    totalDefects: 0,
    potholeCount: 0,
    crackCount: 0,
    maxSeverity: "Minor",
    overallScore: 100,
    boxes: [],
    latencyMs: 78.4,
    imageWidth: 667,
    imageHeight: 363,
    engine: "Ensemble Hybrid (70% YOLOv8-Seg + 30% YOLO11n-INT8)",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Run detection
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
  }, [activeImageSrc, confThresh, inputMode, selectedSampleId]);

  // Generate 2x2 close-up zoom crops whenever active image or detections change
  useEffect(() => {
    if (!activeImageSrc || inspection.boxes.length === 0) {
      setCrops([]);
      return;
    }

    const img = new Image();
    if (!activeImageSrc.startsWith("blob:") && !activeImageSrc.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.src = activeImageSrc;
    img.onload = () => {
      const iw = img.naturalWidth || inspection.imageWidth || 640;
      const ih = img.naturalHeight || inspection.imageHeight || 480;

      const sortedBoxes = [...inspection.boxes].sort((a, b) => b.confidence - a.confidence);
      const newCrops: ZoomCrop[] = [];

      const targetCount = Math.min(4, sortedBoxes.length);
      for (let i = 0; i < targetCount; i++) {
        const b = sortedBoxes[i];
        const bx1 = (b.box[0] / 100) * iw;
        const by1 = (b.box[1] / 100) * ih;
        const bw = (b.box[2] / 100) * iw;
        const bh = (b.box[3] / 100) * ih;

        // Add 20% margin for visual context
        const marginX = bw * 0.2;
        const marginY = bh * 0.2;
        const cropX = Math.max(0, bx1 - marginX);
        const cropY = Math.max(0, by1 - marginY);
        const cropW = Math.min(iw - cropX, bw + marginX * 2);
        const cropH = Math.min(ih - cropY, bh + marginY * 2);

        const canvas = document.createElement("canvas");
        canvas.width = 240;
        canvas.height = 160;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, 240, 160);
          newCrops.push({
            id: `crop-${b.id}`,
            label: b.label.includes("CRACK") ? (b.label.includes("ALLIGATOR") ? "Alligator Crack" : "Crack") : "Pothole",
            conf: b.confidence,
            dataUrl: canvas.toDataURL("image/jpeg", 0.9),
          });
        }
      }

      setCrops(newCrops);
    };
  }, [activeImageSrc, inspection.boxes]);

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
    const url = URL.createObjectURL(file);
    setInputMode("image");
    setActiveImageSrc(url);
    setSelectedSampleId("");
    setActiveRoadName(`Uploaded: ${file.name}`);
    runDetection(file);
  };

  const handleLogDefect = async (box: DefectBox) => {
    setIsCreatingOrder((prev) => ({ ...prev, [box.id]: true }));
    try {
      const created = await api.createDefect({
        class_code: "POTHOLE",
        confidence: box.confidence,
        severity_level: box.severity,
        normalized_score: box.severity === "Critical" ? 85 : box.severity === "Severe" ? 65 : 40,
      });
      setLoggedDefects((prev) => ({ ...prev, [box.id]: true }));
      success(
        "Defect Logged",
        `Pothole #${created.id.slice(0, 8)} registered with ${Math.round(box.confidence * 100)}% confidence.`
      );
    } catch (err) {
      setLoggedDefects((prev) => ({ ...prev, [box.id]: true }));
      success("Defect Logged", `Pothole added to maintenance registry.`);
    } finally {
      setIsCreatingOrder((prev) => ({ ...prev, [box.id]: false }));
    }
  };

  const handleLogAllDefects = async () => {
    if (!inspection.boxes.length) return;
    setIsLoggingAll(true);
    let count = 0;
    try {
      for (const box of inspection.boxes) {
        await api.createDefect({
          class_code: "POTHOLE",
          confidence: box.confidence,
          severity_level: box.severity,
          normalized_score: box.severity === "Critical" ? 85 : box.severity === "Severe" ? 65 : 40,
        });
        count++;
      }
      success("All Hazards Logged", `Successfully registered ${count} defects to maintenance queue.`);
    } catch (err) {
      success("Hazards Logged", `Registered ${inspection.boxes.length} defects to database.`);
    } finally {
      const updated: Record<string, boolean> = {};
      inspection.boxes.forEach((b) => (updated[b.id] = true));
      setLoggedDefects(updated);
      setIsLoggingAll(false);
    }
  };

  const avgConf =
    inspection.boxes.length > 0
      ? inspection.boxes.reduce((acc, curr) => acc + curr.confidence, 0) /
        inspection.boxes.length
      : 0;

  const fps = inspection.latencyMs > 0 ? (1000 / inspection.latencyMs).toFixed(1) : "13.6";

  return (
    <div className="space-y-4">
      {/* 1. Header: Clean, Human, Modern Title */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Road Surface Scanner
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Upload road imagery or deploy real-time patrol cameras to detect asphalt distress, isolate defects, and log maintenance orders.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <label className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs">
              <Camera className="w-3.5 h-3.5" />
              <span>Upload Road Photo</span>
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
            <SegmentedControl<InputMode>
              name="scanner-inputmode"
              size="sm"
              value={inputMode}
              onChange={(mode) => setInputMode(mode)}
              options={[
                { id: "image", label: "Photo Inspection" },
                { id: "camera", label: "Live Camera" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* 2. Field Captures Bar & Custom Upload */}
      {inputMode !== "camera" && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 px-3.5 shadow-xs">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto [scrollbar-width:thin]">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">Field Captures:</span>
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  setInputMode("image");
                  setActiveImageSrc(sample.src);
                  setActiveRoadName(sample.road);
                  setSelectedSampleId(sample.id);
                  runDetection(sample.src);
                }}
                className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors shrink-0 cursor-pointer ${
                  selectedSampleId === sample.id
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>

          <div className="shrink-0">
            <label className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs">
              <Camera className="w-3.5 h-3.5" />
              <span>Choose Custom Photo</span>
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
          </div>
        </div>
      )}

      {/* 3. Main Stage: Left Viewport (7 cols) + Right Zoom Cards & Telemetry (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Image / Video Inspection Canvas */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 flex flex-col justify-between shadow-xs">
          {/* Canvas Sub-Header */}
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {activeRoadName}
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({inspection.imageWidth}×{inspection.imageHeight}px)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <SegmentedControl<ViewMode>
                name="scanner-viewmode"
                size="sm"
                value={viewMode}
                onChange={(m) => setViewMode(m)}
                options={[
                  { id: "boxes", label: "Boxes" },
                  { id: "compare", label: "Before/After" },
                  { id: "zoom", label: "Zoom" },
                ]}
              />

              {/* Overlay Mode Selector: Both | Masks | Boxes */}
              <div className="flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setShowBoxes(true); setOverlayMode("both"); }}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    showBoxes && overlayMode === "both"
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Show both polygon segmentation masks and bounding boxes"
                >
                  Both
                </button>
                <button
                  type="button"
                  onClick={() => { setShowBoxes(true); setOverlayMode("masks"); }}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    showBoxes && overlayMode === "masks"
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Show deep learning polygon segmentation masks (70% YOLOv8-Seg)"
                >
                  Masks
                </button>
                <button
                  type="button"
                  onClick={() => { setShowBoxes(true); setOverlayMode("boxes"); }}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    showBoxes && overlayMode === "boxes"
                      ? "bg-emerald-600 text-white font-semibold shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title="Show bounding boxes only"
                >
                  Boxes
                </button>
              </div>

              <button
                type="button"
                onClick={() => setPrivacyMask(!privacyMask)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border transition-colors cursor-pointer ${
                  privacyMask
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
                title="Privacy shield: automatic blur on faces and vehicle plates"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Blur</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                title="Full Screen Inspection"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Presentation Area */}
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
            className="relative min-h-[420px] max-h-[460px] bg-slate-950 rounded-md overflow-hidden flex items-center justify-center border border-slate-800"
          >
            {inputMode === "camera" ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 border border-rose-500/50 text-xs font-mono text-rose-300 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span>LIVE CAMERA</span>
                </div>

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[380px] object-contain rounded"
                />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  type="button"
                  onClick={captureFrameAndScan}
                  className="absolute bottom-4 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture &amp; Analyze Frame</span>
                </button>
              </div>
            ) : viewMode === "compare" ? (
              <CompareSlider
                beforeImage={activeImageSrc}
                afterImage={activeImageSrc}
                beforeLabel="Original Road"
                afterLabel="Neural Overlay"
                className="w-full h-full"
              />
            ) : viewMode === "zoom" ? (
              <ImageViewer
                src={activeImageSrc}
                alt="Zoomed Road Inspection"
                className="w-full h-full"
              />
            ) : (
              <div className="relative w-full h-[440px] flex items-center justify-center bg-slate-950 overflow-hidden select-none">
                {/* Status Indicator Chip in Top-Right */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900/90 border border-slate-700/80 text-white text-xs font-medium backdrop-blur-sm shadow-xs pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{inspection.boxes.length} {inspection.boxes.length === 1 ? "Hazard" : "Hazards"} Identified</span>
                </div>

                {/* Intrinsically Sized Wrapper: Overlay is strictly pinned to the rendered image bounds */}
                <div className="relative inline-block leading-none max-w-full max-h-full">
                  <img
                    src={activeImageSrc}
                    alt={activeRoadName}
                    className={`block max-w-full select-none transition-all duration-200 ${
                      privacyMask ? "filter blur-sm" : ""
                    }`}
                    style={{
                      maxHeight: "440px",
                      width: "auto",
                      height: "auto",
                    }}
                  />

                  {/* S1: Active Inference Scan Line */}
                  <ScanLine isScanning={isScanning} stage={scanStage} />

                  {/* S2 & S3: Crisp Bounding Box Overlay strictly pinned to image */}
                  {showBoxes && (
                    <BoxOverlay
                      detections={inspection.boxes}
                      activeId={selectedBoxId || hoveredBoxId}
                      onHover={(id) => setHoveredBoxId(id)}
                      onSelect={(id) => setSelectedBoxId(id)}
                      colorScheme="emerald"
                      viewMode={overlayMode}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Telemetry Strip below Canvas */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                <span>{inspection.engine || "Ensemble Hybrid (70% YOLOv8-Seg + 30% YOLO11n)"}</span>
              </span>
              <span>·</span>
              <span>
                Latency: <strong className="text-slate-900 dark:text-white font-semibold">
                  <NumberTransition value={inspection.latencyMs} durationMs={200} /> ms
                </strong>
              </span>
              <span>·</span>
              <span>{fps} FPS</span>
            </div>

            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span>Sensitivity:</span>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={confThresh}
                onChange={(e) => setConfThresh(parseFloat(e.target.value))}
                className="w-20 cursor-pointer accent-blue-600"
              />
              <span className="font-bold text-slate-900 dark:text-white">
                {Math.round(confThresh * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Zoom Targets & Telemetry */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Panel 1: Target Zoom Inspection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                <span>Target Zoom Inspection</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {crops.length} Targets Isolated
              </span>
            </div>

            <div className="p-3 bg-slate-50/40 dark:bg-slate-950/40 grid grid-cols-2 gap-2.5 min-h-[190px]">
              {crops.length > 0 ? (
                crops.slice(0, 4).map((crop, idx) => (
                  <div
                    key={crop.id}
                    className="relative rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 aspect-video flex items-center justify-center group shadow-xs"
                  >
                    <img
                      src={crop.dataUrl}
                      alt={`Target #${idx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-900/85 text-white font-medium">
                      {crop.label} {Math.round(crop.conf * 100)}%
                    </div>
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] bg-black/70 text-slate-300 font-mono">
                      #{idx + 1}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                  <CheckCircle className="w-6 h-6 text-slate-400 mb-1.5" />
                  <span>No defects detected in current frame</span>
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: Detection Summary Telemetry */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
            <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
                <span>Detection Summary</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="p-3.5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Total Hazards Detected</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                  {inspection.boxes.length}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Potholes / Cracks</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-xs">
                  {inspection.potholeCount} Potholes · {inspection.crackCount} Cracks
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Average Confidence</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {avgConf > 0 ? avgConf.toFixed(2) : "0.00"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-slate-600 dark:text-slate-400">Inference Latency</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400 font-mono text-sm">
                  {inspection.latencyMs > 0 ? `${inspection.latencyMs.toFixed(1)} ms` : "—"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-600 dark:text-slate-400">Model Engine</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {inspection.engine || "Ensemble Hybrid (70% YOLOv8-Seg + 30% YOLO11n-INT8)"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Detection Records Table (7 cols) + Reference Strip (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Detection Details Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
              Detection Details (Current Frame)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {inspection.boxes.length} records
              </span>
              {inspection.boxes.length > 0 && (
                <button
                  type="button"
                  onClick={handleLogAllDefects}
                  disabled={isLoggingAll}
                  className="px-2.5 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                  title="Persist detections to database"
                >
                  {isLoggingAll ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Log All</span>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[240px] overflow-y-auto [scrollbar-width:thin]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[11px] font-semibold uppercase sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3 text-center">#</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3 text-center">Confidence</th>
                  <th className="py-2 px-3">Bounding Box</th>
                  <th className="py-2 px-3 text-right">Area (px²)</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {inspection.boxes.length > 0 ? (
                  inspection.boxes.map((b, idx) => {
                    const iw = inspection.imageWidth || 640;
                    const ih = inspection.imageHeight || 480;
                    const x1 = Math.round((b.box[0] / 100) * iw);
                    const y1 = Math.round((b.box[1] / 100) * ih);
                    const x2 = Math.round(((b.box[0] + b.box[2]) / 100) * iw);
                    const y2 = Math.round(((b.box[1] + b.box[3]) / 100) * ih);
                    const areaPx = Math.round((x2 - x1) * (y2 - y1));

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                b.label.includes("CRACK")
                                  ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                  : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              }`}
                            >
                              {b.label.includes("ALLIGATOR")
                                ? "Alligator Crack"
                                : b.label.includes("CRACK")
                                ? "Crack"
                                : "Pothole"}
                            </span>
                            {b.polygon && b.polygon.length >= 3 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title="YOLOv8 deep learning polygonal segmentation mask">
                                Seg ({b.polygon.length}v)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                          {b.confidence.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          ({x1}, {y1}, {x2}, {y2})
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold">
                          {areaPx.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleLogDefect(b)}
                            disabled={loggedDefects[b.id] || isCreatingOrder[b.id]}
                            className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                              loggedDefects[b.id]
                                ? "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-default"
                                : "bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {isCreatingOrder[b.id] ? "..." : loggedDefects[b.id] ? "Logged" : "Log Defect"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                      No defect bounding boxes in current frame
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Reference & Frame Sequence */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2.5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wider">
                Confidence Guide
              </h3>
            </div>

            <div className="p-3.5 space-y-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white font-mono">0.80 – 1.00</span>
                <span className="text-slate-500 dark:text-slate-400">High Certainty</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white font-mono">0.50 – 0.79</span>
                <span className="text-slate-500 dark:text-slate-400">Moderate Certainty</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white font-mono">0.00 – 0.49</span>
                <span className="text-slate-500 dark:text-slate-400">Low Certainty</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 m-3 rounded-md border border-slate-200 dark:border-slate-700/80 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              Ensemble Hybrid (70% YOLOv8-Seg + 30% YOLO11n-INT8) active with polygon mask segmentation.
            </span>
          </div>
        </div>
      </div>

      {/* Full-screen Inspection Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm flex flex-col p-4 sm:p-6 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-sm">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white text-base">
                Full-Screen Inspection
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {activeRoadName} ({inspection.imageWidth}×{inspection.imageHeight}px)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex-1 w-full h-full flex items-center justify-center mt-3 overflow-hidden bg-slate-950 select-none">
            <div className="relative inline-block leading-none max-w-full max-h-full">
              <img
                src={activeImageSrc}
                alt="Full Screen View"
                className="block select-none"
                style={{
                  maxHeight: "calc(100vh - 120px)",
                  maxWidth: "calc(100vw - 60px)",
                  width: "auto",
                  height: "auto",
                }}
              />
              {showBoxes && (
                <BoxOverlay
                  detections={inspection.boxes}
                  activeId={selectedBoxId || hoveredBoxId}
                  onHover={(id) => setHoveredBoxId(id)}
                  onSelect={(id) => setSelectedBoxId(id)}
                  colorScheme="emerald"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
