import React from "react";
import {
  Radio,
  Smartphone,
  Cpu,
  Laptop,
  ShieldCheck,
} from "../components/Icons";

interface DeviceNode {
  id: string;
  name: string;
  type: "mobile" | "edge_box" | "laptop";
  model: string;
  status: "ONLINE" | "SYNCING" | "STANDBY";
  modelVersion: string;
  avgFps: number;
  inferenceMs: number;
  outboxPending: number;
  outboxCompleted: number;
  batteryPct: number;
  tempC: number;
  lastHeartbeat: string;
}

export const FleetPage: React.FC = () => {
  const devices: DeviceNode[] = [
    {
      id: "oppo-k13-dev-01",
      name: "OPPO K13 (Survey Vehicle #1)",
      type: "mobile",
      model: "Snapdragon 6 Gen 1 / Adreno GPU",
      status: "ONLINE",
      modelVersion: "scamroad-yolov8n-v1.0.onnx",
      avgFps: 29.2,
      inferenceMs: 34.2,
      outboxPending: 0,
      outboxCompleted: 142,
      batteryPct: 86,
      tempC: 38.5,
      lastHeartbeat: "Just now",
    },
    {
      id: "rpi5-box-03",
      name: "Raspberry Pi 5 Road Box",
      type: "edge_box",
      model: "Broadcom BCM2712 / ONNX Runtime INT8",
      status: "ONLINE",
      modelVersion: "scamroad-yolov8n-int8.onnx",
      avgFps: 18.5,
      inferenceMs: 54.0,
      outboxPending: 2,
      outboxCompleted: 310,
      batteryPct: 100,
      tempC: 44.1,
      lastHeartbeat: "12s ago",
    },
    {
      id: "jetson-orin-02",
      name: "NVIDIA Jetson Orin Box #2",
      type: "edge_box",
      model: "NVIDIA Ampere / TensorRT FP16",
      status: "STANDBY",
      modelVersion: "scamroad-yolov8s-fp16.engine",
      avgFps: 48.0,
      inferenceMs: 20.8,
      outboxPending: 0,
      outboxCompleted: 580,
      batteryPct: 100,
      tempC: 41.0,
      lastHeartbeat: "2m ago",
    },
    {
      id: "laptop-dev-host",
      name: "Workstation Dev Runtime",
      type: "laptop",
      model: "Intel Core i7 / ONNX Runtime CPU",
      status: "ONLINE",
      modelVersion: "scamroad-yolov8n-v1.0.onnx",
      avgFps: 24.1,
      inferenceMs: 41.5,
      outboxPending: 0,
      outboxCompleted: 88,
      batteryPct: 95,
      tempC: 42.0,
      lastHeartbeat: "Just now",
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600" />
            Edge Device Fleet Monitor &amp; Heartbeats (Rule B4)
          </h1>
          <p className="text-xs text-slate-500">
            Real-time telemetry from vehicle-mounted smartphones (OPPO K13) and edge boxes executing on-device inference.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            3 Devices Active
          </span>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {devices.map((dev) => (
          <div
            key={dev.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition space-y-4"
          >
            {/* Device Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                  {dev.type === "mobile" ? (
                    <Smartphone className="w-5 h-5 text-emerald-600" />
                  ) : dev.type === "edge_box" ? (
                    <Cpu className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Laptop className="w-5 h-5 text-purple-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{dev.name}</h3>
                  <span className="text-xs text-slate-400 block font-mono">{dev.model}</span>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  dev.status === "ONLINE"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : dev.status === "SYNCING"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    dev.status === "ONLINE"
                      ? "bg-emerald-500"
                      : dev.status === "SYNCING"
                        ? "bg-blue-500 animate-pulse"
                        : "bg-slate-400"
                  }`}
                ></span>
                {dev.status}
              </span>
            </div>

            {/* Performance Telemetry Grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  FPS (Inference)
                </span>
                <span className="text-lg font-black text-slate-900">
                  {dev.avgFps} <span className="text-xs font-normal text-slate-400">fps</span>
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Latency (P50)
                </span>
                <span className="text-lg font-black text-slate-900">
                  {dev.inferenceMs} <span className="text-xs font-normal text-slate-400">ms</span>
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  Outbox Queue
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {dev.outboxPending} <span className="text-xs font-normal text-slate-400">pend</span>
                </span>
              </div>
            </div>

            {/* Hardware Status / Model Info */}
            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Deployed Model:</span>
                <span className="font-mono font-medium text-slate-800">{dev.modelVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Privacy Redactor:</span>
                <span className="font-medium text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Active (Blur Face &amp; Plate)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Thermal &amp; Battery:</span>
                <span className="font-medium text-slate-800">
                  {dev.tempC}°C &bull; {dev.batteryPct}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Total Synchronized:</span>
                <span className="font-medium text-slate-800">
                  {dev.outboxCompleted} records synced
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
