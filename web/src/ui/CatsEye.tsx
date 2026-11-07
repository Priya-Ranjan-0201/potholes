import React from "react";

interface CatsEyeProps {
  color?: "amber" | "peacock" | "red" | "white";
  size?: "sm" | "md" | "lg";
  className?: string;
  pulse?: boolean;
}

export const CatsEye: React.FC<CatsEyeProps> = ({
  color = "amber",
  size = "md",
  className = "",
  pulse = false,
}) => {
  const sizeClass = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
  }[size];

  const colorStyles = {
    amber: "bg-[#FFB300] shadow-[0_0_8px_1.5px_rgba(255,179,0,0.7)] hover:shadow-[0_0_14px_3px_rgba(255,179,0,0.95)]",
    peacock: "bg-[#00D1D1] shadow-[0_0_8px_1.5px_rgba(0,209,209,0.7)] hover:shadow-[0_0_14px_3px_rgba(0,209,209,0.95)]",
    red: "bg-[#D7263D] shadow-[0_0_8px_1.5px_rgba(215,38,61,0.7)] hover:shadow-[0_0_14px_3px_rgba(215,38,61,0.95)]",
    white: "bg-white shadow-[0_0_8px_1.5px_rgba(255,255,255,0.7)] hover:shadow-[0_0_14px_3px_rgba(255,255,255,0.95)]",
  }[color];

  return (
    <span
      className={`inline-block rounded-full transition-transform duration-200 hover:scale-125 focus:scale-125 shrink-0 ${sizeClass} ${colorStyles} ${
        pulse ? "animate-pulse" : ""
      } ${className}`}
      aria-hidden="true"
    />
  );
};

