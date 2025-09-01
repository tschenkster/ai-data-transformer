import { ReportStructureManager } from '@/features/report-structures';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { ErrorBoundaryWithRecovery } from '@/components/ErrorBoundaryWithRecovery';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Settings } from 'lucide-react';
import Footer from '@/components/Footer';
import { useEffect } from 'react';
import { LanguageQuerySelector } from '@/features/multilingual/components/LanguageQuerySelector';
import { useLanguageQuery } from '@/features/multilingual/hooks/useLanguageQuery';
import { useUITranslations } from '@/hooks/useUITranslations';

export default function ReportStructures() {
  const { activeLanguage } = useLanguageQuery();
  const { t } = useUITranslations(activeLanguage);

  useEffect(() => {
    console.log('ReportStructures page mounted');
    
    const handlePageShow = () => {
      console.log('ReportStructures page shown (back/forward navigation)');
    };
    
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      console.log('ReportStructures page about to unload');
    };
    
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      console.log('ReportStructures page unmounting');
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const pageActions = (
    <div className="flex items-center gap-2">
      <LanguageQuerySelector 
        showLabel={false}
        size="sm"
        className="mr-2"
      />
      <Button variant="outline" size="sm">
        <Settings className="h-4 w-4 mr-2" />
        {t('BTN_SETTINGS', 'Settings')}
      </Button>
      <Button variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        {t('BTN_IMPORT', 'Import')}
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        {t('BTN_NEW_STRUCTURE', 'New Structure')}
      </Button>
    </div>
  );

  return (
    <ErrorBoundaryWithRecovery
      onError={(error, errorInfo) => {
        console.error('ReportStructures page error:', error, errorInfo);
      }}
    >
      <CompactPageLayout 
        currentPage={t('NAV_STRUCTURES', 'Report Structures')}
        actions={pageActions}
      >
        <ErrorBoundaryWithRecovery
          onError={(error, errorInfo) => {
            console.error('ReportStructureManager error:', error, errorInfo);
          }}
        >
          <ReportStructureManager />
        </ErrorBoundaryWithRecovery>
        
        <Footer />
      </CompactPageLayout>
    </ErrorBoundaryWithRecovery>
  );
}