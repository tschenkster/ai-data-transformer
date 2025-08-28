import { SecurityAuditLog } from '@/features/data-security';
import Footer from '@/components/Footer';

export default function ActivityLog() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Activity Log</h1>
          <p className="text-muted-foreground">Recent security events and administrative actions</p>
        </div>

        <SecurityAuditLog />

        <Footer />
      </div>
    </div>
  );
}