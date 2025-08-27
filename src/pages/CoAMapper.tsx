import { CoAMapper } from '@/features/coa-mapping';
import Footer from '@/components/Footer';

export default function CoAMapperPage() {
  return (
    <div className="min-h-screen bg-background">
      <CoAMapper />
      <Footer />
    </div>
  );
}