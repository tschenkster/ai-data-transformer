import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle } from 'lucide-react';

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
      <DialogContent className="sm:max-w-lg border-0 bg-background/95 backdrop-blur-xl shadow-2xl">
        <div className="relative p-6 sm:p-8 text-center">

          {/* Header with icon */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-6 w-6 text-white" />
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
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <img 
                    src="/profile-picture-thomas-updated.png" 
                    alt="Thomas Schenkelberg - Startup CFO" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20 shadow-lg"
                  />
                  <div className="absolute inset-0 rounded-full ring-1 ring-primary/10 ring-offset-1 ring-offset-background"></div>
                </div>
                <a 
                  href="https://www.linkedin.com/in/thomas-schenkelberg/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0077b5] hover:bg-[#005885] text-white rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md group"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span>Ping me on LinkedIn</span>
                  <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            <p className="text-lg">
              Don't let DATEV drive you crazy — help is on the way soon. 
              <span className="ml-2">⚡</span>
            </p>
          </div>

          {/* Signature */}
          <div className="mt-8 pt-6 border-t border-border/20">
            <div className="text-center">
              <p className="text-foreground font-medium mb-1">-Thomas Schenkelberg</p>
              <p className="text-sm text-muted-foreground italic">
                Chief DATEV Therapist
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