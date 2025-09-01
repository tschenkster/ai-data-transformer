import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppRoutes } from "@/app/routes/app-routes";
import { AppSidebar } from "@/components/AppSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LanguageProvider } from "@/components/LanguageProvider";
import { ContentLanguageProvider } from "@/contexts/ContentLanguageProvider";
import Homepage from "./pages/Homepage";
import Pricing from "./pages/Pricing";
import Register from "./pages/Register";
import Convert from "./pages/Convert";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Homepage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/convert" element={<Convert />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Protected routes */}
      {user ? (
        <Route path="/*" element={
          <SidebarProvider>
            <div className="min-h-screen flex flex-col w-full">
              {/* Global header with sidebar trigger */}
              <header className="h-12 flex items-center border-b bg-background px-4 md:hidden">
                <SidebarTrigger className="mr-2" />
                <h1 className="text-lg font-semibold">Data Transformer</h1>
              </header>
              
              <div className="flex flex-1 w-full">
                <AppSidebar />
                <main className="flex-1 overflow-auto">
                  <AppRoutes />
                </main>
              </div>
            </div>
          </SidebarProvider>
        } />
      ) : (
        <Route path="/*" element={<Navigate to="/auth" replace />} />
      )}
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <LanguageProvider>
              <ContentLanguageProvider>
                <AppContent />
              </ContentLanguageProvider>
            </LanguageProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
