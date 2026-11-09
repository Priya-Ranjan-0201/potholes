import React from "react";
import logoIcon from "../assets/logo-icon.png";
import logoHorizontalLight from "../assets/logo-horizontal.png";
import logoHorizontalDark from "../assets/logo-horizontal-dark.png";
import { useTheme } from "../context/ThemeContext";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "auto" | "light" | "dark";
  alt?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  showWordmark = false,
  size = "md",
  variant = "auto",
  alt = "ScamRoad",
}) => {
  const { theme } = useTheme();

  const isDark =
    variant === "dark" ? true : variant === "light" ? false : theme === "dark";

  if (showWordmark) {
    const heightClass = {
      sm: "h-7",
      md: "h-9",
      lg: "h-11",
      xl: "h-14",
    }[size];

    return (
      <img
        src={isDark ? logoHorizontalDark : logoHorizontalLight}
        alt={alt}
        className={`w-auto object-contain transition-transform hover:scale-[1.02] duration-200 select-none ${heightClass} ${className}`}
      />
    );
  }

  const dim = {
    sm: "w-8 h-8",
    md: "w-9 h-9",
    lg: "w-11 h-11",
    xl: "w-14 h-14",
  }[size];

  return (
    <img
      src={logoIcon}
      alt={alt}
      className={`rounded-xl transition-transform hover:scale-105 duration-200 object-contain shadow-sm select-none ${dim} ${className}`}
    />
  );
};
