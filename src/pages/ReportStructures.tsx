import ReportStructureManager from '@/components/ReportStructureManager';
import Footer from '@/components/Footer';

export default function ReportStructures() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <ReportStructureManager />
        
        <Footer />
      </div>
    </div>
  );
}