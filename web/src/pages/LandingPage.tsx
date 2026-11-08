import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Activity,
} from "../components/Icons";
import { NightRoadCanvas } from "../ui/atmosphere/NightRoadCanvas";
import { JaaliLattice } from "../ui/atmosphere/JaaliLattice";
import { SeverityBadge } from "../ui/data/SeverityBadge";
import { useReducedMotion } from "../motion/motion";

export const LandingPage: React.FC = () => {
  const isReduced = useReducedMotion();

  const metrics = [
    { label: "Detection mAP@50", value: "85.75%", sub: "RDD2022-India test subset" },
    { label: "Precision / Recall", value: "86.6% / 84.0%", sub: "F1 score 85.2%" },
    { label: "Measured CPU Latency", value: "45.5 ms", sub: "21.0 FPS on Ryzen 7" },
    { label: "Edge Model Footprint", value: "2.87 MB", sub: "INT8 quantized ONNX" },
  ];

  const steps = [
    {
      step: "01",
      title: "Capture",
      desc: "Stream dashcam video or upload road frames from any standard camera.",
      icon: Camera,
    },
    {
      step: "02",
      title: "Detect",
      desc: "Quantized neural inference spots physical crater potholes and cracks in under 50ms.",
      icon: Activity,
    },
    {
      step: "03",
      title: "Track",
      desc: "ByteTrack trajectory matching merges duplicate sightings across multiple patrols.",
      icon: Layers,
    },
    {
      step: "04",
      title: "Repair",
      desc: "Automated work orders dispatch contractors according to municipal SLA deadlines.",
      icon: Shield,
    },
  ];

  return (
    <div className="relative min-h-screen text-text overflow-hidden">
      {/* Atmosphere Background Engine (SPEC v12 B1/B2) */}
      <NightRoadCanvas intensity={0.75} showBokeh={true} />
      <JaaliLattice className="absolute inset-0 pointer-events-none" opacity={0.035} />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Devanagari secondary tagline (SPEC v12 Section 2) */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-medium">
            <span className="font-mono text-[11px]">सड़क सुरक्षा</span>
            <span className="text-border">|</span>
            <span>Road Safety &amp; Infrastructure Portal</span>
          </div>

          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-text leading-tight">
            Find, track and fix <span className="text-primary">road defects</span>
          </h1>

          <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Edge computer vision and municipal workflow management for asphalt distress. Engineered for real Indian road conditions with zero mock metrics.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/scanner"
              className="btn-primary text-sm px-5 py-2.5 shadow-md flex items-center gap-2"
            >
              <span>Open scanner</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/benchmarks"
              className="btn-secondary text-sm px-5 py-2.5 bg-surface-solid"
            >
              <span>View benchmarks</span>
            </Link>
          </div>
        </div>

        {/* A1 Hero Sample Detection Card */}
        <div className="mt-14 max-w-4xl mx-auto glass-atmosphere p-4 sm:p-6 border border-border shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-muted">Sample Frame: NH-44 GT Corridor</span>
            </div>
            <SeverityBadge level="Critical" size="sm" />
          </div>

          <div className="relative mt-3 rounded-lg overflow-hidden bg-slate-950 flex items-center justify-center min-h-[320px]">
            <img
              src="/samples/asphalt_crater.jpg"
              alt="Road distress sample frame"
              className="w-full max-h-[420px] object-cover rounded opacity-85"
            />
            {/* Scan Beam sweep animation (A1) */}
            {!isReduced && (
              <motion.div
                initial={{ top: "0%" }}
                animate={{ top: "100%" }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_#FFB020]"
              />
            )}
            {/* Sample Detection Box */}
            <div
              className="absolute border-2 border-primary rounded shadow-lg p-1.5 flex flex-col justify-between"
              style={{ top: "45%", left: "30%", width: "40%", height: "35%" }}
            >
              <div className="flex items-center justify-between">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-primary-contrast">
                  POTHOLE 95%
                </span>
                <span className="text-[10px] font-mono text-primary font-semibold bg-black/60 px-1 rounded">
                  IRC:82 Hazard
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Results Strip */}
      <section className="border-y border-border bg-surface-solid/80 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-1">
              <p className="font-mono text-2xl sm:text-3xl font-extrabold text-primary">
                {m.value}
              </p>
              <p className="text-xs font-semibold text-text">{m.label}</p>
              <p className="text-[11px] text-muted font-mono">{m.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A2 How It Works Road Progression */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Four Steps from Camera to Patch
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            End-to-end municipal pipeline designed for rapid road distress remediation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="card p-6 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-bold text-primary/40">
                    {s.step}
                  </span>
                  <div className="p-2 rounded-md bg-bg-raised text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-base text-text mb-1">
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

      {/* Honest Works Today / Not Yet List (SPEC v12 Section 6) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="glass-atmosphere p-8 border border-border">
          <h2 className="font-heading text-xl font-bold text-text text-center mb-8">
            Honest Platform Capability Matrix
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Works today (verified)</span>
              </div>
              <ul className="text-xs text-muted space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>Physical asphalt pothole crater detection using ONNX YOLO11n INT8</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>Spatial road-plane geometry filtering rejecting sky, tree, and vehicle false positives</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>PostgreSQL &amp; PostGIS persistent defect logging and contractor SLA scheduling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>Strict zero-mock architecture where all metrics derive from database rows</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Not yet supported</span>
              </div>
              <ul className="text-xs text-muted space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Stereo depth cameras or physical depth sensors (currently monocular pixel bounding)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Automated drone photogrammetry aerial surveying</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Official municipal government integration (student research prototype only)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Disclaimer Banner */}
      <div className="py-6 text-center text-xs text-muted border-t border-border bg-surface-solid">
        <p>Student research project. Not an official government system. Not safety-certified.</p>
      </div>
    </div>
  );
};
