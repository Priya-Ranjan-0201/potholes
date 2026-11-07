import React from "react";
import { useTheme } from "../context/ThemeContext";
import { THEME_DEFINITIONS, ThemePreset } from "./tokens";
import { Sun, Moon } from "../components/Icons";

interface ThemePickerProps {
  className?: string;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({ className = "" }) => {
  const { themePreset, setThemePreset, mode, toggleTheme, reducedMotion, setReducedMotion } = useTheme();

  const themes: ThemePreset[] = [
    "holi-highway",
    "truck-art-neon",
    "monsoon-dusk",
    "punjab-fields",
  ];

  return (
    <div className={`dhaba-card p-5 border-2 space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h3 className="text-sm font-black font-signboard text-stone-900 dark:text-stone-100">
            Road Theme &amp; Palette
          </h3>
          <p className="text-[11px] text-stone-500">
            Selectable vibrant visual styles inspired by Indian highways &amp; folk art.
          </p>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center gap-1.5 shadow-xs transition hover:scale-105"
          title={`Switch to ${mode === "dark" ? "Light" : "Dark"} mode`}
        >
          {mode === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
          <span className="capitalize">{mode}</span>
        </button>
      </div>

      {/* 4 Theme Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {themes.map((tKey) => {
          const def = THEME_DEFINITIONS[tKey];
          const isSelected = themePreset === tKey;
          return (
            <button
              key={tKey}
              onClick={() => setThemePreset(tKey)}
              className={`p-3 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-amber-500 bg-amber-500/10 shadow-sm"
                  : "border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 bg-stone-50 dark:bg-stone-900/50"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-xs text-stone-900 dark:text-stone-100 font-signboard">
                  {def.name}
                </span>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
                )}
              </div>
              <p className="text-[10px] text-stone-500 line-clamp-1 mb-2">
                {def.tagline}
              </p>
              <div className="flex items-center gap-1">
                {def.swatches.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 rounded-full border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Reduced Motion Setting Toggle (Rule U6) */}
      <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
        <div>
          <span className="font-bold text-stone-800 dark:text-stone-200 block">
            Reduce Motion
          </span>
          <span className="text-[10px] text-stone-500">
            Pause parallax, marquee ticker, and petal bursts
          </span>
        </div>
        <button
          onClick={() => setReducedMotion(!reducedMotion)}
          className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
            reducedMotion ? "bg-amber-500" : "bg-stone-300 dark:bg-stone-700"
          }`}
          role="switch"
          aria-checked={reducedMotion}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white transition-transform ${
              reducedMotion ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

