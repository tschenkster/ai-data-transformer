import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function useBetaDialog() {
  const [showDialog, setShowDialog] = useState(false);

  const showBetaDialog = useCallback(() => {
    setShowDialog(true);
  }, []);

  const hideBetaDialog = useCallback(() => {
    setShowDialog(false);
  }, []);

  const BetaDialog = useCallback(() => (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-lg border-0 bg-background/95 backdrop-blur-xl shadow-2xl animate-scale-in">
        <div className="relative p-6 sm:p-8">
          {/* Close button */}
          <button
            onClick={hideBetaDialog}
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
              onClick={hideBetaDialog}
              className="px-8 py-2.5 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover-scale"
              size="lg"
            >
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  ), [showDialog, hideBetaDialog]);

  return {
    showBetaDialog,
    hideBetaDialog,
    BetaDialog
  };
}