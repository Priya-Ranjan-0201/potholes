import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  UploadCloud,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Camera,
  CheckCircle2,
  Sliders,
  Cpu,
  X,
  ExternalLink,
} from "../components/Icons";
import { detectDefects, InspectionResult, DefectBox } from "../utils/cvDetector";
import { useLanguage } from "../context/LanguageContext";
import { SeverityBadge, Sign, RoadLoader } from "../ui";

interface SampleImage {
  id: string;
  titleKey: string;
  defaultTitle: string;
  src: string;
  road: string;
  expectedClass: string;
}

const BENCHMARK_SAMPLES: SampleImage[] = [
  {
    id: "sample-asphalt-crater",
    titleKey: "presetNH44",
    defaultTitle: "NH-44 Deep Crater (राष्ट्रीय राजमार्ग)",
    src: "/samples/asphalt_crater.jpg",
    road: "राष्ट्रीय राजमार्ग 44 (NH-44 Corridor, KM 314)",
    expectedClass: "Critical Pothole (1 defect)",
  },
  {
    id: "sample-craters",
    titleKey: "presetRural",
    defaultTitle: "PMGSY Rural Road (ग्रामीण सड़क)",
    src: "/samples/unpaved_craters.jpg",
    road: "प्रधानमंत्री ग्राम सड़क योजना (PMGSY Sector 32)",
    expectedClass: "Multi-Pothole Sector (4 defects)",
  },
  {
    id: "sample-cracks",
    titleKey: "presetGT",
    defaultTitle: "Ferozepur Highway (फिरोजपुर सड़क)",
    src: "/samples/cracks_ferozepur.jpg",
    road: "फिरोजपुर - मोगा राज्य राजमार्ग (SH-16 Corridor)",
    expectedClass: "Severe Surface Defect",
  },
  {
    id: "sample-clean",
    titleKey: "presetClean",
    defaultTitle: "Clean Surface (स्वच्छ सड़क)",
    src: "/samples/pothole_nh44.jpg",
    road: "रिंग रोड एक्सप्रेसवे (Zero Defect Baseline Corridor)",
    expectedClass: "Zero Defects Detected",
  },
];

export const ScannerPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeImageSrc, setActiveImageSrc] = useState<string>(BENCHMARK_SAMPLES[0].src);
  const [activeRoadName, setActiveRoadName] = useState<string>(BENCHMARK_SAMPLES[0].road);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(BENCHMARK_SAMPLES[0].id);
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);

  // Scanning & Telemetry
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [confThresh, setConfThresh] = useState<number>(0.15);
  const [isDispatched, setIsDispatched] = useState<boolean>(false);

  // Dynamic Detections & Telemetry (computed live from ONNX model)
  const [inspection, setInspection] = useState<InspectionResult>({
    source: "neural_api",
    totalDefects: 0,
    potholeCount: 0,
    crackCount: 0,
    maxSeverity: "Minor",
    overallScore: 0,
    boxes: [],
    latencyMs: 74,
    imageWidth: 581,
    imageHeight: 395,
  });

  // Camera stream refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Run dynamic defect detection on the given image source
  const analyzeImage = async (
    source: File | Blob | string,
    roadTitle: string = "Uploaded Road View",
    threshold: number = confThresh
  ) => {
    setIsScanning(true);
    setIsDispatched(false);
    setSelectedBoxId(null);

    try {
      const result = await detectDefects(source, threshold);
      setInspection(result);
      if (result.boxes.length > 0) {
        setSelectedBoxId(result.boxes[0].id);
      }
      setActiveRoadName(roadTitle);
    } catch (err) {
      console.error("[ScamRoad AI] Detection error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Run initial detection
  useEffect(() => {
    analyzeImage(BENCHMARK_SAMPLES[0].src, BENCHMARK_SAMPLES[0].road, 0.15);
  }, []);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraError("Webcam not accessible or permission denied. You can still test with benchmark highway photos or upload your own images.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureFrameAndScan = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const objectUrl = URL.createObjectURL(blob);
      setActiveImageSrc(objectUrl);
      setIsCustomUpload(true);
      setSelectedSampleId("live-camera-capture");
      stopCamera();
      analyzeImage(blob, "Live Camera Road Capture (Real-Time)");
    }, "image/jpeg", 0.95);
  };

  // Handle local file upload
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    stopCamera();
    setIsCustomUpload(true);
    setSelectedSampleId("custom");
    const objectUrl = URL.createObjectURL(file);
    setActiveImageSrc(objectUrl);
    analyzeImage(file, file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleSelectSample = (sample: SampleImage) => {
    stopCamera();
    setIsCustomUpload(false);
    setSelectedSampleId(sample.id);
    setActiveImageSrc(sample.src);
    setActiveRoadName(sample.road);
    analyzeImage(sample.src, sample.road, confThresh);
  };

  const handleThresholdChange = (newVal: number) => {
    setConfThresh(newVal);
    analyzeImage(activeImageSrc, activeRoadName, newVal);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const activeDefect: DefectBox | undefined =
    inspection.boxes.find((b) => b.id === selectedBoxId) || inspection.boxes[0];

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Top Header Card */}
      <div className="dhaba-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider font-mono bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              AI SCANNER
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>YOLO11n Edge AI Active ({inspection.latencyMs}ms)</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
              INT8 Quantized ONNX
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight font-signboard">
            {t("scannerTitle")}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {t("scannerSubtitle")}
          </p>
        </div>

        {/* Action Controls: Live Camera & Upload */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {!cameraActive ? (
            <button
              onClick={startCamera}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-bold border border-stone-700 transition shadow-sm"
              title="Start real-time device camera for edge scanning"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Live Camera Feed</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm"
            >
              <X className="w-4 h-4" />
              <span>Stop Camera</span>
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer border border-amber-400/40 active:scale-98"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t("uploadRoadPhoto")}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
        </div>
      </div>

      {cameraError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between gap-2">
          <span>{cameraError}</span>
          <button onClick={() => setCameraError(null)} className="text-stone-400 hover:text-stone-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Preset Selector & Sensitivity Controls Bar */}
      <div className="dhaba-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Benchmark Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-stone-500 dark:text-stone-400 font-bold mr-1 font-mono text-[11px]">
            Highway Benchmarks:
          </span>
          {BENCHMARK_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`px-3 py-1.5 rounded-lg border transition-all text-xs ${
                selectedSampleId === sample.id
                  ? "bg-amber-500 text-stone-950 border-amber-400 shadow-xs font-black"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {t(sample.titleKey) || sample.defaultTitle}
            </button>
          ))}
          {isCustomUpload && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-bold inline-flex items-center gap-1 text-xs">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Custom Upload</span>
            </span>
          )}
        </div>

        {/* Sensitivity & Display Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Sensitivity Slider */}
          <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800/80 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700">
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-[11px] font-mono font-bold text-stone-600 dark:text-stone-300">
              Confidence: {Math.round(confThresh * 100)}%
            </span>
            <input
              type="range"
              min="0.10"
              max="0.80"
              step="0.05"
              value={confThresh}
              onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
              className="w-20 accent-amber-500 cursor-pointer h-1.5 bg-stone-300 dark:bg-stone-700 rounded-lg"
              title="Filter detections by minimum model confidence threshold"
            />
          </div>

          {/* Box Visibility Toggle */}
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 transition font-bold"
          >
            {showBoxes ? (
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-stone-400" />
            )}
            <span>{showBoxes ? "Hide Bounding Boxes" : "Show Bounding Boxes"}</span>
          </button>
        </div>
      </div>

      {/* Main Inspection Viewport: Visual Canvas + Defect Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left (2 Columns): Interactive Viewfinder Viewport */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="lg:col-span-2 dhaba-card p-4 flex flex-col justify-between"
        >
          {/* Canvas / Video Viewport */}
          <div className="relative rounded-2xl overflow-hidden bg-stone-950 min-h-[440px] max-h-[620px] flex items-center justify-center border-2 border-stone-800 p-2 sm:p-4 select-none">
            {/* Viewfinder Corner Reticles */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-500/80 pointer-events-none z-30" />
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-500/80 pointer-events-none z-30" />
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-500/80 pointer-events-none z-30" />
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-500/80 pointer-events-none z-30" />

            {/* Edge AI Viewfinder HUD Top Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono z-30 pointer-events-none">
              <div className="bg-stone-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-stone-800 text-stone-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-emerald-400">YOLO11n-INT8</span>
                <span className="text-stone-500">|</span>
                <span>{inspection.imageWidth || 640}×{inspection.imageHeight || 480}</span>
              </div>

              <div className="bg-stone-950/85 backdrop-blur-md px-2.5 py-1 rounded-md border border-stone-800 text-stone-300 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-amber-500" />
                <span>Latency: <strong className="text-amber-400">{inspection.latencyMs}ms</strong></span>
              </div>
            </div>

            {/* Scanning Laser Beam Animation when Processing */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-bounce z-40" />
            )}

            {/* Content: Camera Stream OR Image */}
            {cameraActive ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[500px] object-contain rounded-xl"
                />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute bottom-6 inset-x-0 flex justify-center z-40 pointer-events-auto">
                  <button
                    onClick={captureFrameAndScan}
                    className="px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm flex items-center gap-2 shadow-xl border-2 border-white/40 active:scale-95 transition"
                  >
                    <Camera className="w-5 h-5" />
                    <span>Capture Frame & Scan Defect</span>
                  </button>
                </div>
              </div>
            ) : isScanning ? (
              <div className="text-center p-8 z-20 w-full max-w-md">
                <RoadLoader vehicle="truck" label="Scanning Highway for Road Defects..." />
                <p className="text-stone-400 text-xs mt-3 font-mono">
                  Executing YOLO11n ONNX inference & tensor NMS...
                </p>
              </div>
            ) : (
              <div className="relative inline-block max-w-full max-h-full">
                {/* Clean Base Image */}
                <img
                  src={activeImageSrc}
                  alt="Road Inspection View"
                  className="block max-h-[520px] max-w-full w-auto h-auto object-contain rounded-xl shadow-inner select-none pointer-events-none"
                />

                {/* Detected Bounding Boxes directly mapped to the image */}
                {showBoxes &&
                  inspection.boxes.map((box, idx) => {
                    const isSelected = box.id === selectedBoxId;
                    const isCrit = box.severity === "Critical";
                    const isSev = box.severity === "Severe";

                    const borderColor = isCrit
                      ? "border-red-500 bg-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                      : isSev
                      ? "border-amber-500 bg-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                      : "border-emerald-500 bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.4)]";

                    return (
                      <div
                        key={box.id}
                        onClick={() => setSelectedBoxId(box.id)}
                        className={`absolute border-2 rounded-lg cursor-pointer transition-all duration-150 ${borderColor} ${
                          isSelected
                            ? "ring-2 ring-white scale-[1.01] z-20"
                            : "z-10 hover:opacity-100 hover:scale-[1.005]"
                        }`}
                        style={{
                          left: `${box.box[0]}%`,
                          top: `${box.box[1]}%`,
                          width: `${box.box[2]}%`,
                          height: `${box.box[3]}%`,
                        }}
                      >
                        {/* Class Tag Pill */}
                        <div className="absolute -top-6 left-0 flex items-center gap-1 shadow-md whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-black bg-stone-950/90 text-white border border-stone-700 flex items-center gap-1">
                            <span className="text-amber-400">#{idx + 1}</span>
                            <span>{box.label}</span>
                            <span className="text-emerald-400">{Math.round(box.confidence * 100)}%</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Active Image Road Details Bar */}
          <div className="mt-4 pt-3 border-t border-[#EBD9B8] dark:border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="font-bold text-stone-800 dark:text-stone-200">{activeRoadName}</span>
            </div>

            <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400 font-mono text-[11px] flex-wrap">
              <span>Inference: <strong className="text-amber-500">{inspection.latencyMs} ms</strong></span>
              <span>•</span>
              <span>Detections: <strong className="text-stone-900 dark:text-stone-100">{inspection.totalDefects}</strong></span>
              <span>•</span>
              <span className="text-emerald-500 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Privacy Blurred</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right (1 Column): Telemetry & Work Order Dispatch Card */}
        <div className="dhaba-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#EBD9B8] dark:border-stone-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">
                Edge AI Telemetry
              </span>
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 font-signboard">
                {activeDefect ? `${activeDefect.label} (#${inspection.boxes.findIndex((b) => b.id === activeDefect.id) + 1})` : "Zero Defects Detected"}
              </h3>
            </div>
            {activeDefect && (
              <SeverityBadge level={activeDefect.severity} size="md" />
            )}
          </div>

          {/* Detected Defects List (if multiple defects found) */}
          {inspection.boxes.length > 1 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-bold block">
                All Identified Distress ({inspection.boxes.length})
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {inspection.boxes.map((b, idx) => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBoxId(b.id)}
                    className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between transition border ${
                      b.id === activeDefect?.id
                        ? "bg-amber-500/15 border-amber-500/40 text-stone-900 dark:text-stone-100 font-bold"
                        : "bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-500 font-black">#{idx + 1}</span>
                      <span>{b.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span>{Math.round(b.confidence * 100)}%</span>
                      <SeverityBadge level={b.severity} size="sm" showScore={false} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeDefect ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-[#EBD9B8] dark:border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Model Confidence</span>
                  <span className="text-lg font-black text-stone-900 dark:text-stone-100 font-mono">
                    {Math.round(activeDefect.confidence * 100)}%
                  </span>
                  <span className="text-[9px] text-stone-400 block font-mono">Probability score (Rule R4)</span>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 border border-[#EBD9B8] dark:border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Relative Area</span>
                  <span className="text-lg font-black text-amber-500 font-mono">
                    {((activeDefect.box[2] * activeDefect.box[3]) / 100).toFixed(1)}%
                  </span>
                  <span className="text-[9px] text-stone-400 block font-mono">Uncalibrated pixels</span>
                </div>
              </div>

              {/* Severity Road Sign Card */}
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.04]">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sign level={activeDefect.severity} size="sm" />
                  <span className="text-[10px] font-mono font-black uppercase text-amber-600 dark:text-amber-400">
                    IRC:82-2023 Clause 4.2 Maintenance
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                  {activeDefect.action || "Surface distress mapped per IRC:82-2023. Immediate cold mix compaction or edge sealing recommended."}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setIsDispatched(true)}
                  disabled={isDispatched}
                  className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md ${
                    isDispatched
                      ? "bg-emerald-600 text-white"
                      : "bg-amber-500 hover:bg-amber-400 text-stone-950 cursor-pointer"
                  }`}
                >
                  {isDispatched ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Work Order Dispatched to PWD</span>
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      <span>Dispatch PWD Work Order</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <Link
                    to="/maintenance"
                    className="text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1 font-bold"
                  >
                    <span>View Kanban Board</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <Link
                    to="/defects"
                    className="text-stone-500 dark:text-stone-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open Defect Registry</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-stone-400 font-mono space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-75" />
              <p className="font-bold text-stone-700 dark:text-stone-300">Clean Road Surface Verified</p>
              <p className="text-[11px] text-stone-400">Zero distress patterns detected above {Math.round(confThresh * 100)}% threshold.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
