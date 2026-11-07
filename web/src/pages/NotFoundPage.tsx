import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "../components/Icons";
import { Plate } from "../ui/Plate";
import { CatsEye } from "../ui/CatsEye";

export const NotFoundPage: React.FC = () => {

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12">
      {/* Road Closed Dhaba Signboard Plate */}
      <Plate tilt="left" color="vermilion" subtitle="National Highway NH-44 · Diversion Enforced">
        <span className="flex items-center gap-2 text-xl sm:text-2xl font-black font-signboard">
          <AlertTriangle className="w-6 h-6 text-amber-300" />
          <span>ROAD CLOSED — DIVERSION AHEAD</span>
        </span>
      </Plate>

      {/* Friendly Folk Mascot "Gaddha" Crater SVG */}
      <div className="w-28 h-28 my-6 relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
          <ellipse cx="50" cy="55" rx="42" ry="26" fill="#1B1308" stroke="#FFB300" strokeWidth="2.5" />
          <ellipse cx="50" cy="53" rx="34" ry="19" fill="#2B2F8F" opacity="0.4" />
          <circle cx="42" cy="50" r="4.5" fill="#FFFFFF" />
          <circle cx="43" cy="50" r="2.5" fill="#1B1308" />
          <circle cx="58" cy="50" r="4.5" fill="#FFFFFF" />
          <circle cx="59" cy="50" r="2.5" fill="#1B1308" />
          <path d="M46,58 Q50,63 54,58" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" fill="none" />
          <polygon points="68,24 74,44 62,44" fill="#E8452C" stroke="#FFFFFF" strokeWidth="1" />
          <rect x="67" y="44" width="2" height="12" fill="#FFB300" />
        </svg>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-stone-100 font-signboard mb-2">
        404 — Route Milestone Not Found
      </h1>

      <p className="max-w-md text-xs sm:text-sm text-stone-600 dark:text-stone-400 mb-6 leading-relaxed">
        The requested roadway corridor does not exist or has been diverted for maintenance. Please follow the detour back to the operations command center.
      </p>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs transition-all shadow-md hover:scale-102"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Detour to Dashboard (KM 00)</span>
          <CatsEye color="peacock" size="sm" />
        </Link>
      </div>
    </div>
  );
};
