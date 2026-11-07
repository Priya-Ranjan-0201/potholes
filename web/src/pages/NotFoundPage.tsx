import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "../components/Icons";
import { useLanguage } from "../context/LanguageContext";

export const NotFoundPage: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 ring-8 ring-amber-500/5">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-3">
        404 — Page Not Found
      </h1>
      <p className="max-w-md text-base text-slate-600 dark:text-slate-400 mb-8">
        The requested municipal route does not exist or has been removed. Check the URL or return to the operations overview.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all hover:shadow-md"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("navOverview")}
      </Link>
    </div>
  );
};

