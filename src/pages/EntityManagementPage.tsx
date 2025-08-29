import { EntityManagement } from '@/features/system-administration';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import Footer from '@/components/Footer';

export default function EntityManagementPage() {
  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        Add Entity
      </Button>
    </div>
  );

  const adminCrumbs = [
    { path: '/home', label: 'Home' },
    { path: '/admin', label: 'System Administration' }
  ];

  return (
    <CompactPageLayout 
      breadcrumbItems={adminCrumbs}
      currentPage="Entity Management"
      actions={pageActions}
    >
      <div className="space-y-6">
        <EntityManagement />
        
        <Footer />
      </div>
    </CompactPageLayout>
  );
}