import React, { useState } from "react";
import { Eye, Sliders, ShieldCheck, Layers } from "../components/Icons";

export const InspectionPage: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [showMasks, setShowMasks] = useState<boolean>(true);
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [selectedDefectIdx, setSelectedDefectIdx] = useState<number>(0);

  const sampleDetections = [
    {
      id: "det-01",
      class_code: "POTHOLE",
      confidence: 0.942, // Rule R5: separate confidence
      severity_score: 82.5, // Rule R5: separate severity
      severity_level: "CRITICAL",
      relative_area_pct: 6.84, // Rule R4: relative area %
      pixel_area: 19840,
      calibrated: false,
      box: { x: 32, y: 55, w: 26, h: 22 },
      polygon: "32,55 58,57 56,77 30,75",
    },
    {
      id: "det-02",
      class_code: "CRACK_LONG",
      confidence: 0.814,
      severity_score: 41.2,
      severity_level: "MODERATE",
      relative_area_pct: 2.15,
      pixel_area: 6240,
      calibrated: false,
      box: { x: 62, y: 40, w: 18, h: 35 },
      polygon: "62,40 80,45 78,75 60,70",
    },
  ];

  const currentDet = sampleDetections[selectedDefectIdx];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-600" />
            Inspection Visualizer & Defect Analysis
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Original vs. AI-Annotated comparison slider with pixel segmentation masks and severity breakdown.
          </p>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showBoxes
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {showBoxes ? "Hide Boxes" : "Show Boxes"}
          </button>
          <button
            onClick={() => setShowMasks(!showMasks)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              showMasks
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showMasks ? "Hide Masks" : "Show Masks"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interactive Comparison Viewport */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 relative select-none">
            {/* Viewport Canvas Container */}
            <div className="relative aspect-[16/10] w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              {/* Synthetic Road Pavement Texture */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 120%, #334155 0%, #0f172a 70%)`,
                }}
              >
                {/* Road Lane Lines */}
                <svg className="w-full h-full opacity-30">
                  <line x1="20%" y1="100%" x2="40%" y2="20%" stroke="#facc15" strokeWidth="4" strokeDasharray="16" />
                  <line x1="80%" y1="100%" x2="60%" y2="20%" stroke="#facc15" strokeWidth="4" strokeDasharray="16" />
                </svg>
              </div>

              {/* Original Layer (Left side of slider) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
              >
                <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur px-3 py-1 rounded-md text-xs font-bold text-white border border-slate-700">
                  Original Road Feed
                </div>
                {/* Natural Pothole Representation */}
                <div
                  className="absolute rounded-full bg-slate-950 shadow-inner"
                  style={{
                    left: `${currentDet.box.x}%`,
                    top: `${currentDet.box.y}%`,
                    width: `${currentDet.box.w}%`,
                    height: `${currentDet.box.h}%`,
                    boxShadow: "inset 0 10px 20px rgba(0,0,0,0.8)",
                  }}
                />
              </div>

              {/* Annotated Layer (Right side of slider) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
              >
                <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur px-3 py-1 rounded-md text-xs font-bold text-emerald-400 border border-emerald-700">
                  AI Edge Inferred Layer
                </div>

                {/* Segment Mask Overlay */}
                {showMasks && (
                  <div
                    className="absolute rounded-full transition-opacity"
                    style={{
                      left: `${currentDet.box.x}%`,
                      top: `${currentDet.box.y}%`,
                      width: `${currentDet.box.w}%`,
                      height: `${currentDet.box.h}%`,
                      backgroundColor: "rgba(239, 68, 68, 0.4)",
                      border: "2px solid #ef4444",
                    }}
                  />
                )}

                {/* Bounding Box Overlay */}
                {showBoxes && (
                  <div
                    className="absolute border-2 border-red-500 rounded transition-all"
                    style={{
                      left: `${currentDet.box.x - 2}%`,
                      top: `${currentDet.box.y - 2}%`,
                      width: `${currentDet.box.w + 4}%`,
                      height: `${currentDet.box.h + 4}%`,
                      boxShadow: "0 0 15px rgba(239, 68, 68, 0.6)",
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
                      <span>{currentDet.class_code}</span>
                      <span className="opacity-80">{(currentDet.confidence * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Vertical Slider Handle Line */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white text-slate-800 rounded-full shadow-lg border-2 border-slate-300 flex items-center justify-center font-bold text-xs cursor-ew-resize">
                  ↔
                </div>
              </div>
            </div>

            {/* Slider Control Bar */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center gap-4">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Original</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">AI Annotated</span>
            </div>
          </div>

          {/* Detections Gallery Selector */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Identified Defects in Frame ({sampleDetections.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {sampleDetections.map((det, idx) => (
                <button
                  key={det.id}
                  onClick={() => setSelectedDefectIdx(idx)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedDefectIdx === idx
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{det.class_code}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        det.severity_level === "CRITICAL"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {det.severity_level}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>Conf: {(det.confidence * 100).toFixed(1)}%</span>
                    <span>Area: {det.relative_area_pct}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Analytical Defect Breakdown Sidecard */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-900">Defect Diagnostics</h2>
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                {currentDet.id}
              </span>
            </div>

            {/* Rule R5: Confidence vs Severity Separation */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <span className="text-[11px] font-semibold text-blue-700 block">AI Confidence (R5)</span>
                <span className="text-2xl font-black text-blue-900 mt-1 block">
                  {(currentDet.confidence * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-blue-600">Model Certainty</span>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <span className="text-[11px] font-semibold text-red-700 block">Road Severity (R5)</span>
                <span className="text-2xl font-black text-red-900 mt-1 block">
                  {currentDet.severity_score}
                </span>
                <span className="text-[10px] text-red-600 font-bold uppercase">{currentDet.severity_level}</span>
              </div>
            </div>

            {/* Rule R4: Physical Dimensions & Calibration */}
            <div className="mt-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Spatial Measurements (Rule R4)
              </h3>
              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Relative Area:</span>
                  <span className="font-bold text-slate-900">{currentDet.relative_area_pct}% of road ROI</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pixel Area:</span>
                  <span className="font-mono text-slate-800">{currentDet.pixel_area.toLocaleString()} px²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sensor Calibration:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                    Uncalibrated (Pixels Only)
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 italic">
                  *Depth is not synthesized. Physical metric units (cm) require camera homography calibration.
                </div>
              </div>
            </div>

            {/* Severity Formula Breakdown */}
            <div className="mt-5 space-y-2">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Severity Score Composition
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Base Class Weight ({currentDet.class_code}):</span>
                  <span className="font-mono font-bold text-slate-900">70.0</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Area Penalty ({currentDet.relative_area_pct}%):</span>
                  <span className="font-mono font-bold text-slate-900">+7.5</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Road Class Multiplier (Arterial):</span>
                  <span className="font-mono font-bold text-slate-900">1.2x</span>
                </div>
                <div className="flex justify-between py-1 pt-2 font-bold text-slate-900">
                  <span>Composite Severity Score:</span>
                  <span className="text-emerald-700 font-mono">{currentDet.severity_score} / 100</span>
                </div>
              </div>
            </div>

            {/* Privacy Stamping Badge */}
            <div className="mt-6 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Privacy Redacted on Device</span>
                <span className="text-[10px] text-emerald-700 block">
                  All faces and vehicle license plates blurred before transmission (Rule R15).
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
