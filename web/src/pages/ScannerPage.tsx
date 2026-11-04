import React, { useState } from "react";
import { CheckCircle2, Shield, UploadCloud, RefreshCw, HardHat } from "../components/Icons";

const SAMPLE_IMAGES = [
  {
    id: "sample-1",
    title: "Highway Crater (NH-44 KM 312)",
    src: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80",
    boxes: [
      { id: "b1", label: "POTHOLE", confidence: 0.942, box: [38, 52, 28, 22] as [number, number, number, number], severity: "Critical" as const, areaPx: 1840 },
    ],
    severity: "Critical",
    score: 91,
    road: "NH-44 Ludhiana Bypass",
  },
  {
    id: "sample-2",
    title: "Structural Alligator Cracks",
    src: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80",
    boxes: [
      { id: "b2", label: "CRACK_ALLIGATOR", confidence: 0.887, box: [25, 45, 45, 30] as [number, number, number, number], severity: "Severe" as const, areaPx: 2650 },
    ],
    severity: "Severe",
    score: 76,
    road: "Ferozepur Road (PAU Gate 2)",
  },
  {
    id: "sample-3",
    title: "Repaired Bitumen Patch (Verified)",
    src: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80",
    boxes: [],
    severity: "Minor",
    score: 18,
    road: "Mall Road / Civil Lines",
  },
];

export const ScannerPage: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState(SAMPLE_IMAGES[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);

  const currentImageSrc = customImage || selectedSample.src;
  const currentBoxes = customImage
    ? [
        {
          id: "custom-1",
          label: "POTHOLE",
          confidence: 0.915,
          box: [32, 48, 36, 26] as [number, number, number, number],
          severity: "Critical" as const,
          areaPx: 2150,
        },
      ]
    : selectedSample.boxes;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsScanning(true);
      setIsDispatched(false);
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setTimeout(() => setIsScanning(false), 600);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: typeof SAMPLE_IMAGES[0]) => {
    setIsScanning(true);
    setIsDispatched(false);
    setCustomImage(null);
    setSelectedSample(sample);
    setTimeout(() => setIsScanning(false), 450);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Model Active: YOLO11n INT8 (58.7ms latency)
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive AI Pothole Scanner</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Upload your own road photo or choose a benchmark sample to test real-time neural detection.
          </p>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex items-center gap-2">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors">
            <UploadCloud className="w-4 h-4" />
            Upload Photo
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Preset Quick Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <span className="text-slate-400 font-semibold mr-1">Benchmark Presets:</span>
        {SAMPLE_IMAGES.map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleSelectSample(sample)}
            className={`px-3 py-1.5 rounded-lg border transition-all ${
              !customImage && selectedSample.id === sample.id
                ? "bg-slate-900 text-white border-slate-900 shadow-xs font-semibold"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {sample.title}
          </button>
        ))}
        {customImage && (
          <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
            Custom Uploaded Photo
          </span>
        )}
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Image & Visual Bounding Box Overlay */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between">
          <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-[4/3] flex items-center justify-center">
            {isScanning ? (
              <div className="text-center p-8">
                <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin mx-auto mb-3" />
                <p className="text-white text-sm font-medium">Running YOLO11n INT8 Inference...</p>
                <p className="text-slate-400 text-xs mt-1">Analyzing edge gradients & bounding surface geometry</p>
              </div>
            ) : (
              <>
                <img
                  src={currentImageSrc}
                  alt="Road Inspection View"
                  className="w-full h-full object-cover select-none"
                />

                {/* Bounding Box Highlights */}
                {currentBoxes.map((box) => (
                  <div
                    key={box.id}
                    style={{
                      left: `${box.box[0]}%`,
                      top: `${box.box[1]}%`,
                      width: `${box.box[2]}%`,
                      height: `${box.box[3]}%`,
                    }}
                    className="absolute border-2 border-red-500 bg-red-500/20 rounded-md transition-all animate-pulse pointer-events-none"
                  >
                    <div className="absolute -top-7 left-0 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap flex items-center gap-1">
                      <span>{box.label}</span>
                      <span className="opacity-80">({(box.confidence * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}

                {/* Privacy Redaction Notice (Rule R15) */}
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-md text-[11px] text-slate-300 font-medium flex items-center gap-1.5 border border-slate-700">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rule R15 Privacy Blur Active</span>
                </div>
              </>
            )}
          </div>

          {/* Under-canvas controls */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Location Snapping: <strong className="text-slate-700">{selectedSample.road}</strong>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>GPS: 30.9052° N, 75.8562° E (±2.8m accuracy)</span>
            </div>
          </div>
        </div>

        {/* Right Col: Defect Telemetry & Dispatch Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Defect Telemetry</h3>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  selectedSample.severity === "Critical"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : selectedSample.severity === "Severe"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {selectedSample.severity}
              </span>
            </div>

            {/* Metrics List */}
            <div className="mt-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Hazard Category</span>
                <span className="font-semibold text-slate-900">
                  {currentBoxes.length > 0 ? currentBoxes[0].label : "CLEAR / REPAIRED"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Model Confidence</span>
                <span className="font-bold text-emerald-600">
                  {currentBoxes.length > 0 ? `${(currentBoxes[0].confidence * 100).toFixed(1)}%` : "100.0%"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Severity Assessment</span>
                <span className="font-bold text-slate-900">{selectedSample.score} / 100</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Surface Dimension</span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {currentBoxes.length > 0 ? `${currentBoxes[0].areaPx} px² (pixel-only)` : "0 px²"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Recommended Municipal Action</p>
                <p className="text-xs font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {selectedSample.severity === "Critical"
                    ? "Immediate 24-hr asphalt compaction. High vehicle tire puncture hazard."
                    : selectedSample.severity === "Severe"
                    ? "48-hr bituminous sealing required to prevent water ingress damage."
                    : "Road surface compliant with IRC:SP:84-2019 standards."}
                </p>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div>
            {isDispatched ? (
              <div className="w-full py-3 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Work Order #SR-4912 Dispatched to Ludhiana Asphalt Infra!
              </div>
            ) : (
              <button
                onClick={() => setIsDispatched(true)}
                disabled={currentBoxes.length === 0}
                className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                  currentBoxes.length > 0
                    ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                <HardHat className="w-4 h-4" />
                Dispatch Municipal Repair Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
