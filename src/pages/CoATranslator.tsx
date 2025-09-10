import { CoATranslator } from '@/features/coa-translation';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { Button } from '@/components/ui/button';
import { Upload, Download } from 'lucide-react';
import Footer from '@/components/Footer';

export default function CoATranslatorPage() {
  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button size="sm">
        <Upload className="h-4 w-4 mr-2" />
        Upload File
      </Button>
    </div>
  );

  return (
    <CompactPageLayout 
      currentPage="CoA Translator"
      actions={pageActions}
    >
      <CoATranslator />
      <Footer />
    </CompactPageLayout>
  );
}