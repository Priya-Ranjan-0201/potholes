import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  Shield,
  UploadCloud,
  RefreshCw,
  HardHat,
  Eye,
  EyeOff,
  Sparkles,
} from "../components/Icons";
import { detectDefects, InspectionResult } from "../utils/cvDetector";
import { useLanguage } from "../context/LanguageContext";

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
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-md transition-colors">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{t("ircCompliantBadge")}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
              <span>{t("modelActive")} ({inspection.latencyMs}ms)</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t("scannerTitle")}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t("scannerSubtitle")}
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all cursor-pointer border border-amber-400/40 active:scale-98"
          >
            <UploadCloud className="w-4 h-4 text-white" />
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
          <span className="text-slate-500 dark:text-slate-400 font-bold mr-1">{t("presetsLabel")}</span>
          {BENCHMARK_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                selectedSampleId === sample.id
                  ? "bg-slate-900 dark:bg-amber-600 text-white border-slate-900 dark:border-amber-500 shadow-sm font-bold"
                  : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {t(sample.titleKey) || sample.defaultTitle}
            </button>
          ))}
          {isCustomUpload && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold inline-flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {t("customUploadPhoto")}
            </span>
          )}
        </div>

        {/* Box Visibility Toggle */}
        <button
          onClick={() => setShowBoxes(!showBoxes)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer font-bold"
        >
          {showBoxes ? <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          <span>{showBoxes ? t("hideBoxes") : t("showBoxes")}</span>
        </button>
      </div>

      {/* Main Inspection Area: Visual Canvas + Telemetry Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left (2 Columns): Interactive Image Viewport */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="lg:col-span-2 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-md flex flex-col justify-between transition-colors"
        >
          {/* Canvas Viewport */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 min-h-[420px] max-h-[600px] flex items-center justify-center border border-slate-900/50 p-2 sm:p-4">
            {isScanning ? (
              <div className="text-center p-8 z-20">
                <RefreshCw className="w-10 h-10 text-amber-400 animate-spin mx-auto mb-3" />
                <p className="text-white text-base font-bold">Running Neural Inference...</p>
                <p className="text-slate-400 text-xs mt-1">Analyzing road surface depth & defect boundaries</p>
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

                    const badgeColor = isCrit
                      ? "bg-red-600 text-white"
                      : isSev
                      ? "bg-amber-600 text-white"
                      : "bg-emerald-600 text-white";

                    return (
                      <div
                        key={box.id}
                        onClick={() => setSelectedBoxId(box.id)}
                        style={{
                          left: `${box.box[0]}%`,
                          top: `${box.box[1]}%`,
                          width: `${box.box[2]}%`,
                          height: `${box.box[3]}%`,
                        }}
                        className={`absolute border-2 rounded-lg transition-all cursor-pointer shadow-md ${borderColor} ${
                          isSelected ? "ring-4 ring-white/90 scale-[1.01] z-10" : "opacity-90 hover:opacity-100"
                        }`}
                      >
                        {/* Box Pill Header */}
                        <div
                          className={`absolute -top-7 left-0 text-[11px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap flex items-center gap-1.5 ${badgeColor}`}
                        >
                          <span>{box.label === "POTHOLE" ? t("potholeLabel") : box.label}</span>
                          <span className="opacity-90 text-[10px]">{(box.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Privacy Badge */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-slate-300 font-medium flex items-center gap-1.5 border border-slate-700 select-none z-10">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t("privacyActive")}</span>
            </div>

            {/* Total Found Badge */}
            <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-2 border border-slate-700 select-none z-10">
              <span
                className={`w-2 h-2 rounded-full ${
                  inspection.totalDefects > 0 ? "bg-red-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              <span>
                {inspection.totalDefects > 0
                  ? `${inspection.totalDefects} ${t("defectsLocated")}`
                  : t("clearRoad")}
              </span>
            </div>
          </div>

          {/* Under-canvas Corridor Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div>
              {t("corridorLoc")} <strong className="text-slate-800 dark:text-slate-200">{activeRoadName}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{t("gpsPrecision")}</span>
            </div>
          </div>
        </div>

        {/* Right (1 Column): Defect Telemetry & Repair Order */}
        <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 shadow-md flex flex-col justify-between space-y-6 transition-colors">
          <div className="space-y-4">
            {/* Defect Overview Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{t("telemetryTitle")}</h3>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  inspection.maxSeverity === "Critical"
                    ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                    : inspection.maxSeverity === "Severe"
                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {inspection.maxSeverity}
              </span>
            </div>

            {/* List of Detected Potholes / Cracks */}
            {inspection.boxes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {t("defectsLocated")} ({inspection.boxes.length})
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {inspection.boxes.map((box, idx) => {
                    const isSelected = box.id === (selectedBoxId || inspection.boxes[0].id);
                    return (
                      <div
                        key={box.id}
                        onClick={() => setSelectedBoxId(box.id)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-900 dark:bg-amber-600 text-white border-slate-900 dark:border-amber-500 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              box.severity === "Critical"
                                ? "bg-red-500"
                                : box.severity === "Severe"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                          />
                          <span className="font-semibold">
                            #{idx + 1}{" "}
                            {box.label === "POTHOLE"
                              ? t("potholeLabel")
                              : box.label === "CRACK_LONG"
                              ? t("crackLongLabel")
                              : t("crackTransLabel")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="opacity-80">{(box.confidence * 100).toFixed(1)}%</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isSelected ? "bg-slate-800 dark:bg-amber-700 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600"
                            }`}
                          >
                            {t("scoreLabel")}: {box.score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">{t("cleanSurfaceTitle")}</p>
                <p className="text-slate-400 dark:text-slate-500 mt-0.5">{t("cleanSurfaceDesc")}</p>
              </div>
            )}

            {/* Selected Defect Detail Card */}
            {activeDefect && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{t("selectedDefect")}</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {activeDefect.label === "POTHOLE" ? t("potholeLabel") : activeDefect.label}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{t("modelConfidence")}</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                    {(activeDefect.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{t("severityScore")}</span>
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{activeDefect.score} / 100</span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">{t("estRepairCost")}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block">*Illustrative rate card</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                    ₹{(Math.max(activeDefect.score * 55, 1850)).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 text-xs">{t("surfaceArea")}</span>
                  <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {activeDefect.areaPx.toLocaleString()} px²
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 mb-1 font-bold uppercase tracking-wider flex items-center justify-between">
                    <span>{t("recommendedAction")}</span>
                    <span className="text-slate-500 font-mono text-[10px]">IRC:82 Inspired</span>
                  </p>
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700 leading-relaxed">
                    {activeDefect.severity === "Critical"
                      ? t("actionColdMix")
                      : t("actionSealing")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Button */}
          <div>
            {isDispatched ? (
              <div className="w-full py-3 px-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-center text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{t("workOrderDispatched")}</span>
              </div>
            ) : (
              <button
                onClick={() => setIsDispatched(true)}
                disabled={inspection.boxes.length === 0}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  inspection.boxes.length > 0
                    ? "bg-slate-900 dark:bg-amber-600 hover:bg-slate-800 dark:hover:bg-amber-500 active:scale-98 text-white border border-amber-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                }`}
              >
                <HardHat className="w-4 h-4 text-amber-400 dark:text-white" />
                <span>{t("dispatchWorkOrderBtn")}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
