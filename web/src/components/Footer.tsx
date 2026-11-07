import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Radio, BarChart3, ShieldCheck } from "./Icons";
import { useLanguage } from "../context/LanguageContext";
import { Logo } from "./Logo";

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto bg-[#0A0C12] text-[#F3EEE2] border-t border-stone-800 transition-colors">
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 sm:py-10">
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
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase font-mono">
                    v1.2
                  </span>
                </div>
                <p className="text-xs text-stone-400 font-medium">
                  {t("appSubtitle")}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-400 leading-relaxed max-w-md">
              Empirical edge AI detection for potholes and structural road distress, paired with municipal workflow tracking.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-400">
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("privacyActive")}
              </span>
              <span>•</span>
              <span className="text-amber-400/90 font-mono">{t("helplineText")}</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 font-mono">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-stone-300 hover:text-amber-400 transition-colors">
                  {t("navOverview")}
                </Link>
              </li>
              <li>
                <Link to="/scanner" className="text-stone-300 hover:text-amber-400 transition-colors">
                  {t("navScanner")}
                </Link>
              </li>
              <li>
                <Link to="/defects" className="text-stone-300 hover:text-amber-400 transition-colors">
                  {t("navDefects")}
                </Link>
              </li>
              <li>
                <Link to="/maintenance" className="text-stone-300 hover:text-amber-400 transition-colors">
                  {t("navWorkOrders")}
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="text-stone-300 hover:text-amber-400 transition-colors">
                  {t("navComplaints")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Edge AI Telemetry */}
          <div>
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider mb-3 font-mono">
              Model &amp; System
            </h4>
            <div className="space-y-2 text-xs text-stone-400">
              <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                <span className="block text-stone-200 font-bold text-[11px]">Neural Engine</span>
                <span className="text-[11px] text-emerald-400 font-mono">YOLO11n INT8 (73.6 ms CPU)</span>
              </div>
              <div className="bg-stone-900/80 p-2.5 rounded-lg border border-stone-800">
                <span className="block text-stone-200 font-bold text-[11px]">Road Standards</span>
                <span className="text-[11px] text-amber-300 font-mono">IRC:82-2023 Rubric Guidelines</span>
              </div>
              <div className="pt-1 flex items-center gap-3">
                <Link to="/evaluation" className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Evaluation Proofs</span>
                </Link>
                <Link to="/capture" className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Field Capture PWA</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Line Divider */}
        <div className="my-6 border-t border-stone-800" />

        {/* Mandatory Student Disclaimer (Rule F3 & R7) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500 font-mono">
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
