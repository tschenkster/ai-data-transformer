import { ReportStructureManager as ReportStructureManagerComponent } from '@/features/report-structure-manager';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { ErrorBoundaryWithRecovery } from '@/components/ErrorBoundaryWithRecovery';
import Footer from '@/components/Footer';
import { useEffect } from 'react';
import { useUITranslations } from '@/hooks/useUITranslations';

export default function ReportStructureManager() {
  const { t } = useUITranslations();

  useEffect(() => {
    console.log('ReportStructureManager page mounted');
    
    const handlePageShow = () => {
      console.log('ReportStructureManager page shown (back/forward navigation)');
    };
    
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('ReportStructureManager page about to unload');
    };
    
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      console.log('ReportStructureManager page unmounting');
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <ErrorBoundaryWithRecovery
      onError={(error, errorInfo) => {
        console.error('ReportStructureManager page error:', error, errorInfo);
      }}
    >
      <CompactPageLayout 
        currentPage={t('NAV_REPORT_STRUCTURE_MANAGER', 'Report Structure Manager')}
      >
        <ErrorBoundaryWithRecovery
          onError={(error, errorInfo) => {
            console.error('ReportStructureManager error:', error, errorInfo);
          }}
        >
          <ReportStructureManagerComponent />
        </ErrorBoundaryWithRecovery>
        
        <Footer />
      </CompactPageLayout>
    </ErrorBoundaryWithRecovery>
  );
}