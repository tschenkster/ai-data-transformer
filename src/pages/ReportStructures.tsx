import { ReportStructureManager } from '@/features/report-structures';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { ErrorBoundaryWithRecovery } from '@/components/ErrorBoundaryWithRecovery';
import { Button } from '@/components/ui/button';
import { Plus, Upload, Settings, Languages } from 'lucide-react';
import Footer from '@/components/Footer';
import { useEffect } from 'react';
import { MultilingualSelector } from '@/components/MultilingualSelector';
import { useLanguagePreference } from '@/hooks/useTranslations';

export default function ReportStructures() {
  const { language, changeLanguage } = useLanguagePreference();

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
      <div className="flex items-center gap-2 mr-2">
        <Languages className="w-4 h-4 text-muted-foreground" />
        <MultilingualSelector
          currentLanguage={language}
          onLanguageChange={changeLanguage}
          size="sm"
        />
      </div>
      <Button variant="outline" size="sm">
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>
      <Button variant="outline" size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New Structure
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
        currentPage="Report Structures"
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