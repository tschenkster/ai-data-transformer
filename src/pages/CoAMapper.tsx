import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { MapPin } from 'lucide-react';
import Footer from '@/components/Footer';

export default function CoAMapperPage() {
  const breadcrumbItems = [
    { path: '/home', label: 'Home' },
    { path: '/coa-mapper', label: 'CoA Mapper', icon: MapPin }
  ];

  return (
    <>
      <CompactPageLayout 
        breadcrumbItems={breadcrumbItems}
        currentPage="Chart of Accounts Mapper"
      >
        <div className="space-y-6">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Chart of Accounts Mapper</h1>
            <p className="text-muted-foreground">
              Ready for new implementation
            </p>
          </div>
        </div>
      </CompactPageLayout>
      <Footer />
    </>
  );
}