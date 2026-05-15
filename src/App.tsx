import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { MedicalProvider } from "@/context/MedicalContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Route-level code splitting: each page becomes its own chunk so the initial
// bundle parse stays small and Max Potential FID drops.
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const WelcomeSandbox = lazy(() => import("./pages/WelcomeSandbox"));
const Intake = lazy(() => import("./pages/Intake"));
const NewMedicalDashboard = lazy(() => import("./pages/Dashboard"));
const PatientView = lazy(() => import("./pages/PatientView"));
const AssessmentSummary = lazy(() => import("./pages/AssessmentSummary"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <MedicalProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/auth" element={<WelcomeSandbox />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <NewMedicalDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/patient/:id" element={
                  <ProtectedRoute>
                    <PatientView />
                  </ProtectedRoute>
                } />
                <Route path="/intake" element={
                  <ProtectedRoute>
                    <Intake />
                  </ProtectedRoute>
                } />
                <Route path="/workflow" element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <footer className="text-center p-4 text-sm text-muted-foreground">Clinical Decision Support - v1.0</footer>
        </MedicalProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
