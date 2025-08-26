import React from "react";
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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import UserEntityManagement from "./pages/UserEntityManagement";
import ReportStructures from "./pages/ReportStructures";
import CoATranslator from "./pages/CoATranslator";
import CoAMapper from "./pages/CoAMapper";
import TrialBalanceImport from "./pages/TrialBalanceImport";
import JournalImport from "./pages/JournalImport";
import FinancialReports from "./pages/FinancialReports";
import SqlTables from "./pages/SqlTables";
import AccountProfile from "./pages/AccountProfile";
import MemoryMaintenance from "./pages/MemoryMaintenance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedRoutes() {
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

  // Auth route doesn't need sidebar
  if (!user) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    );
  }

  // Authenticated routes with sidebar
  return (
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
            <Routes>
            <Route path="/auth" element={<Navigate to="/home" replace />} />
            <Route path="/auth/callback" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={<Navigate to="/admin/user-entity-management" replace />} />
            <Route path="/admin/user-entity-management/*" element={
              <AdminRoute>
                <UserEntityManagement />
              </AdminRoute>
            } />
            <Route path="/admin/report-configuration" element={
              <SuperAdminRoute>
                <ReportStructures />
              </SuperAdminRoute>
            } />
            <Route path="/admin/memory-maintenance" element={
              <ProtectedRoute>
                <MemoryMaintenance />
              </ProtectedRoute>
            } />
            <Route path="/data/coa-translator" element={
              <AdminRoute>
                <CoATranslator />
              </AdminRoute>
            } />
            <Route path="/data/coa-mapper" element={
              <ProtectedRoute>
                <CoAMapper />
              </ProtectedRoute>
            } />
            <Route path="/data/trial-balance-import" element={
              <ProtectedRoute>
                <TrialBalanceImport />
              </ProtectedRoute>
            } />
            <Route path="/data/journal-import" element={
              <ProtectedRoute>
                <JournalImport />
              </ProtectedRoute>
            } />
            <Route path="/reports/financial-reports" element={
              <ProtectedRoute>
                <FinancialReports />
              </ProtectedRoute>
            } />
            <Route path="/reports/sql-tables" element={
              <AdminRoute>
                <SqlTables />
              </AdminRoute>
            } />
            <Route path="/account/profile" element={
              <ProtectedRoute>
                <AccountProfile />
              </ProtectedRoute>
            } />
            {/* Legacy redirects for old routes */}
            <Route path="/report-structures" element={<Navigate to="/admin/report-configuration" replace />} />
            <Route path="/coa-translator" element={<Navigate to="/data/coa-translator" replace />} />
            <Route path="/coa-mapper" element={<Navigate to="/data/coa-mapper" replace />} />
            <Route path="/trial-balance-import" element={<Navigate to="/data/trial-balance-import" replace />} />
            <Route path="/journal-import" element={<Navigate to="/data/journal-import" replace />} />
            <Route path="/memory" element={<Navigate to="/admin/memory-maintenance" replace />} />
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
  <ErrorBoundary>
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
  </ErrorBoundary>
);

export default App;
