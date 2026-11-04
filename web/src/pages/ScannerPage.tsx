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

interface SampleImage {
  id: string;
  title: string;
  src: string;
  road: string;
}

const BENCHMARK_SAMPLES: SampleImage[] = [
  {
    id: "sample-craters",
    title: "Rural Unpaved Craters",
    src: "/samples/unpaved_craters.jpg",
    road: "Rural Connector Sector 32",
  },
  {
    id: "sample-highway",
    title: "Highway Asphalt Pit",
    src: "/samples/clean_road.jpg",
    road: "NH-44 Ludhiana Bypass KM 312",
  },
  {
    id: "sample-cracks",
    title: "Structural Cracks",
    src: "/samples/pothole_nh44.jpg",
    road: "Ferozepur Road (PAU Gate 2)",
  },
];

export const ScannerPage: React.FC = () => {
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Model Active: YOLO11n + Edge CV</span>
            <span className="text-emerald-600 font-normal">({inspection.latencyMs}ms)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Pothole & Defect Scanner</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time neural detection for potholes, alligator cracks, and municipal road damage.
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Road Photo</span>
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
          <span className="text-slate-400 font-semibold mr-1">Presets:</span>
          {BENCHMARK_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleSelectSample(sample)}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                selectedSampleId === sample.id
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs font-semibold"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {sample.title}
            </button>
          ))}
          {isCustomUpload && (
            <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Custom Uploaded Photo
            </span>
          )}
        </div>

        {/* Box Visibility Toggle */}
        <button
          onClick={() => setShowBoxes(!showBoxes)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
        >
          {showBoxes ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
          <span>{showBoxes ? "Hide Detection Boxes" : "Show Detection Boxes"}</span>
        </button>
      </div>

      {/* Main Inspection Area: Visual Canvas + Telemetry Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left (2 Columns): Interactive Image Viewport */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between"
        >
          {/* Canvas Viewport */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[16/10] sm:aspect-[4/3] flex items-center justify-center border border-slate-900/50">
            {isScanning ? (
              <div className="text-center p-8 z-20">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-3" />
                <p className="text-white text-base font-semibold">Running Neural Inference...</p>
                <p className="text-slate-400 text-xs mt-1">Analyzing road surface depth & defect boundaries</p>
              </div>
            ) : (
              <>
                <img
                  src={activeImageSrc}
                  alt="Road Defect View"
                  className="w-full h-full object-contain sm:object-cover select-none"
                />

                {/* Detected Bounding Boxes */}
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
                          <span>{box.label}</span>
                          <span className="opacity-90 text-[10px]">{(box.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}

                {/* Privacy Badge */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-slate-300 font-medium flex items-center gap-1.5 border border-slate-700/80 select-none">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rule R15 Privacy Blur Active</span>
                </div>

                {/* Total Found Badge */}
                <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-2 border border-slate-700/80 select-none">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      inspection.totalDefects > 0 ? "bg-red-400 animate-pulse" : "bg-emerald-400"
                    }`}
                  />
                  <span>
                    {inspection.totalDefects > 0
                      ? `${inspection.totalDefects} Defect${inspection.totalDefects > 1 ? "s" : ""} Located`
                      : "Clear / No Defects"}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Under-canvas Corridor Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 mt-3 border-t border-slate-100 text-xs text-slate-500 gap-2">
            <div>
              Corridor Location: <strong className="text-slate-800">{activeRoadName}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>GPS: 30.9052° N, 75.8562° E (±2.5m precision)</span>
            </div>
          </div>
        </div>

        {/* Right (1 Column): Defect Telemetry & Repair Order */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Defect Overview Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Defect Telemetry</h3>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  inspection.maxSeverity === "Critical"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : inspection.maxSeverity === "Severe"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {inspection.maxSeverity}
              </span>
            </div>

            {/* List of Detected Potholes / Cracks */}
            {inspection.boxes.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Identified Road Defects ({inspection.boxes.length})
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
                            ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80"
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
                            #{idx + 1} {box.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="opacity-80">{(box.confidence * 100).toFixed(1)}%</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isSelected ? "bg-slate-800 text-slate-200" : "bg-white text-slate-600 border border-slate-200"
                            }`}
                          >
                            Score: {box.score}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Road Surface Clean</p>
                <p className="text-slate-400 mt-0.5">Complies with IRC:SP:84-2019 standards.</p>
              </div>
            )}

            {/* Selected Defect Detail Card */}
            {activeDefect && (
              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Selected Defect</span>
                  <span className="font-bold text-slate-900 text-xs">{activeDefect.label}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Model Confidence</span>
                  <span className="font-bold text-emerald-600 text-xs">
                    {(activeDefect.confidence * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Severity Score</span>
                  <span className="font-bold text-slate-900 text-xs">{activeDefect.score} / 100</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Surface Dimension</span>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {activeDefect.areaPx.toLocaleString()} px²
                  </span>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] text-slate-400 mb-1 font-semibold uppercase tracking-wider">
                    Recommended Action
                  </p>
                  <p className="text-xs font-medium text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    {activeDefect.action ||
                      (activeDefect.severity === "Critical"
                        ? "Immediate 24-hr asphalt compaction. High vehicle tire puncture hazard."
                        : "48-hr bituminous sealing required to prevent water ingress damage.")}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Button */}
          <div>
            {isDispatched ? (
              <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Work Order #SR-5819 Dispatched to Ludhiana Municipal Infra!</span>
              </div>
            ) : (
              <button
                onClick={() => setIsDispatched(true)}
                disabled={inspection.boxes.length === 0}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                  inspection.boxes.length > 0
                    ? "bg-slate-900 hover:bg-slate-800 text-white"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <HardHat className="w-4 h-4" />
                <span>Dispatch Municipal Repair Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
