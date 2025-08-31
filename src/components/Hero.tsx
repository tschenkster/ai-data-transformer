import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function Hero() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCTAClick = () => {
    // Track CTA click for analytics
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'home_cta_clicked');
      }
    } catch (error) {
      // Analytics tracking failed, continue silently
    }
    
    // Trigger file picker
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Navigate to convert route with file data
      navigate('/convert', { state: { file } });
      
      // Show success toast
      toast.success("File uploaded successfully!", {
        description: `Selected file: ${file.name}`,
      });
    }
  };

  return (
    <section className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
          The world's most trusted DATEV converter
        </h1>
        
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Easily convert DATEV reports into clean Excel (XLSX) format.
        </p>

        <div className="mt-8">
          <Button
            onClick={handleCTAClick}
            size="lg"
            disabled
            className="inline-flex items-center justify-center rounded-2xl px-6 py-4 text-base md:text-lg font-semibold"
            aria-label="Start DATEV file conversion (coming soon)"
          >
            Click here to convert a DATEV file!
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xml,.zip"
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}