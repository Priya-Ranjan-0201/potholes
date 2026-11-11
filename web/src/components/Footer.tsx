import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { useLanguage } from "../context/LanguageContext";

export const Footer: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const { t } = useLanguage();

  useEffect(() => {
    let mounted = true;
    api.health()
      .then(() => {
        if (mounted) setIsOnline(true);
      })
      .catch(() => {
        if (mounted) setIsOnline(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 text-xs">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isOnline ? "bg-emerald-500" : "bg-rose-500"
            }`}
            title={isOnline ? "API Online" : "API Offline"}
          />
          <span className="font-medium text-slate-700 dark:text-slate-300">ScamRoad</span>
        </div>

        <p className="text-[11px] text-center">{t("footerNotice")}</p>
      </div>
    </footer>
  );
};
