import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { TabsContent } from '@/components/ui/tabs';
import { UserManagementPanel, UserAccessManagementPanel } from '@/features/user-management';
import { EntityManagement } from '@/features/system-administration';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { TabNavigation } from '@/components/navigation/TabNavigation';
import { Users, Shield, Building2, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const tabConfig = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'roles-permissions', label: 'Roles & Permissions', icon: Shield },
    { id: 'entities', label: 'Entities', icon: Building2 }
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add New
      </Button>
    </div>
  );

  return (
    <CompactPageLayout 
      currentPage="User & Entity Management"
      actions={pageActions}
    >
      <div className="space-y-6">
        <TabNavigation 
          tabs={tabConfig}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

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

        <Footer />
      </div>
    </CompactPageLayout>
  );
}