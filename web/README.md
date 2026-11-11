# ScamRoad — Web Frontend Architecture

Modern React 18 + TypeScript single-page application for the ScamRoad Road Defect Surveillance and Municipal Operations Portal.

---

## 🏗️ Directory Layout

```
web/
├── src/
│   ├── pages/               # Top-Level Application Views
│   │   ├── ScannerPage.tsx      # 🛣️ Real-Time Defect Scanner with 70/30 AI Ensemble
│   │   ├── DashboardPage.tsx    # 📊 Executive Ward Metrics & Corridor Distress Leaderboard
│   │   ├── MaintenancePage.tsx  # 🛠️ Work Order Lifecycle, Contractor Dispatch & Verification
│   │   └── BenchmarksPage.tsx   # 🧪 Empirical Evaluation Metrics & Confusion Matrix
│   ├── motion/              # Visual Presentation & Motion Primitives
│   │   ├── BoxOverlay.tsx       # 🎯 Polygonal Segmentation Masks & Dark Bounding Boxes
│   │   ├── CompareSlider.tsx    # ↔️ Interactive Before/After Split Comparison Slider
│   │   ├── ImageViewer.tsx      # 🔍 Deep Zoom & Pan Defect Inspector
│   │   └── ScanLine.tsx         # 📡 Active Inference Scan Animation
│   ├── components/          # Reusable UI Blocks (Navbar, Header, Status Badges, Icons)
│   ├── ui/                  # Design System Primitives (Buttons, Cards, Dialogs, Inputs)
│   ├── utils/               # Utilities
│   │   └── cvDetector.ts        # ⚡ API Bridge communicating with /api/v1/infer
│   ├── context/             # Global Contexts (ThemeContext, ToastContext)
│   ├── App.tsx              # Root router configuration
│   └── main.tsx             # Application DOM mounting
├── public/                  # Static assets & /samples/ benchmark images
│   └── samples/             # Bengaluru, Mumbai, Alligator Cracks & Diagram test imagery
├── dist/                    # Optimized production bundle (`npm run build`)
├── vite.config.ts           # Vite proxying `/api` -> `http://localhost:8000`
└── package.json             # Dependencies and scripts
```

---

## 🚀 Running the Frontend

```bash
cd web
npm run dev
```
*Listens on `http://localhost:3000`. Proxies all `/api/*` network requests automatically to the backend on `http://localhost:8000`.*

---

## 📦 Building for Production

```bash
cd web
npm run build
```
*Typechecks with `tsc` and bundles with Vite. Generates minified assets in `web/dist/`.*
