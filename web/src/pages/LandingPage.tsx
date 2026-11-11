import React from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Activity,
} from "../components/Icons";

export const LandingPage: React.FC = () => {
  const metrics = [
    { label: "Detection mAP@50", value: "85.75%", sub: "RDD2022-India test split (n=50)" },
    { label: "Precision / Recall", value: "86.6% / 84.0%", sub: "F1 score 85.2%" },
    { label: "Edge CPU Latency", value: "45.5 ms", sub: "21.0 FPS on YOLOv8n INT8" },
    { label: "INT8 Model Size", value: "3.32 MB", sub: "Quantized ONNX checkpoint" },
  ];

  const steps = [
    {
      step: "01",
      title: "Capture",
      desc: "Upload road photos or dashcam frames from a phone or patrol camera.",
      icon: Camera,
    },
    {
      step: "02",
      title: "Detect",
      desc: "Multi-model ONNX inference locates potholes and alligator, longitudinal, and transverse cracks.",
      icon: Activity,
    },
    {
      step: "03",
      title: "Track",
      desc: "ByteTrack and spatial corridor matching consolidate repeat sightings into single defect records.",
      icon: Layers,
    },
    {
      step: "04",
      title: "Verify",
      desc: "Work orders track repairs and compare before/after images before engineer sign-off.",
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen text-text bg-slate-50 dark:bg-slate-950">
      <section className="pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            ScamRoad · Road Surface Inspection Prototype
          </p>

          <h1 className="font-heading font-bold text-3xl sm:text-5xl tracking-tight text-text leading-tight">
            Detect and track <span className="text-primary">road surface defects</span>
          </h1>

          <p className="text-sm sm:text-base text-muted max-w-2xl mx-auto leading-relaxed">
            Computer vision defect detection and maintenance tracking for asphalt potholes and surface cracking, built as a student research project.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/scanner"
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2"
            >
              <span>Open Scanner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/benchmarks"
              className="btn-secondary text-sm px-5 py-2.5 bg-surface-solid"
            >
              <span>View Benchmarks</span>
            </Link>
          </div>
        </div>

        <div className="mt-10 max-w-3xl mx-auto card p-3 border border-border overflow-hidden">
          <div className="flex items-center justify-between pb-2.5 px-1 text-xs text-muted">
            <span className="font-mono">Sample Image: asphalt_crater.jpg</span>
            <Link to="/scanner" className="text-primary hover:underline font-medium">
              Run live detection in Scanner &rarr;
            </Link>
          </div>
          <img
            src="/samples/asphalt_crater.jpg"
            alt="Asphalt road crater sample"
            className="w-full max-h-[380px] object-cover rounded"
          />
        </div>
      </section>

      <section className="border-y border-border bg-surface-solid py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1">
              <p className="font-mono text-2xl sm:text-3xl font-bold text-text">
                {m.value}
              </p>
              <p className="text-xs font-semibold text-text">{m.label}</p>
              <p className="text-[11px] text-muted font-mono">{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-text">
            Workflow Summary
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Inspection pipeline from road photo upload to repair verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="card p-5 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-bold text-muted">
                    {s.step}
                  </span>
                  <div className="p-2 rounded-md bg-bg-raised text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-sm text-text mb-1">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="card p-6 sm:p-8 border border-border">
          <h2 className="font-heading text-lg font-bold text-text mb-6">
            Capabilities &amp; Limitations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Implemented</span>
              </div>
              <ul className="text-xs text-muted space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>Multi-model ONNX pothole and surface crack detection via /api/v1/infer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>COCO obstacle filtering to suppress detections over vehicles, pedestrians, and signs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>PostgreSQL and SQLite work-order tracking with before/after repair comparison</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>Automated face and license plate blurring in the edge capture pipeline</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Known Limitations</span>
              </div>
              <ul className="text-xs text-muted space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Monocular camera input measures relative pixel area only (no calibrated depth or volume)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Repair cost estimates use an illustrative project rate card, not an official Schedule of Rates</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Student research prototype only; human engineer review is required before closing work orders</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="py-6 text-center text-xs text-muted border-t border-border bg-surface-solid">
        <p>Student research project. Not an official government system. Not safety-certified.</p>
      </div>
    </div>
  );
};
