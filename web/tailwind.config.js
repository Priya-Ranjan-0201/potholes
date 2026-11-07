/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        scamroad: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        civic: {
          saffron: "#ea580c",
          ashokNavy: "#0f264d",
          navy: "#0a192f",
          green: "#059669",
          cyberObsidian: "#070a14",
          cyberCard: "#0c1427",
          cyberBorder: "rgba(56, 189, 248, 0.2)",
          cyberCyan: "#06b6d4",
          cleanWhite: "#ffffff",
          cleanSlate: "#f4f6fb",
        },
        severity: {
          critical: "#dc2626",
          severe: "#ea580c",
          moderate: "#eab308",
          minor: "#22c55e",
        },
      },
    },
  },
  plugins: [],
};
