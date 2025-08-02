import ReportStructureManager from '@/components/ReportStructureManager';
import Footer from '@/components/Footer';

export default function ReportStructures() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Report Structure Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage report structures, upload new templates, and configure system-wide reporting formats.
          </p>
        </div>
        
        <ReportStructureManager />
        
        <Footer />
      </div>
    </div>
  );
}