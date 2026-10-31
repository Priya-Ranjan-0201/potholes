import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { DashboardPage } from "./pages/DashboardPage";
import { MapPage } from "./pages/MapPage";
import { DefectsPage } from "./pages/DefectsPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { ComplaintsPage } from "./pages/ComplaintsPage";
import { FleetPage } from "./pages/FleetPage";
import { InspectionPage } from "./pages/InspectionPage";
import { ModelsPage } from "./pages/ModelsPage";

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
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-900">
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/defects" element={<DefectsPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/complaints" element={<ComplaintsPage />} />
                <Route path="/fleet" element={<FleetPage />} />
                <Route path="/inspection" element={<InspectionPage />} />
                <Route path="/models" element={<ModelsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
