import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserManagementPanel, UserAccessManagementPanel } from '@/features/user-management';
import { SecurityAuditLog } from '@/features/security-audit';
import { Footer } from '@/shared/components';

// Placeholder components for new tabs
function EntitiesManagement() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Entities</h2>
        <p className="text-muted-foreground">Manage entity configurations and settings</p>
        <p className="text-sm text-muted-foreground mt-4">Coming soon...</p>
      </div>
    </div>
  );
}

export default function UserEntityManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/roles-permissions')) return 'roles-permissions';
    if (path.includes('/entities')) return 'entities';
    if (path.includes('/activity-log')) return 'activity-log';
    return 'users'; // default
  };

  const [activeTab, setActiveTab] = useState(getCurrentTab());

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getCurrentTab());
  }, [location.pathname]);

  // Save last active tab to localStorage
  useEffect(() => {
    localStorage.setItem('userEntityManagement.lastTab', activeTab);
  }, [activeTab]);

  // Restore last active tab on mount
  useEffect(() => {
    const lastTab = localStorage.getItem('userEntityManagement.lastTab');
    if (lastTab && ['users', 'roles-permissions', 'entities', 'activity-log'].includes(lastTab)) {
      if (location.pathname === '/admin/user-entity-management') {
        navigate(`/admin/user-entity-management/${lastTab}`, { replace: true });
      }
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    navigate(`/admin/user-entity-management/${value}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">User & Entity Management</h1>
          <p className="text-muted-foreground">Manage users, roles, entities, and system activity</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles-permissions">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
            <TabsTrigger value="activity-log">Activity Log</TabsTrigger>
          </TabsList>

          <Routes>
            <Route path="/" element={<Navigate to="users" replace />} />
            <Route path="/users" element={
              <TabsContent value="users" className="space-y-4">
                <UserManagementPanel />
              </TabsContent>
            } />
            <Route path="/roles-permissions" element={
              <TabsContent value="roles-permissions" className="space-y-4">
                <UserAccessManagementPanel />
              </TabsContent>
            } />
            <Route path="/entities" element={
              <TabsContent value="entities" className="space-y-4">
                <EntitiesManagement />
              </TabsContent>
            } />
            <Route path="/activity-log" element={
              <TabsContent value="activity-log" className="space-y-4">
                <SecurityAuditLog />
              </TabsContent>
            } />
          </Routes>
        </Tabs>

        <Footer />
      </div>
    </div>
  );
}