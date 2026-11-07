import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { LanguageProvider } from "./context/LanguageContext";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { CommandPalette } from "./components/CommandPalette";
import { DashboardPage } from "./pages/DashboardPage";
import { ScannerPage } from "./pages/ScannerPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { DefectsPage } from "./pages/DefectsPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { ComplaintsPage } from "./pages/ComplaintsPage";
import { FleetPage } from "./pages/FleetPage";
import { InspectionPage } from "./pages/InspectionPage";
import { ModelsPage } from "./pages/ModelsPage";
import { EvaluationPage } from "./pages/EvaluationPage";
import { CapturePage } from "./pages/CapturePage";
import { ForecastsPage } from "./pages/ForecastsPage";
import { DesignLabPage } from "./pages/DesignLabPage";

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
              <div className="min-h-screen flex flex-col font-sans antialiased text-stone-900 dark:text-stone-100 bg-[#FFF8EC] dark:bg-[#0A0C12] transition-colors duration-300">
                <CommandPalette />
                <Navbar />
                <main className="flex-1 w-full px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-6 pb-16 transition-all duration-200">
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/scanner" element={<ScannerPage />} />
                    <Route path="/defects" element={<DefectsPage />} />
                    <Route path="/maintenance" element={<MaintenancePage />} />
                    <Route path="/complaints" element={<ComplaintsPage />} />
                    <Route path="/fleet" element={<FleetPage />} />
                    <Route path="/inspection" element={<InspectionPage />} />
                    <Route path="/models" element={<ModelsPage />} />
                    <Route path="/evaluation" element={<EvaluationPage />} />
                    <Route path="/capture" element={<CapturePage />} />
                    <Route path="/forecasts" element={<ForecastsPage />} />
                    <Route path="/design-lab" element={<DesignLabPage />} />
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
