import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthRoute } from '@/features/auth';

// Page imports
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import UserEntityManagement from '@/pages/UserEntityManagement';
import ReportStructures from '@/pages/ReportStructures';
import CoATranslator from '@/pages/CoATranslator';
import CoAMapper from '@/pages/CoAMapper';
import TrialBalanceImport from '@/pages/TrialBalanceImport';
import JournalImport from '@/pages/JournalImport';
import FinancialReports from '@/pages/FinancialReports';
import SqlTables from '@/pages/SqlTables';
import AccountProfile from '@/pages/AccountProfile';
import MemoryMaintenance from '@/pages/MemoryMaintenance';
import ActivityLog from '@/pages/ActivityLog';
import SystemAdministration from '@/pages/SystemAdministration';
import SystemTools from '@/pages/SystemTools';
import DatabaseDocumentation from '@/pages/system-tools/DatabaseDocumentation';
import NotFound from '@/pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/home" element={
        <AuthRoute>
          <Home />
        </AuthRoute>
      } />
      <Route path="/dashboard" element={
        <AuthRoute>
          <Dashboard />
        </AuthRoute>
      } />
      <Route path="/admin" element={<Navigate to="/admin/user-entity-management" replace />} />
      <Route path="/admin/user-entity-management/*" element={
        <AuthRoute requireAdmin>
          <UserEntityManagement />
        </AuthRoute>
      } />
      <Route path="/admin/report-configuration" element={
        <AuthRoute requireSuperAdmin>
          <ReportStructures />
        </AuthRoute>
      } />
      <Route path="/admin/memory-maintenance" element={
        <AuthRoute>
          <MemoryMaintenance />
        </AuthRoute>
      } />
      <Route path="/admin/activity-log" element={
        <AuthRoute requireAdmin>
          <ActivityLog />
        </AuthRoute>
      } />
      <Route path="/admin/system-tools" element={
        <AuthRoute requireSuperAdmin>
          <SystemTools />
        </AuthRoute>
      } />
      <Route path="/admin/system-tools/database-docs" element={
        <AuthRoute requireSuperAdmin>
          <DatabaseDocumentation />
        </AuthRoute>
      } />
      <Route path="/admin/system-tools/codebase-docs" element={
        <AuthRoute requireSuperAdmin>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Codebase Documentation Generator</h1>
            <p className="text-muted-foreground">Coming soon - Generate comprehensive documentation of the codebase structure</p>
          </div>
        </AuthRoute>
      } />
      <Route path="/admin/system-tools/file-organizer" element={
        <AuthRoute requireSuperAdmin>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">File Structure Organizer</h1>
            <p className="text-muted-foreground">Coming soon - Organize and optimize codebase file structure</p>
          </div>
        </AuthRoute>
      } />
      <Route path="/admin/system-tools/performance" element={
        <AuthRoute requireSuperAdmin>
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Database Performance Analyzer</h1>
            <p className="text-muted-foreground">Coming soon - Analyze database performance and optimize queries</p>
          </div>
        </AuthRoute>
      } />
      {/* Legacy redirect for old system admin route */}
      <Route path="/admin/system" element={<Navigate to="/admin/system-tools" replace />} />
      <Route path="/data/coa-translator" element={
        <AuthRoute requireAdmin>
          <CoATranslator />
        </AuthRoute>
      } />
      <Route path="/data/coa-mapper" element={
        <AuthRoute>
          <CoAMapper />
        </AuthRoute>
      } />
      <Route path="/data/trial-balance-import" element={
        <AuthRoute>
          <TrialBalanceImport />
        </AuthRoute>
      } />
      <Route path="/data/journal-import" element={
        <AuthRoute>
          <JournalImport />
        </AuthRoute>
      } />
      <Route path="/reports/financial-reports" element={
        <AuthRoute>
          <FinancialReports />
        </AuthRoute>
      } />
      <Route path="/reports/sql-tables" element={
        <AuthRoute requireAdmin>
          <SqlTables />
        </AuthRoute>
      } />
      <Route path="/account/profile" element={
        <AuthRoute>
          <AccountProfile />
        </AuthRoute>
      } />
      {/* Legacy redirects for old routes */}
      <Route path="/report-structures" element={<Navigate to="/admin/report-configuration" replace />} />
      <Route path="/coa-translator" element={<Navigate to="/data/coa-translator" replace />} />
      <Route path="/coa-mapper" element={<Navigate to="/data/coa-mapper" replace />} />
      <Route path="/trial-balance-import" element={<Navigate to="/data/trial-balance-import" replace />} />
      <Route path="/journal-import" element={<Navigate to="/data/journal-import" replace />} />
      <Route path="/memory" element={<Navigate to="/admin/memory-maintenance" replace />} />

      {/* Redirect auth paths when already authenticated */}
      <Route path="/auth" element={<Navigate to="/home" replace />} />
      <Route path="/auth/callback" element={<Navigate to="/home" replace />} />
      
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}