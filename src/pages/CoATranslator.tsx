import { CoATranslator } from '@/features/coa-translation';
import Footer from '@/components/Footer';

export default function CoATranslatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <CoATranslator />
      <Footer />
    </div>
  );
}