import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Cpu, CheckCircle, AlertTriangle, ArrowRight } from "../components/Icons";

interface ModelVersion {
  id: string;
  name: string;
  precision: "FP32" | "INT8" | "FP16";
  runtime: string;
  size_mb: number;
  mAP50: number;
  mAP50_95: number;
  status: "ACTIVE" | "AVAILABLE" | "ARCHIVED";
  sha256: string;
  benchmarks: {
    oppo_k13_ms: number;
    oppo_k13_fps: number;
    rpi5_ms: number;
    jetson_ms: number;
  };
}

export const ModelsPage: React.FC = () => {
  const { t } = useLanguage();
  const [models, setModels] = useState<ModelVersion[]>([
    {
      id: "mdl-yolo-nano-int8",
      name: "ScamRoad YOLO Nano INT8 (Production Edge)",
      precision: "INT8",
      runtime: "ONNX Runtime Mobile / TFLite",
      size_mb: 3.42,
      mAP50: 0.9912,
      mAP50_95: 0.8124,
      status: "ACTIVE",
      sha256: "b9c0268a734e91244f7725dc1001a403bbff7e7195f269a9e3e3b7498c0b2984",
      benchmarks: {
        oppo_k13_ms: 14.2,
        oppo_k13_fps: 22.4,
        rpi5_ms: 38.5,
        jetson_ms: 8.4,
      },
    },
    {
      id: "mdl-yolo-nano-fp32",
      name: "ScamRoad YOLO Nano FP32 (Full Precision Baseline)",
      precision: "FP32",
      runtime: "PyTorch / ONNX FP32",
      size_mb: 12.85,
      mAP50: 0.9950,
      mAP50_95: 0.8240,
      status: "AVAILABLE",
      sha256: "034e91244f7725dc1001a403bbff7e7195f269a9e3e3b7498c0b2984b9c0268a",
      benchmarks: {
        oppo_k13_ms: 28.6,
        oppo_k13_fps: 15.1,
        rpi5_ms: 84.0,
        jetson_ms: 12.1,
      },
    },
    {
      id: "mdl-yolo-small-fp32",
      name: "ScamRoad YOLO Small Server Reference",
      precision: "FP32",
      runtime: "PyTorch / TensorRT",
      size_mb: 44.1,
      mAP50: 0.9965,
      mAP50_95: 0.8410,
      status: "AVAILABLE",
      sha256: "7725dc1001a403bbff7e7195f269a9e3e3b7498c0b2984b9c0268a034e91244f",
      benchmarks: {
        oppo_k13_ms: 64.0,
        oppo_k13_fps: 8.2,
        rpi5_ms: 195.0,
        jetson_ms: 19.5,
      },
    },
  ]);

  const [confirmRollout, setConfirmRollout] = useState<ModelVersion | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleActivate = (model: ModelVersion) => {
    setConfirmRollout(model);
  };

  const handleConfirmActivate = () => {
    if (!confirmRollout) return;
    setModels(
      models.map((m) => ({
        ...m,
        status: m.id === confirmRollout.id ? "ACTIVE" : "AVAILABLE",
      }))
    );
    setActionNotice(`Successfully rolled out ${confirmRollout.name} as fleet active version!`);
    setConfirmRollout(null);
    setTimeout(() => setActionNotice(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            {t("modelsTitle")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("modelsSubtitle")}
          </p>
        </div>
      </div>

      {actionNotice && (
        <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3 text-emerald-900 dark:text-emerald-200 text-sm font-semibold shadow-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          {actionNotice}
        </div>
      )}

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        {models.map((model) => (
          <div
            key={model.id}
            className={`civic-card rounded-2xl p-6 shadow-sm transition-all ${
              model.status === "ACTIVE"
                ? "border-emerald-500 ring-2 ring-emerald-500/20"
                : "hover:border-slate-400/40"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-lg text-slate-900 dark:text-white">{model.name}</span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      model.status === "ACTIVE"
                        ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {model.status === "ACTIVE" ? t("statusActive") : t("statusAvailable")}
                  </span>
                  <span className="text-xs font-bold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    {model.precision}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  {t("runtimeLabel")} {model.runtime} • SHA-256: {model.sha256.substring(0, 16)}...
                </div>
              </div>

              {model.status !== "ACTIVE" && (
                <button
                  onClick={() => handleActivate(model)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 self-start md:self-auto cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  {t("activateFleetBtn")}
                </button>
              )}
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <span className="text-xs text-slate-500 font-semibold block">Model Size</span>
                <span className="text-xl font-black text-slate-900 mt-1 block font-mono">
                  {model.size_mb} MB
                </span>
              </div>

              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <span className="text-xs text-emerald-700 font-semibold block">mAP@50 (Precision)</span>
                <span className="text-xl font-black text-emerald-900 mt-1 block font-mono">
                  {(model.mAP50 * 100).toFixed(2)}%
                </span>
              </div>

              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <span className="text-xs text-emerald-700 font-semibold block">mAP@50-95</span>
                <span className="text-xl font-black text-emerald-900 mt-1 block font-mono">
                  {(model.mAP50_95 * 100).toFixed(2)}%
                </span>
              </div>

              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <span className="text-xs text-blue-700 font-semibold block">OPPO K13 NPU Speed</span>
                <span className="text-xl font-black text-blue-900 mt-1 block font-mono">
                  {model.benchmarks.oppo_k13_fps} FPS
                </span>
                <span className="text-[10px] text-blue-600 font-mono">({model.benchmarks.oppo_k13_ms} ms/frame)</span>
              </div>
            </div>

            {/* Hardware Benchmark Comparison Bar */}
            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-slate-600">
              <div>
                <span className="text-slate-400">Raspberry Pi 5:</span>{" "}
                <strong className="font-mono">{model.benchmarks.rpi5_ms} ms</strong>
              </div>
              <div>
                <span className="text-slate-400">Jetson Orin Nano:</span>{" "}
                <strong className="font-mono">{model.benchmarks.jetson_ms} ms</strong>
              </div>
              <div>
                <span className="text-slate-400">Quantization Loss:</span>{" "}
                <strong className="font-mono text-emerald-700">
                  {model.precision === "INT8" ? "-0.38% mAP drop" : "0.0% Baseline"}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmRollout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Fleet Model Activation
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Are you sure you want to activate <strong>{confirmRollout.name}</strong> as the global production model?
            </p>
            <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              Connected edge nodes (including OPPO K13 phones and Raspberry Pi devices) will automatically download the new weights on their next heartbeat sync.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmRollout(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmActivate}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Confirm Rollout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
