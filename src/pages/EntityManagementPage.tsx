import { EntityManagement } from '@/features/system-administration';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import Footer from '@/components/Footer';
import { useUITranslations } from '@/hooks/useUITranslations';

export default function EntityManagementPage() {
  const { t } = useUITranslations();
  
  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        {t('BTN_EXPORT', 'Export')}
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        {t('BTN_ADD_ENTITY', 'Add Entity')}
      </Button>
    </div>
  );

  const adminCrumbs = [
    { path: '/start', label: t('NAV_START', 'Start') },
    { path: '/admin', label: t('NAV_SYSTEM_ADMINISTRATION', 'System Administration') },
    { path: '/admin/entity-management', label: t('PAGE_ENTITY_MANAGEMENT', 'Entity Management') }
  ];

  return (
    <CompactPageLayout 
      breadcrumbItems={adminCrumbs}
      currentPage={t('PAGE_ENTITY_MANAGEMENT', 'Entity Management')}
      actions={pageActions}
    >
      <div className="space-y-6">
        <EntityManagement />
        
        <Footer />
      </div>
    </CompactPageLayout>
  );
}