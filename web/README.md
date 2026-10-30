# ScamRoad — Web Dashboard

React + TypeScript single-page application for the ScamRoad monitoring dashboard.

## Tech Stack

- **Framework:** React 18 with TypeScript (strict)
- **Build:** Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **Data Fetching:** TanStack React Query
- **Maps:** Leaflet + React-Leaflet
- **Charts:** Recharts
- **i18n:** i18next + react-i18next

## Getting Started

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Project Structure

```
web/
├── src/
│   ├── main.tsx        # Entry point
│   ├── App.tsx         # Root component & router
│   ├── index.css       # Tailwind imports
│   └── vite-env.d.ts   # Vite type declarations
├── index.html          # HTML shell
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.js   # PostCSS plugins
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies
```
