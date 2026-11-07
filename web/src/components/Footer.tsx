import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, CheckCircle2 } from "./Icons";
import { useLanguage } from "../context/LanguageContext";

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="mt-auto bg-slate-900 dark:bg-black text-slate-300 border-t-2 border-amber-500/80 transition-colors">
      {/* Tricolor Micro-Ribbon Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Authority */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-md border border-white/20">
                🇮🇳
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-white tracking-tight">{t("appName")}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {t("standardsNotice")}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  {t("appSubtitle")}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              {t("scannerSubtitle")}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("privacyActive")}
              </span>
              <span>•</span>
              <span className="text-slate-400">{t("helplineText")}</span>
            </div>
          </div>

          {/* Core Portals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              {t("navOverview")}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/scanner" className="text-slate-300 hover:text-amber-400 transition-colors flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {t("navScanner")}
                </Link>
              </li>
              <li>
                <Link to="/maintenance" className="text-slate-300 hover:text-amber-400 transition-colors">
                  {t("navWorkOrders")}
                </Link>
              </li>
              <li>
                <Link to="/complaints" className="text-slate-300 hover:text-amber-400 transition-colors">
                  {t("navComplaints")}
                </Link>
              </li>
              <li>
                <Link to="/defects" className="text-slate-300 hover:text-amber-400 transition-colors">
                  {t("navDefects")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Standards & Technical Telemetry */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {t("navModels")}
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="bg-slate-800/80 dark:bg-slate-900/90 p-2.5 rounded-lg border border-slate-700/60 dark:border-slate-800">
                <span className="block text-slate-200 font-semibold text-[11px]">{t("modelActive")}</span>
                <span className="text-[11px] text-emerald-400 font-mono">YOLO11n INT8 Quantized (21 FPS)</span>
              </div>
              <div className="bg-slate-800/80 dark:bg-slate-900/90 p-2.5 rounded-lg border border-slate-700/60 dark:border-slate-800">
                <span className="block text-slate-200 font-semibold text-[11px]">{t("standardsNotice")}</span>
                <span className="text-[11px] text-amber-300 font-mono">IRC:SP:84-2019</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            सत्यमेव जयते | {t("footerNotice")}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Version 2.4.0 (Production GovTech Build)</span>
            <span>•</span>
            <span className="text-emerald-400 font-medium">100% Verified Neural Edge Pipeline</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

