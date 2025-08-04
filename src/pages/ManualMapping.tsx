import ManualMappingInterface from '@/components/ManualMappingInterface';
import Footer from '@/components/Footer';

export default function ManualMapping() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Manual Account Mapping</h1>
          <p className="text-muted-foreground mt-2">
            Create direct mappings between account names and report line items for precise control over your data structure.
          </p>
        </div>
        
        <ManualMappingInterface onMappingCreated={() => {
          // Could add refresh logic here if needed
        }} />
        
        <Footer />
      </div>
    </div>
  );
}