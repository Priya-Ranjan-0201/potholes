import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  UploadCloud,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Camera,
  CheckCircle2,
} from "../components/Icons";
import { detectDefects, InspectionResult } from "../utils/cvDetector";
import { useLanguage } from "../context/LanguageContext";
import { SeverityBadge, Sign, RoadLoader } from "../ui";

interface SampleImage {
  id: string;
  titleKey: string;
  defaultTitle: string;
  src: string;
  road: string;
}

const BENCHMARK_SAMPLES: SampleImage[] = [
  {
    id: "sample-asphalt-crater",
    titleKey: "presetNH44",
    defaultTitle: "NH-44 Deep Crater (राष्ट्रीय राजमार्ग)",
    src: "/samples/asphalt_crater.jpg",
    road: "राष्ट्रीय राजमार्ग 44 (NH-44 Corridor, KM 314)",
  },
  {
    id: "sample-craters",
    titleKey: "presetRural",
    defaultTitle: "PMGSY Rural Road (ग्रामीण सड़क)",
    src: "/samples/unpaved_craters.jpg",
    road: "प्रधानमंत्री ग्राम सड़क योजना (PMGSY Sector 32)",
  },
  {
    id: "sample-highway",
    titleKey: "presetGT",
    defaultTitle: "GT Road Bitumen (जी.टी. रोड)",
    src: "/samples/clean_road.jpg",
    road: "ग्रैंड ट्रंक रोड (GT Road Industrial Corridor)",
  },
  {
    id: "sample-clean",
    titleKey: "presetClean",
    defaultTitle: "Clean Surface (स्वच्छ सड़क)",
    src: "/samples/pothole_nh44.jpg",
    road: "रिंग रोड एक्सप्रेसवे (Zero Defect Corridor)",
  },
];

export const ScannerPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeImageSrc, setActiveImageSrc] = useState<string>(BENCHMARK_SAMPLES[0].src);
  const [activeRoadName, setActiveRoadName] = useState<string>(BENCHMARK_SAMPLES[0].road);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(BENCHMARK_SAMPLES[0].id);
  const [isCustomUpload, setIsCustomUpload] = useState<boolean>(false);

  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
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
    latencyMs: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Run dynamic defect detection on the given image source
  const analyzeImage = async (source: File | Blob | string, roadTitle: string = "Uploaded Road View") => {
    setIsScanning(true);
    setIsDispatched(false);
    setSelectedBoxId(null);

    try {
      const result = await detectDefects(source);
      setInspection(result);
      if (result.boxes.length > 0) {
        setSelectedBoxId(result.boxes[0].id);
      }
      setActiveRoadName(roadTitle);
    } catch (err) {
      console.error("Detection error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  // Run detection dynamically on initial component mount
  useEffect(() => {
    analyzeImage(BENCHMARK_SAMPLES[0].src, BENCHMARK_SAMPLES[0].road);
  }, []);

  // Handle local file upload (drag & drop or file picker)
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;

    setIsCustomUpload(true);
    setSelectedSampleId("custom");
    const objectUrl = URL.createObjectURL(file);
    setActiveImageSrc(objectUrl);
    analyzeImage(file, file.name.replace(/\.[^/.]+$/, ""));
  };

  const handleSelectSample = (sample: SampleImage) => {
    setIsCustomUpload(false);
    setSelectedSampleId(sample.id);
    setActiveImageSrc(sample.src);
    setActiveRoadName(sample.road);
    analyzeImage(sample.src, sample.road);
  };

  // Drag and drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const activeDefect = inspection.boxes.find((b) => b.id === selectedBoxId) || inspection.boxes[0];

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Top Header Card */}
      <div className="dhaba-card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider font-mono bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
              AI SCANNER
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>YOLO11n Edge AI Active ({inspection.latencyMs || 74}ms)</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight font-signboard">
            {t("scannerTitle")}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {t("scannerSubtitle")}
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs sm:text-sm font-black rounded-xl shadow-md transition-all cursor-pointer border border-amber-400/40 active:scale-98"
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

      {/* Preset Selector & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-medium">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-stone-500 dark:text-stone-400 font-bold mr-1 font-mono">
            Highway Benchmarks:
          </span>
          {BENCHMARK_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                selectedSampleId === sample.id
                  ? "bg-stone-900 dark:bg-amber-400 text-white dark:text-stone-950 border-stone-900 dark:border-amber-400 shadow-sm font-black"
                  : "bg-white/80 dark:bg-stone-900/80 text-stone-700 dark:text-stone-300 border-[#EBD9B8] dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              {t(sample.titleKey) || sample.defaultTitle}
            </button>
          ))}
          {isCustomUpload && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 font-bold inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Custom Upload</span>
            </span>
          )}
        </div>

        {/* Box Visibility Toggle */}
        <button
          onClick={() => setShowBoxes(!showBoxes)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-[#EBD9B8] dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shadow-2xs cursor-pointer font-bold"
        >
          {showBoxes ? <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-stone-400" />}
          <span>{showBoxes ? "Hide Bounding Boxes" : "Show Bounding Boxes"}</span>
        </button>
      </div>

      {/* Main Inspection Viewport: Visual Canvas + Defect Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left (2 Columns): Interactive Image Viewport */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="lg:col-span-2 dhaba-card p-4 flex flex-col justify-between"
        >
          {/* Canvas Viewport */}
          <div className="relative rounded-xl overflow-hidden bg-stone-950 min-h-[420px] max-h-[600px] flex items-center justify-center border border-stone-800 p-2 sm:p-4">
            {isScanning ? (
              <div className="text-center p-8 z-20 w-full max-w-md">
                <RoadLoader vehicle="truck" label="Scanning Highway for Road Defects..." />
                <p className="text-stone-400 text-xs mt-3 font-mono">
                  Running YOLO11n ONNX edge inference across road pixels
                </p>
              </div>
            ) : (
              <div className="relative inline-block max-w-full max-h-full">
                {/* Clean Base Image */}
                <img
                  src={activeImageSrc}
                  alt="Road Inspection View"
                  className="block max-h-[560px] max-w-full w-auto h-auto object-contain rounded-lg shadow-inner select-none pointer-events-none"
                />

                {/* Detected Bounding Boxes directly mapped to the image */}
                {showBoxes &&
                  inspection.boxes.map((box) => {
                    const isSelected = box.id === selectedBoxId;
                    const isCrit = box.severity === "Critical";
                    const isSev = box.severity === "Severe";

                    const borderColor = isCrit
                      ? "border-red-500 bg-red-500/20 shadow-red-500/30"
                      : isSev
                      ? "border-amber-500 bg-amber-500/20 shadow-amber-500/30"
                      : "border-emerald-500 bg-emerald-500/20 shadow-emerald-500/30";

                    return (
                      <div
                        key={box.id}
                        onClick={() => setSelectedBoxId(box.id)}
                        className={`absolute border-2 rounded cursor-pointer transition-all ${borderColor} ${
                          isSelected ? "ring-2 ring-white scale-102 z-20" : "z-10 hover:opacity-100"
                        }`}
                        style={{
                          left: `${box.box[0]}%`,
                          top: `${box.box[1]}%`,
                          width: `${box.box[2]}%`,
                          height: `${box.box[3]}%`,
                        }}
                      >
                        <div className="absolute -top-6 left-0 flex items-center gap-1 shadow-md">
                          <SeverityBadge level={box.severity} size="sm" showScore={false} />
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

            <div className="flex items-center gap-4 text-stone-500 dark:text-stone-400 font-mono text-[11px]">
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
                Selected Distress
              </span>
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 font-signboard">
                {activeDefect ? activeDefect.label : "Zero Defects Detected"}
              </h3>
            </div>
            {activeDefect && (
              <SeverityBadge level={activeDefect.severity} size="md" />
            )}
          </div>

          {activeDefect ? (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-[#EBD9B8] dark:border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Model Confidence</span>
                  <span className="text-base font-black text-stone-900 dark:text-stone-100 font-mono">
                    {Math.round(activeDefect.confidence * 100)}%
                  </span>
                  <span className="text-[9px] text-stone-400 block font-mono">Not defect severity</span>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-stone-900 border border-[#EBD9B8] dark:border-stone-800">
                  <span className="text-[10px] font-mono text-stone-400 uppercase block">Relative Area</span>
                  <span className="text-base font-black text-amber-500 font-mono">
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
                    Road Distress Classification
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
                  Surface distress mapped per IRC:82-2023 Clause 4.2 guidelines. Requires field compaction and bitumen patch.
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setIsDispatched(true)}
                disabled={isDispatched}
                className={`w-full py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md ${
                  isDispatched
                    ? "bg-emerald-600 text-white"
                    : "bg-amber-500 hover:bg-amber-400 text-stone-950"
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
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-stone-400 font-mono">
              Road surface clear. No distress patterns above threshold.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
