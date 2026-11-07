import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CommandPalette } from "./components/CommandPalette";
import { DashboardPage } from "./pages/DashboardPage";
import { ScannerPage } from "./pages/ScannerPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { ModelBenchmarksPage } from "./pages/ModelBenchmarksPage";
import { NotFoundPage } from "./pages/NotFoundPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <BrowserRouter>
              <div className="min-h-screen flex flex-col font-sans antialiased text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 transition-colors">
                <CommandPalette />
                <Navbar />
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <Routes>
                    {/* 4 Primary Navigation Routes */}
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/scanner" element={<ScannerPage />} />
                    <Route path="/maintenance" element={<MaintenancePage />} />
                    <Route path="/benchmarks" element={<ModelBenchmarksPage />} />

                    {/* Compatibility Redirects */}
                    <Route path="/defects" element={<Navigate to="/maintenance?tab=defects" replace />} />
                    <Route path="/complaints" element={<Navigate to="/maintenance?tab=reports" replace />} />
                    <Route path="/models" element={<Navigate to="/benchmarks" replace />} />
                    <Route path="/evaluation" element={<Navigate to="/benchmarks" replace />} />

                    {/* 404 Catch-all */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
