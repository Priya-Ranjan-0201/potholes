import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemePreset, THEME_DEFINITIONS } from "../ui/tokens";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  themePreset: ThemePreset;
  setThemePreset: (preset: ThemePreset) => void;
  theme: ThemeMode; // Compatibility with v8 components
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  reducedMotion: boolean;
  setReducedMotion: (reduce: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreset, setThemePresetState] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem("scamroad_theme_preset");
    if (saved && saved in THEME_DEFINITIONS) {
      return saved as ThemePreset;
    }
    return "holi-highway"; // Default: Theme A (Holi Highway)
  });

  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("scamroad_theme");
    if (saved === "light" || saved === "dark") return saved;
    return "dark"; // Default to dark mode for cinematic night highway
  });

  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    return localStorage.getItem("scamroad_reduced_motion") === "true";
  });

  useEffect(() => {
    const root = document.documentElement;

    // Apply preset attribute
    root.setAttribute("data-theme", themePreset);
    localStorage.setItem("scamroad_theme_preset", themePreset);

    // Apply dark/light class
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("scamroad_theme", mode);

    // Apply reduced motion class
    if (reducedMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
    localStorage.setItem("scamroad_reduced_motion", String(reducedMotion));
  }, [themePreset, mode, reducedMotion]);

  const toggleTheme = () => {
    setModeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  const setThemePreset = (preset: ThemePreset) => {
    setThemePresetState(preset);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const setReducedMotion = (reduce: boolean) => {
    setReducedMotionState(reduce);
  };

  return (
    <ThemeContext.Provider
      value={{
        themePreset,
        setThemePreset,
        theme: mode,
        mode,
        setMode,
        toggleTheme,
        reducedMotion,
        setReducedMotion,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
