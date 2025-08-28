import { UserAccessManagementPanel } from '@/features/user-management';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { Button } from '@/components/ui/button';
import { Shield, Plus, Download } from 'lucide-react';
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

  return (
    <CompactPageLayout 
      currentPage="Roles & Permissions Management"
      actions={pageActions}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Roles & Permissions Management</h1>
            <p className="text-muted-foreground">
              Manage user access permissions to entities and entity groups
            </p>
          </div>
        </div>

        <UserAccessManagementPanel />
        
        <Footer />
      </div>
    </CompactPageLayout>
  );
}