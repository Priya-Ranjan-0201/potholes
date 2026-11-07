import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, CheckCircle2, Radio, BarChart3, ShieldCheck } from "./Icons";
import { useLanguage } from "../context/LanguageContext";
import { Logo } from "./Logo";
import { CatsEye } from "../ui/CatsEye";
import { OrnamentFrame } from "../ui/OrnamentFrame";

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto bg-[#0A0C12] text-[#F3EEE2] border-t-2 border-amber-500/20 transition-colors">
      {/* Truck Rear Bumper Chevron Reflective Band */}
      <OrnamentFrame variant="bumperChevron" className="my-0 rounded-none h-2.5 opacity-80" />

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Research Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <Logo showWordmark={false} size="md" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-white tracking-tight font-signboard">
                    Scam<span className="text-amber-500">Road</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-mono">
                    NH-44 Viva Build
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-medium">
                  {t("appSubtitle")}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed max-w-md">
              {t("scannerSubtitle")}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-400">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("privacyActive")}
              </span>
              <span>•</span>
              <span className="text-amber-400/90 font-mono">{t("helplineText")}</span>
            </div>
          </div>

          {/* Navigation Portals */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
              <CatsEye color="amber" size="sm" />
              <span>Route Milestones</span>
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/scanner" className="text-stone-300 hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t("navScanner")} (KM 01)</span>
                </Link>
              </li>
              <li>
                <Link to="/maintenance" className="text-stone-300 hover:text-amber-400 transition-colors">
                  <span>{t("navWorkOrders")} (KM 02)</span>
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="text-stone-300 hover:text-amber-400 transition-colors">
                  <span>{t("navComplaints")} (KM 03)</span>
                </Link>
              </li>
              <li>
                <Link to="/defects" className="text-stone-300 hover:text-amber-400 transition-colors">
                  <span>{t("navDefects")} (KM 04)</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Telemetry & Legal Transparency */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 font-mono">
              <CatsEye color="peacock" size="sm" />
              <span>Edge Telemetry</span>
            </h4>
            <div className="space-y-2 text-xs text-stone-400">
              <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                <span className="block text-stone-200 font-bold text-[11px]">Neural Engine</span>
                <span className="text-[11px] text-emerald-400 font-mono">YOLO11n INT8 (13.6 FPS ONNX CPU)</span>
              </div>
              <div className="bg-stone-900/90 p-2.5 rounded-lg border border-stone-800">
                <span className="block text-stone-200 font-bold text-[11px]">Road Standards</span>
                <span className="text-[11px] text-amber-300 font-mono">Severity rubric inspired by public IRC guidance</span>
              </div>
              <div className="pt-1 flex items-center gap-3">
                <Link to="/evaluation" className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Empirical Proofs</span>
                </Link>
                <Link to="/capture" className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]">
                  <Radio className="w-3.5 h-3.5" />
                  <span>PWA Capture</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Jaali Divider */}
        <OrnamentFrame variant="jaaliDivider" className="my-6 opacity-40" />

        {/* Mandatory Student Disclaimer (Rule F3 & R7) */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-mono">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-[11px] text-stone-400 font-medium">
              Student research project. Not an official government system. Not safety-certified.
            </p>
          </div>
          <div className="flex items-center gap-4 text-[11px] shrink-0">
            <span>IRC:82-2023 Inspired Rubric</span>
            <span>•</span>
            <span>Zero Fake AI Verified</span>
            <span>•</span>
            <span>v1.2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
