import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ToastProvider } from "./context/ToastContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CommandPalette } from "./components/CommandPalette";
import { ShortcutsModal } from "./motion/ShortcutsModal";
import { PageTransition } from "./motion/PageTransition";
import { DashboardPage } from "./pages/DashboardPage";
import { ScannerPage } from "./pages/ScannerPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { ModelBenchmarksPage } from "./pages/ModelBenchmarksPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(() => !navigator.onLine);
  const keySequenceRef = useRef<string[]>([]);
  const keyTimerRef = useRef<number | null>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }

      // Handle two-key sequences (e.g. g o, g s, g m, g b)
      if (e.key === "g" && keySequenceRef.current.length === 0) {
        keySequenceRef.current = ["g"];
        if (keyTimerRef.current) window.clearTimeout(keyTimerRef.current);
        keyTimerRef.current = window.setTimeout(() => {
          keySequenceRef.current = [];
        }, 1000);
        return;
      }

      if (keySequenceRef.current[0] === "g") {
        const nextKey = e.key.toLowerCase();
        keySequenceRef.current = [];
        if (nextKey === "o") {
          e.preventDefault();
          navigate("/");
        } else if (nextKey === "s") {
          e.preventDefault();
          navigate("/scanner");
        } else if (nextKey === "m") {
          e.preventDefault();
          navigate("/maintenance");
        } else if (nextKey === "b") {
          e.preventDefault();
          navigate("/benchmarks");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  // Online / Offline monitor
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col font-sans antialiased text-slate-900 dark:text-slate-100 bg-[var(--bg)] transition-colors">
      <CommandPalette />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* Offline Banner (Section 2: slides down 200ms) */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0, 0, 0.2, 1] }}
            className="overflow-hidden bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs py-2 px-4 text-center font-mono"
            role="status"
          >
            Offline Mode: Server unreachable. Sync queue active.
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Routes location={location}>
              {/* 4 Primary Navigation Routes */}
              <Route path="/" element={<DashboardPage />} />
              <Route path="/scanner" element={<ScannerPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/benchmarks" element={<ModelBenchmarksPage />} />

              {/* Public Atmosphere Pages */}
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Compatibility Redirects */}
              <Route path="/defects" element={<Navigate to="/maintenance?tab=defects" replace />} />
              <Route path="/complaints" element={<Navigate to="/maintenance?tab=reports" replace />} />
              <Route path="/models" element={<Navigate to="/benchmarks" replace />} />
              <Route path="/evaluation" element={<Navigate to="/benchmarks" replace />} />

              {/* 404 Catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </PageTransition>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <BrowserRouter>
                <AppShell />
              </BrowserRouter>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
