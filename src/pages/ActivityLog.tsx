import { SecurityAuditLog } from '@/features/data-security';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import Footer from '@/components/Footer';
import { useUITranslations } from '@/hooks/useUITranslations';

export default function ActivityLog() {
  const { t } = useUITranslations();
  
  const adminCrumbs = [
    { path: '/start', label: t('NAV_START', 'Start') },
    { path: '/admin', label: t('NAV_SYSTEM_ADMINISTRATION', 'System Administration') },
    { path: '/admin/activity-log', label: t('PAGE_ACTIVITY_LOG', 'Activity Log') }
   ];

  return (
    <CompactPageLayout 
      breadcrumbItems={adminCrumbs}
      currentPage={t('PAGE_ACTIVITY_LOG', 'Activity Log')}
    >
      <div className="space-y-6">
        <SecurityAuditLog />
        
        <Footer />
      </div>
    </CompactPageLayout>
  );
}