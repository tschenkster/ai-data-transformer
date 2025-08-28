import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { UserManagementPanel, UserAccessManagementPanel } from '@/features/user-management';
import { EntityManagement } from '@/features/system-administration';
import Footer from '@/components/Footer';

export default function UserEntityManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract current tab from URL path
  const getCurrentTab = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/roles-permissions')) return 'roles-permissions';
    if (path.includes('/entities')) return 'entities';
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
    if (lastTab && ['users', 'roles-permissions', 'entities'].includes(lastTab)) {
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
          <p className="text-muted-foreground">Manage users, roles, and entities</p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles-permissions">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="entities">Entities</TabsTrigger>
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
                <EntityManagement />
              </TabsContent>
            } />
          </Routes>
        </Tabs>

        <Footer />
      </div>
    </div>
  );
}