import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { SuperAdminRoute } from "@/components/SuperAdminRoute";
import { AppSidebar } from "@/components/AppSidebar";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import ReportStructures from "./pages/ReportStructures";
import UploadFile from "./pages/UploadFile";
import ManualMapping from "./pages/ManualMapping";
import { MemoryUpload } from "./pages/MemoryUpload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Auth route doesn't need sidebar
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Authenticated routes with sidebar
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b px-4">
            <SidebarTrigger className="p-0 h-auto border-0 bg-transparent hover:bg-transparent">
              <span className="sr-only">Toggle Sidebar</span>
            </SidebarTrigger>
            <Zap className="w-5 h-5 ml-4 mr-2 text-primary" />
            <h1 className="font-semibold">AI-Powered Data Transformer</h1>
          </header>
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/auth" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              } />
              <Route path="/report-structures" element={
                <SuperAdminRoute>
                  <ReportStructures />
                </SuperAdminRoute>
              } />
              <Route path="/upload" element={
                <ProtectedRoute>
                  <UploadFile />
                </ProtectedRoute>
              } />
              <Route path="/manual-mapping" element={
                <ProtectedRoute>
                  <ManualMapping />
                </ProtectedRoute>
              } />
              <Route path="/memory" element={
                <ProtectedRoute>
                  <MemoryUpload />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthenticatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
