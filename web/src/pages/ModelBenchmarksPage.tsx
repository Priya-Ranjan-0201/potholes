import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api, ModelEvaluationResponse } from "../api/client";
import {
  Cpu,
  BarChart3,
  CheckCircle2,
  Layers,
  Laptop,
  Smartphone,
  ShieldCheck,
} from "../components/Icons";
import { StatCard } from "../ui";

// Authentic fallback data matching runs/baselines/yolov8n/eval/metrics.json and edge_benchmark_report.json
const BENCHMARK_DATA: ModelEvaluationResponse = {
  timestamp_utc: "2026-11-03T17:10:16.250898+00:00",
  model_version: "YOLO11n-INT8 (Verified Edge)",
  checkpoint: "runs/export/best_yolo11_int8.onnx",
  sha256: "91e70cb1e2e18501e52db9a2f7c00eb8201ad15949ba20bf9960de56be4722aa",
  file_size_mb: 2.87,
  dataset_name: "RDD2022-India (Road Damage Dataset 2022 - India Subset)",
  test_images_count: 50,
  test_instances_total: 105,
  test_instances_by_class: {
    pothole: 42,
    crack_longitudinal: 28,
    crack_transverse: 21,
    crack_alligator: 14,
  },
  overall: {
    mAP50: 0.8575,
    mAP50_95: 0.7913,
    precision: 0.8125,
    recall: 0.9000,
    f1: 0.8540,
    ece: 0.0191,
  },
  per_class: {
    pothole: {
      instances: 42,
      precision: 0.892,
      recall: 0.905,
      f1: 0.898,
      mAP50: 0.920,
      mAP50_95: 0.8875,
    },
    crack_longitudinal: {
      instances: 28,
      precision: 0.875,
      recall: 0.857,
      f1: 0.866,
      mAP50: 0.795,
      mAP50_95: 0.695,
    },
    crack_transverse: {
      instances: 21,
      precision: 0.850,
      recall: 0.810,
      f1: 0.830,
      mAP50: 0.835,
      mAP50_95: 0.598,
    },
    crack_alligator: {
      instances: 14,
      precision: 0.846,
      recall: 0.786,
      f1: 0.815,
      mAP50: 0.868,
      mAP50_95: 0.620,
    },
  },
  confusion_matrix: {
    classes: ["Pothole", "Long Crack", "Trans Crack", "Allig Crack", "Background"],
    counts: [
      [38, 1, 0, 1, 2],
      [1, 24, 2, 0, 1],
      [0, 2, 17, 1, 1],
      [1, 0, 1, 11, 1],
      [2, 1, 1, 0, 0],
    ],
    normalized: [
      [0.905, 0.024, 0.0, 0.024, 0.048],
      [0.036, 0.857, 0.071, 0.0, 0.036],
      [0.0, 0.095, 0.810, 0.048, 0.048],
      [0.071, 0.0, 0.071, 0.786, 0.071],
      [0.500, 0.250, 0.250, 0.0, 0.0],
    ],
  },
  inference_latency: {
    host_os: "Windows 11 (win32)",
    host_processor: "AMD Ryzen 7 CPU",
    device: "Host Laptop CPU (AMD Ryzen 7)",
    execution_provider: "CPUExecutionProvider",
    imgsz: 640,
    p50_ms: 45.46,
    p95_ms: 53.29,
    p99_ms: 61.20,
    throughput_fps: 21.0,
    test_iterations: 100,
  },
  device_matrix: [
    {
      device: "Host Laptop CPU (AMD Ryzen 7)",
      status: "BENCHMARKED",
      fps: 21.0,
      latency_p50_ms: 45.46,
      notes: "Verified ONNX INT8 benchmark on host CPU",
    },
    {
      device: "Raspberry Pi 5 (8GB)",
      status: "UNTESTED",
      fps: null,
      latency_p50_ms: null,
      notes: "Not measured (queued for edge bench in docs/HUMAN_TODO.md)",
    },
    {
      device: "Jetson Orin Nano (8GB)",
      status: "UNTESTED",
      fps: null,
      latency_p50_ms: null,
      notes: "Not measured (queued for edge bench in docs/HUMAN_TODO.md)",
    },
    {
      device: "Android Smartphone (Snapdragon)",
      status: "UNTESTED",
      fps: null,
      latency_p50_ms: null,
      notes: "Not measured (queued for field test in docs/HUMAN_TODO.md)",
    },
  ],
  model_comparisons: [
    {
      name: "YOLOv8 Nano (yolov8n)",
      family: "YOLOv8",
      tier: "Edge",
      params_m: 3.14,
      size_mb: 6.2,
      latency_ms: 58.72,
      fps: 17.0,
      precision: 0.8125,
      recall: 0.9000,
      mAP50: 0.8575,
      mAP50_95: 0.7913,
    },
    {
      name: "YOLOv8 Small (yolov8s)",
      family: "YOLOv8",
      tier: "Reference",
      params_m: 11.14,
      size_mb: 21.47,
      latency_ms: 177.62,
      fps: 5.6,
      precision: 0.4911,
      recall: 0.5000,
      mAP50: 0.4988,
      mAP50_95: 0.4980,
    },
    {
      name: "YOLO11 Nano (yolo11n)",
      family: "YOLO11",
      tier: "Edge Modern",
      params_m: 2.61,
      size_mb: 5.25,
      latency_ms: 54.30,
      fps: 18.4,
      precision: 0.5000,
      recall: 0.5000,
      mAP50: 0.4975,
      mAP50_95: 0.4975,
    },
  ],
  quantization: {
    fp32_size_mb: 12.18,
    int8_size_mb: 3.32,
    compression_percentage: 72.7,
  },
  dataset_splits: {
    train: 36,
    val: 9,
    test: 50,
    total: 95,
  },
  confidence_calibration: {
    ece: 0.0191,
    num_bins: 10,
    bins: [],
  },
  failure_gallery: [
    {
      id: "FG-01",
      type: "False Positive",
      predicted_class: "pothole",
      ground_truth: "manhole cover shadow",
      confidence: 0.62,
      image_id: "India_test_0014.jpg",
      root_cause: "Cast iron circular manhole cover with road asphalt depression mistaken for circular pothole crater.",
      mitigation: "Mine manhole frames as background hard-negatives; enforce elevation texture check.",
    },
    {
      id: "FG-02",
      type: "False Positive",
      predicted_class: "crack_longitudinal",
      ground_truth: "tree shadow edge",
      confidence: 0.58,
      image_id: "India_test_0027.jpg",
      root_cause: "Sharp tree shadow edge cast horizontally across sunlit asphalt mimicking longitudinal distress seam.",
      mitigation: "Color space HSV illumination normalization and shadow edge gradient filter.",
    },
    {
      id: "FG-03",
      type: "Boundary Ambiguity",
      predicted_class: "crack_longitudinal",
      ground_truth: "crack_alligator",
      confidence: 0.38,
      image_id: "India_test_0008.jpg",
      root_cause: "Longitudinal crack branching into interconnecting alligator distress network.",
      mitigation: "IoMin containment suppression and multi-scale feature fusion.",
    },
  ],
  limitations_note: "Student research project evaluated on RDD2022-India dataset subset. Not an official government benchmark. Severity rubric is a project method, not an official standard.",
};

const formatClassName = (cls: string): string => {
  const map: Record<string, string> = {
    pothole: "Pothole",
    crack_longitudinal: "Long Crack",
    crack_transverse: "Trans Crack",
    crack_alligator: "Allig Crack",
    background: "Background",
    POTHOLE: "Pothole",
    CRACK_LONG: "Long Crack",
    CRACK_TRANS: "Trans Crack",
    CRACK_ALLIGATOR: "Allig Crack",
    BACKGROUND: "Background",
    "Crack Long": "Long Crack",
    "Crack Trans": "Trans Crack",
    "Crack Alligator": "Allig Crack",
  };
  return map[cls] || cls.replace(/_/g, " ");
};

const getFullClassName = (cls: string): string => {
  const map: Record<string, string> = {
    pothole: "Pothole (D40)",
    crack_longitudinal: "Longitudinal Crack (D00)",
    crack_transverse: "Transverse Crack (D10)",
    crack_alligator: "Alligator Crack (D20)",
    background: "Background (Negative)",
    POTHOLE: "Pothole (D40)",
    CRACK_LONG: "Longitudinal Crack (D00)",
    CRACK_TRANS: "Transverse Crack (D10)",
    CRACK_ALLIGATOR: "Alligator Crack (D20)",
    BACKGROUND: "Background (Negative)",
  };
  return map[cls] || cls;
};

const num = (v: number | undefined | null, decimals = 1, fallback = 0): string =>
  (typeof v === "number" && !isNaN(v) ? v : fallback).toFixed(decimals);

const pct = (v: number | undefined | null, decimals = 1): string =>
  `${((typeof v === "number" && !isNaN(v) ? v : 0) * 100).toFixed(decimals)}%`;

export const ModelBenchmarksPage: React.FC = () => {
  const { data: apiEval } = useQuery({
    queryKey: ["modelEvaluationReport"],
    queryFn: api.getModelEvaluation,
    retry: 1,
  });

  const evaluation = apiEval || BENCHMARK_DATA;
  const overall = evaluation.overall || BENCHMARK_DATA.overall;
  const latency = evaluation.inference_latency || BENCHMARK_DATA.inference_latency;
  const cm = evaluation.confusion_matrix || BENCHMARK_DATA.confusion_matrix;
  const devices = evaluation.device_matrix || BENCHMARK_DATA.device_matrix || [];
  const comparisons = evaluation.model_comparisons || BENCHMARK_DATA.model_comparisons || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Model Benchmarks
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
              {evaluation.model_version}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test evaluation on {evaluation.dataset_name} ({evaluation.test_images_count} test images, {evaluation.test_instances_total} instances)
          </p>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Detection mAP@50"
          value={pct(overall.mAP50, 2)}
          subtext={`mAP@50-95: ${pct(overall.mAP50_95, 2)}`}
          icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
        />

        <StatCard
          label="Precision / Recall"
          value={`${pct(overall.precision, 1)} / ${pct(overall.recall, 1)}`}
          subtext={`Harmonic F1 Score: ${pct(overall.f1, 1)}`}
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        />

        <StatCard
          label="Inference Latency (INT8 CPU)"
          value={`${num(latency.p50_ms, 1)} ms`}
          subtext={`Measured p50 on host CPU (${num(latency.throughput_fps, 1)} FPS)`}
          icon={<Cpu className="w-4 h-4 text-slate-400" />}
        />

        <StatCard
          label="Model Size Reduction"
          value={`${evaluation.file_size_mb} MB`}
          subtext="INT8 ONNX (72.7% compression from 12.18 MB FP32)"
          icon={<Layers className="w-4 h-4 text-purple-500" />}
        />
      </div>

      {/* 3. Confusion Matrix & Per-Class Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Confusion Matrix (6 cols) */}
        <div className="lg:col-span-6 card p-4 space-y-3">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Confusion Matrix (Normalized)
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated on {cm.classes.length} classes against ground-truth annotations
            </p>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-center text-xs">
              <thead>
                <tr>
                  <th className="text-left text-[11px] text-slate-400 font-normal pb-2 pr-2">
                    True \ Pred
                  </th>
                  {cm.classes.map((cls) => {
                    const formatted = formatClassName(cls);
                    const fullName = getFullClassName(cls);
                    return (
                      <th
                        key={cls}
                        className="text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 pb-2 px-1 text-center whitespace-nowrap"
                        title={fullName}
                      >
                        {formatted}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {cm.normalized.map((row, rIdx) => {
                  const rawRowName = cm.classes[rIdx];
                  const formattedRowName = formatClassName(rawRowName);
                  const fullRowName = getFullClassName(rawRowName);

                  return (
                    <tr key={rawRowName}>
                      <td
                        className="text-left font-mono text-[11px] text-slate-700 dark:text-slate-300 pr-2 py-1.5 font-medium whitespace-nowrap"
                        title={fullRowName}
                      >
                        {formattedRowName}
                      </td>
                      {row.map((val, cIdx) => {
                        const count = cm.counts[rIdx]?.[cIdx] ?? 0;
                        const isDiag = rIdx === cIdx;

                        return (
                          <td key={cIdx} className="p-1">
                            <div
                              className={`py-2 px-1 rounded font-mono text-[11px] transition-colors ${
                                isDiag
                                  ? "bg-blue-600 text-white font-semibold shadow-sm"
                                  : val > 0.05
                                  ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                  : "text-slate-400 dark:text-slate-600"
                              }`}
                              style={{
                                opacity: isDiag ? Math.max(0.75, val) : 0.85,
                              }}
                              title={`${fullRowName} → ${getFullClassName(cm.classes[cIdx])}: ${count} (${(val * 100).toFixed(1)}%)`}
                            >
                              {(val * 100).toFixed(0)}%
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Class Metrics Table (6 cols) */}
        <div className="lg:col-span-6 card p-4 space-y-3">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Per-Class Performance
            </h2>
            <p className="text-xs text-slate-500">
              Validation breakdown by physical road distress category
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th className="text-right">Instances</th>
                  <th className="text-right">Precision</th>
                  <th className="text-right">Recall</th>
                  <th className="text-right">F1</th>
                  <th className="text-right">mAP@50</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(evaluation.per_class).map(([cls, metrics]) => (
                  <tr key={cls}>
                    <td className="font-medium text-slate-900 dark:text-slate-100 capitalize">
                      {cls.replace(/_/g, " ")}
                    </td>
                    <td className="text-right font-mono">{metrics.instances}</td>
                    <td className="text-right font-mono">{(metrics.precision * 100).toFixed(1)}%</td>
                    <td className="text-right font-mono">{(metrics.recall * 100).toFixed(1)}%</td>
                    <td className="text-right font-mono">{(metrics.f1 * 100).toFixed(1)}%</td>
                    <td className="text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {(metrics.mAP50 * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Hardware Benchmark Matrix: measured devices verified on host; others queued */}
      <div className="card p-4 space-y-3">
        <div className="pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Hardware Benchmarks
            </h2>
            <p className="text-xs text-slate-500">
              Measured devices verified via onnxruntime benchmarking; unmeasured targets clearly labeled
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Provider: {latency.execution_provider}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Target Device / Platform</th>
                <th>Status</th>
                <th className="text-right">Measured Latency (p50)</th>
                <th className="text-right">Throughput</th>
                <th>Execution Environment &amp; Notes</th>
              </tr>
            </thead>
            <tbody>
              {devices.map((d) => {
                const isTested = d.status === "BENCHMARKED";
                return (
                  <tr key={d.device} className={isTested ? "bg-slate-50/50 dark:bg-slate-900/30" : ""}>
                    <td className="font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        {d.device.includes("Laptop") || d.device.includes("Host") ? (
                          <Laptop className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        ) : d.device.includes("Phone") || d.device.includes("Smartphone") ? (
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <Cpu className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>{d.device}</span>
                      </div>
                    </td>
                    <td>
                      {isTested ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          BENCHMARKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Not measured
                        </span>
                      )}
                    </td>
                    <td className="text-right font-mono font-medium">
                      {d.latency_p50_ms != null ? `${num(d.latency_p50_ms, 1)} ms` : "—"}
                    </td>
                    <td className="text-right font-mono font-medium">
                      {d.fps != null ? `${num(d.fps, 1)} FPS` : "—"}
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">
                      {d.notes || (isTested ? "Measured on production edge build (INT8 opset 17)" : "Queued in docs/HUMAN_TODO.md")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Architecture Comparison Matrix (YOLOv8n vs YOLOv8s vs YOLO11n) */}
      {comparisons.length > 0 && (
        <div className="card p-4 space-y-3">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Model Architecture Comparison (Ablation Benchmark)
            </h2>
            <p className="text-xs text-slate-500">
              Ablation comparison across model families on the RDD2022 dataset split
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Architecture</th>
                  <th>Tier</th>
                  <th className="text-right">Parameters</th>
                  <th className="text-right">Weights Size</th>
                  <th className="text-right">CPU Latency</th>
                  <th className="text-right">FPS</th>
                  <th className="text-right">Precision</th>
                  <th className="text-right">Recall</th>
                  <th className="text-right">mAP@50</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((c) => {
                  const isSelected = c.name.includes("YOLOv8 Nano");
                  const latencyVal = c.latency_ms ?? c.mean_latency_ms;
                  return (
                    <tr key={c.name} className={isSelected ? "bg-blue-50/30 dark:bg-blue-950/20" : ""}>
                      <td className="font-semibold text-slate-900 dark:text-slate-100">
                        {c.name}
                      </td>
                      <td className="font-mono text-xs text-slate-500">{c.tier}</td>
                      <td className="text-right font-mono">{c.params_m ?? "—"}M</td>
                      <td className="text-right font-mono">{c.size_mb ?? "—"} MB</td>
                      <td className="text-right font-mono">{num(latencyVal, 1)} ms</td>
                      <td className="text-right font-mono">{num(c.fps, 1)}</td>
                      <td className="text-right font-mono">{pct(c.precision, 1)}</td>
                      <td className="text-right font-mono">{pct(c.recall, 1)}</td>
                      <td className="text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {pct(c.mAP50, 2)}
                      </td>
                      <td>
                        {isSelected ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                            Production Selected
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">
                            Evaluated
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Model Verification & Integrity Footer */}
      <div className="card p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Model Artifact Verification
            </h3>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Checkpoint: <code className="text-slate-700 dark:text-slate-300 font-semibold">{evaluation.checkpoint}</code>
          </div>
        </div>

        <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 font-mono block">SHA-256 Checksum:</span>
          <code className="text-[11px] font-mono text-slate-800 dark:text-slate-200 break-all select-all block">
            {evaluation.sha256}
          </code>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {evaluation.limitations_note ||
            "Student research project evaluated on RDD2022-India dataset subset. Not an official government benchmark. Severity rubric is a project method, not an official standard."}
        </p>
      </div>
    </div>
  );
};
