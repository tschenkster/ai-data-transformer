import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import { toast } from 'sonner';

export function Hero() {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showInactiveDialog, setShowInactiveDialog] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Analytics event simulation
  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    console.log('Analytics:', event, properties);
    // In production, this would connect to your analytics service
  }, []);

  // Handle drag events with debouncing
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) {
      setIsDragOver(true);
      trackEvent('drag_over', { location: 'upload_box' });
    }
  }, [isDragOver, trackEvent]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the card entirely
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect && (e.clientX < rect.left || e.clientX > rect.right || 
                 e.clientY < rect.top || e.clientY > rect.bottom)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    trackEvent('cta_click', { trigger: 'drop', location: 'upload_box' });
    setShowInactiveDialog(true);
  }, [trackEvent]);

  const handleClick = useCallback(() => {
    trackEvent('cta_click', { trigger: 'click', location: 'upload_box' });
    setShowInactiveDialog(true);
  }, [trackEvent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    trackEvent('hover', { location: 'upload_box' });
  }, [trackEvent]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleFocus = useCallback(() => {
    trackEvent('focus', { location: 'upload_box' });
  }, [trackEvent]);

  // Fire view event on mount
  React.useEffect(() => {
    trackEvent('view', { location: 'homepage_hero' });
  }, [trackEvent]);

  return (
    <>
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4 md:px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground mb-12 md:mb-16">
            Convert useless DATEV reports
          </h1>

          {/* Upload Box - Visual Center of Gravity */}
          <div className="flex justify-center">
            <Card
              ref={cardRef}
              className={`
                w-[60%] max-w-2xl
                bg-background border border-border rounded-3xl shadow-lg
                transition-all duration-300 cursor-pointer
                ${isHovered ? 'shadow-xl border-primary' : ''}
                ${isDragOver ? 'bg-primary/5 border-primary shadow-2xl animate-scale-in' : ''}
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20
              `}
              role="button"
              tabIndex={0}
              aria-describedby="upload-status"
              aria-label="Upload your DATEV file - simulation mode"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onFocus={handleFocus}
            >
              <CardContent className="p-6 sm:p-8 md:p-10">
                <div className="space-y-6 md:space-y-8">
                  {/* Headline */}
                  <div className="space-y-3">
                    <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                      ...into clean data & meaningful reports.
                    </h3>
                  </div>

                  {/* Upload Icon */}
                  <div className="flex justify-center">
                    <div className={`
                      w-20 h-20 md:w-24 md:h-24 bg-primary/10 rounded-full 
                      flex items-center justify-center transition-transform duration-300
                      ${isDragOver ? 'animate-pulse scale-110' : ''}
                      ${isHovered ? 'scale-105' : ''}
                    `}>
                      <Upload className={`
                        h-12 w-12 md:h-14 md:w-14 text-primary transition-transform duration-300
                        ${isDragOver ? 'animate-pulse' : ''}
                      `} />
                    </div>
                  </div>

                  {/* Format Chips */}
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="outline" className="bg-background/80 text-xs">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      XLSX
                    </Badge>
                    <Badge variant="outline" className="bg-background/80 text-xs">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      CSV
                    </Badge>
                    <Badge variant="outline" className="bg-background/80 text-xs">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      PDF
                    </Badge>
                  </div>

                  {/* CTA Button */}
                  <div>
                    <Button 
                      variant="default" 
                      size="lg"
                      className="w-full sm:w-auto px-8 py-3 text-lg font-semibold rounded-xl"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                      }}
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      Upload your DATEV file
                    </Button>
                  </div>

                  {/* Status Indicator */}
                  <div 
                    id="upload-status"
                    className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {isDragOver ? (
                      "Drop your file here to simulate upload"
                    ) : (
                      "Coming soon: upload will be available once the app is live."
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Beta Testing Notice Dialog */}
      <Dialog open={showInactiveDialog} onOpenChange={setShowInactiveDialog}>
        <DialogContent className="sm:max-w-lg border-0 bg-background/95 backdrop-blur-xl shadow-2xl animate-scale-in">
          <div className="relative p-6 sm:p-8">
            {/* Close button */}
            <button
              onClick={() => setShowInactiveDialog(false)}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted/50 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Header with icon */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🚧</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  Heads up!
                </h2>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6 text-foreground/80 leading-relaxed">
              <p className="text-lg">
                This app isn't open for public use yet — I'm still beta testing it with a handful of companies.
              </p>
              
              <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Want to connect?
                </p>
                <a 
                  href="https://www.linkedin.com/in/thomas-schenkelberg/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors group"
                >
                  <span>Ping me on LinkedIn</span>
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              <p className="text-lg">
                Don't let DATEV drive you crazy — help is on the way soon. 
                <span className="ml-2">🚀</span>
              </p>
            </div>

            {/* Signature */}
            <div className="mt-8 pt-6 border-t border-border/20">
              <div className="text-right">
                <p className="text-foreground font-medium mb-1">-Thomas</p>
                <p className="text-sm text-muted-foreground italic">
                  *Chief DATEV Therapist*
                </p>
              </div>
            </div>

            {/* Action */}
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={() => setShowInactiveDialog(false)}
                className="px-8 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover-scale"
                size="lg"
              >
                Got it
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}