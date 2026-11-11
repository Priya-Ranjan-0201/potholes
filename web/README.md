# ScamRoad — Web Frontend Architecture

React 18, TypeScript, and Tailwind CSS web interface for road defect scanning, maintenance tracking, and model evaluation.

---

## Directory Layout

```text
web/
├── src/
│   ├── pages/
│   │   ├── ScannerPage.tsx          # Defect scanner UI connected to /api/v1/infer
│   │   ├── DashboardPage.tsx        # Ward summary and corridor defect counts
│   │   ├── MaintenancePage.tsx      # Defect table, work orders, reports, repair verification
│   │   ├── ModelBenchmarksPage.tsx  # Evaluation metrics, confusion matrix, hardware table
│   │   ├── LandingPage.tsx          # Project overview and capabilities summary
│   │   └── LoginPage.tsx            # Engineer / staff login form
│   ├── motion/
│   │   ├── BoxOverlay.tsx           # SVG bounding boxes, polygons, and labels
│   │   ├── CompareSlider.tsx        # Before/after split image slider
│   │   ├── ImageViewer.tsx          # Zoom and pan image viewer
│   │   └── ScanLine.tsx             # Active scan indicator
│   ├── components/                  # Navbar, Footer, ThemeToggle, CommandPalette, Icons, RepairVerification
│   ├── ui/                          # Reusable buttons, badges, stat cards, and modals
│   ├── utils/cvDetector.ts          # Client wrapper for POST /api/v1/infer
│   ├── context/                     # Theme, Toast, Auth, and Language contexts
│   ├── App.tsx                      # Application router
│   └── main.tsx                     # DOM entrypoint
├── public/samples/                  # Local road test images (Bengaluru, Mumbai, crater, cracks)
├── dist/                            # Production bundle (`npm run build`)
├── vite.config.ts                   # Dev proxy forwarding `/api` -> `http://localhost:8000`
└── package.json                     # Dependencies and npm scripts
```

---

## Development & Build

```bash
cd web
npm run dev      # Dev server on http://localhost:3000
npm test -- --run
npm run build    # TypeScript check (`tsc`) + Vite production bundle
```
