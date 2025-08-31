import { SecurityAuditLog } from '@/features/data-security';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import Footer from '@/components/Footer';

export default function ActivityLog() {
  const adminCrumbs = [
    { path: '/start', label: 'Start' },
    { path: '/admin', label: 'System Administration' },
    { path: '/admin/activity-log', label: 'Activity Log' }
   ];

  return (
    <CompactPageLayout 
      breadcrumbItems={adminCrumbs}
      currentPage="Activity Log"
    >
      <div className="space-y-6">
        <SecurityAuditLog />
        
        <Footer />
      </div>
    </CompactPageLayout>
  );
}