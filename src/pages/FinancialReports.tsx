import { ReportViewer } from '@/features/report-viewer';
import Footer from '@/components/Footer';

export default function FinancialReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <ReportViewer />
      <Footer />
    </div>
  );
}