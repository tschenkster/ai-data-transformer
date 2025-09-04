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
          Convert useless DATEV reports into something meaningful.
        </h1>
        
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Turn messy DATEV exports into clean data & reports.
        </p>

        <div className="mt-8 flex justify-center">
          <div className="w-1/2">
            <div 
              onClick={handleCTAClick}
              className="h-[300px] border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 bg-background/50 backdrop-blur-sm"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">Upload your DATEV file</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports XLSX, CSV & PDF files
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click or drag and drop your file here
                  </p>
                </div>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.pdf"
              onChange={handleFileSelect}
              className="hidden"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </section>
  );
}