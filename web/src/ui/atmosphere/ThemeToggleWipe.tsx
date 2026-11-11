import React from "react";
import { Sun, Moon } from "../../components/Icons";
import { useTheme } from "../../context/ThemeContext";
import { useReducedMotion } from "../../motion/motion";

interface ThemeToggleWipeProps {
  className?: string;
}

/**
 * Theme toggle button with light/dark transition (crossfade on reduced motion).
 */
export const ThemeToggleWipe: React.FC<ThemeToggleWipeProps> = ({
  className = "",
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const isReduced = useReducedMotion();

  const handleToggle = () => {
    if (isReduced) {
      toggleTheme();
      return;
    }

    // Horizontal wipe clip-path animation
    const docEl = document.documentElement;
    docEl.style.transition = "background-color 400ms cubic-bezier(0.2, 0, 0, 1), color 400ms cubic-bezier(0.2, 0, 0, 1)";
    toggleTheme();
    setTimeout(() => {
      docEl.style.transition = "";
    }, 450);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`p-2 rounded-md bg-surface-solid border border-border text-muted hover:text-text hover:border-border-strong transition-all duration-150 cursor-pointer ${className}`}
      title={isDark ? "Switch to Morning India light mode" : "Switch to Night Highway dark mode"}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-primary" />
      ) : (
        <Moon className="w-4 h-4 text-primary" />
      )}
    </button>
  );
};

