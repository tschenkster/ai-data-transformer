import { ReportStructureManager } from '@/features/report-structures';
import Footer from '@/components/Footer';
import { ErrorBoundaryWithRecovery } from '@/components/ErrorBoundaryWithRecovery';
import { useEffect } from 'react';

export default function ReportStructures() {
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

  return (
    <ErrorBoundaryWithRecovery
      onError={(error, errorInfo) => {
        console.error('ReportStructures page error:', error, errorInfo);
      }}
    >
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <ErrorBoundaryWithRecovery
            onError={(error, errorInfo) => {
              console.error('ReportStructureManager error:', error, errorInfo);
            }}
          >
            <ReportStructureManager />
          </ErrorBoundaryWithRecovery>
          
          <Footer />
        </div>
      </div>
    </ErrorBoundaryWithRecovery>
  );
}