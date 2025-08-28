import { EntityManagement } from '@/features/system-administration';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Download } from 'lucide-react';
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

  return (
    <CompactPageLayout 
      currentPage="Entity Management"
      actions={pageActions}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Entity Management</h1>
            <p className="text-muted-foreground">
              Manage entities and entity groups within the system
            </p>
          </div>
        </div>

        <EntityManagement />
        
        <Footer />
      </div>
    </CompactPageLayout>
  );
}