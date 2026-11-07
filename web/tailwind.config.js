/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Truck-Art Accents (Both Themes)
        marigold: {
          DEFAULT: "#FFB300",
          light: "#FFC833",
          dark: "#D69400",
          50: "#FFF9E6",
        },
        vermilion: {
          DEFAULT: "#E8452C",
          light: "#EE6A57",
          dark: "#C32F18",
          50: "#FDF1EF",
        },
        peacock: {
          DEFAULT: "#00A3A3",
          light: "#26BDBD",
          dark: "#007A7A",
          50: "#E6F6F6",
        },
        indigoRoad: {
          DEFAULT: "#2B2F8F",
          light: "#4B4FAF",
          dark: "#1E2166",
          50: "#EAEBFA",
        },
        magentaTruck: {
          DEFAULT: "#D61F6B",
          light: "#E34D8D",
          dark: "#AB1252",
        },
        leafGreen: {
          DEFAULT: "#2FA66A",
          light: "#4EC487",
          dark: "#207A4D",
        },
        milestoneYellow: {
          DEFAULT: "#F7C61B",
          light: "#F9D54D",
          dark: "#CFA00A",
        },

        // Theme Canvas & Surface Tokens (Dhaba Dawn / Highway Night mapped via CSS vars)
        theme: {
          canvas: "var(--theme-bg)",
          surface: "var(--theme-surface)",
          surface2: "var(--theme-surface-2)",
          border: "var(--theme-border)",
          text: "var(--theme-text)",
          muted: "var(--theme-muted)",
          primary: "var(--theme-primary)",
          primaryContrast: "var(--theme-primary-contrast)",
          accent: "var(--theme-accent)",
          focusRing: "var(--theme-focus-ring)",
        },

        // Severity Road Sign Colors (Rule F2 & Concept 2.1)
        severity: {
          minor: "#1E78D0",    // Blue circle info sign (0-25)
          moderate: "#F2B705", // Yellow triangle warning sign (26-50)
          severe: "#F26A1B",   // Orange diamond warning sign (51-75)
          critical: "#D7263D", // Red octagon stop hazard sign (76-100)
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '"Inter"',
          '"Noto Sans Devanagari"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        signboard: ['"Plus Jakarta Sans"', 'impact', 'sans-serif'],
      },
      boxShadow: {
        dhaba: "0 6px 18px -3px rgba(92, 74, 46, 0.12), 0 2px 6px -1px rgba(92, 74, 46, 0.08)",
        highway: "0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 20px -3px rgba(255, 179, 0, 0.15)",
        catseye: "0 0 10px 2px rgba(255, 179, 0, 0.6)",
        catseyePeacock: "0 0 10px 2px rgba(0, 209, 209, 0.6)",
        plate: "3px 3px 0px 0px rgba(27, 19, 8, 0.8)",
      },
      borderRadius: {
        milestone: "28px 28px 10px 10px",
        plate: "6px",
      },
    },
  },
  plugins: [],
};
