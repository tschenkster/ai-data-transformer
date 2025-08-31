import { UserAccessManagementPanel } from '@/features/user-management';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import Footer from '@/components/Footer';

export default function RolesPermissionsManagement() {
  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Assign Access
      </Button>
    </div>
  );

  const adminCrumbs = [
    { path: '/start', label: 'Start' },
    { path: '/admin', label: 'System Administration' },
    { path: '/admin/roles-permissions-management', label: 'Roles & Permissions Management' }
  ];

  return (
    <CompactPageLayout 
      breadcrumbItems={adminCrumbs}
      currentPage="Roles & Permissions Management"
      actions={pageActions}
    >
      <div className="space-y-6">
        <UserAccessManagementPanel />
        
        <Footer />
      </div>
    </CompactPageLayout>
  );
}