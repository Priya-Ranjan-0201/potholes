import React from "react";
import { Link } from "react-router-dom";
import { Camera, Layers, ArrowRight } from "./Icons";

export const RoadHeroScene: React.FC = () => {
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-[#EBD9B8] dark:border-stone-800 shadow-md bg-stone-950 text-white relative">
      <div className="relative w-full overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-[#0d121f] via-[#090d18] to-[#0a0f1d]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-[radial-gradient(ellipse_at_top,rgba(255,179,0,0.15),transparent_70%)] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Headline & Action Buttons */}
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>YOLO11n Edge AI Active</span>
              <span className="text-stone-500">•</span>
              <span>INT8 Quantized</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-signboard leading-tight">
              AI Road Defect &amp; Pothole Detection
            </h1>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl font-normal">
              Real-time on-device computer vision for road distress detection, automated severity classification, and municipal maintenance workflow.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/scanner"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-98"
              >
                <Camera className="w-4 h-4" />
                <span>Launch AI Scanner</span>
              </Link>

              <Link
                to="/defects"
                className="px-4 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-stone-700 active:scale-98"
              >
                <Layers className="w-4 h-4" />
                <span>View Defects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Right Column: 3 Empirical Performance Metric Cards */}
          <div className="lg:col-span-5 grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 text-center flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">
                mAP@50
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono my-1">
                85.8%
              </span>
              <span className="text-[10px] text-stone-500 font-mono truncate">
                Held-out Test
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 text-center flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">
                Latency
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono my-1">
                73.6 ms
              </span>
              <span className="text-[10px] text-stone-500 font-mono truncate">
                13.6 FPS CPU
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900/90 border border-stone-800 text-center flex flex-col justify-between">
              <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold block">
                Model Size
              </span>
              <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono my-1">
                3.1 MB
              </span>
              <span className="text-[10px] text-stone-500 font-mono truncate">
                YOLO11n INT8
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
