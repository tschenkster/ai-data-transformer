import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthRoute } from '@/features/auth';

// Page imports
import Start from '@/pages/Start';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import UserProfileManagement from '@/pages/UserProfileManagement';
import RolesPermissionsManagement from '@/pages/RolesPermissionsManagement';
import EntityManagementPage from '@/pages/EntityManagementPage';
import MultilingualManagement from '@/pages/MultilingualManagement';
import ReportStructureManager from '@/pages/ReportStructureManager';
import CoATranslator from '@/pages/CoATranslator';
import CoAMapper from '@/pages/CoAMapper';
import TrialBalanceImport from '@/pages/TrialBalanceImport';
import RawDataProcessor from '@/pages/RawDataProcessor';
import JournalImport from '@/pages/JournalImport';
import FinancialReports from '@/pages/FinancialReports';
import SqlTables from '@/pages/SqlTables';
import AccountProfile from '@/pages/AccountProfile';
import MemoryMaintenance from '@/pages/MemoryMaintenance';
import ActivityLog from '@/pages/ActivityLog';
import SystemAdministration from '@/pages/SystemAdministration';
import SystemTools from '@/pages/SystemTools';
import DatabaseDocumentation from '@/pages/system-tools/DatabaseDocumentation';
import CodebaseDocumentation from '@/pages/system-tools/CodebaseDocumentation';
import FileOrganizer from '@/pages/system-tools/FileOrganizer';
import PerformanceAnalyzer from '@/pages/system-tools/PerformanceAnalyzer';
import HistoricTranslationFixer from '@/pages/system-tools/HistoricTranslationFixer';
import SqlMaintenance from '@/pages/system-tools/SqlMaintenance';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/start" element={
        <AuthRoute>
          <Start />
        </AuthRoute>
      } />
      <Route path="/dashboard" element={
        <AuthRoute>
          <Dashboard />
        </AuthRoute>
      } />
      <Route path="/admin" element={<Navigate to="/admin/user-profile-management" replace />} />
      <Route path="/admin/user-profile-management" element={
        <AuthRoute requireAdmin>
          <UserProfileManagement />
        </AuthRoute>
      } />
      <Route path="/admin/roles-permissions-management" element={
        <AuthRoute requireAdmin>
          <RolesPermissionsManagement />
        </AuthRoute>
      } />
      <Route path="/admin/entity-management" element={
        <AuthRoute requireAdmin>
          <EntityManagementPage />
        </AuthRoute>
      } />
      <Route path="/admin/multilingual-management" element={
        <AuthRoute requireSuperAdmin>
          <MultilingualManagement />
        </AuthRoute>
      } />
      <Route path="/admin/report-structure-manager" element={
        <AuthRoute requireSuperAdmin>
          <ReportStructureManager />
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
          <CodebaseDocumentation />
        </AuthRoute>
      } />
      <Route path="/admin/system-tools/file-organizer" element={
        <AuthRoute requireSuperAdmin>
          <FileOrganizer />
        </AuthRoute>
      } />
      <Route path="/admin/system-tools/performance" element={
        <AuthRoute requireSuperAdmin>
          <PerformanceAnalyzer />
        </AuthRoute>
      } />
      <Route path="/admin/system-tools/historic-translation-fixer" element={
        <AuthRoute requireSuperAdmin>
          <HistoricTranslationFixer />
        </AuthRoute>
      } />
      <Route path="/admin/system-tools/sql-maintenance" element={
        <AuthRoute requireSuperAdmin>
          <SqlMaintenance />
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
      <Route path="/data/raw-data-processor" element={
        <AuthRoute>
          <RawDataProcessor />
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
      <Route path="/admin/user-entity-management" element={<Navigate to="/admin/user-profile-management" replace />} />
      <Route path="/admin/user-entity-management/*" element={<Navigate to="/admin/user-profile-management" replace />} />
      <Route path="/report-structure-manager" element={<Navigate to="/admin/report-structure-manager" replace />} />
      <Route path="/admin/report-configuration" element={<Navigate to="/admin/report-structure-manager" replace />} />
      <Route path="/coa-translator" element={<Navigate to="/data/coa-translator" replace />} />
      <Route path="/coa-mapper" element={<Navigate to="/data/coa-mapper" replace />} />
      <Route path="/trial-balance-import" element={<Navigate to="/data/trial-balance-import" replace />} />
      <Route path="/journal-import" element={<Navigate to="/data/journal-import" replace />} />
      <Route path="/memory" element={<Navigate to="/admin/memory-maintenance" replace />} />

      {/* Auth callback redirect */}
      <Route path="/auth/callback" element={<Navigate to="/start" replace />} />
      
      <Route path="/" element={<Navigate to="/start" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}