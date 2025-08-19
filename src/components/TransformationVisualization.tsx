import React from 'react';
import { AlertTriangle, CheckCircle, Sparkles, ArrowRight, Zap, Database, FileSpreadsheet, Wand2, Brain, Cpu } from 'lucide-react';
import { Card } from '@/components/ui/card';

const TransformationVisualization = () => {
  return (
    <div className="relative w-full max-w-6xl mx-auto my-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 via-primary/5 to-success/5 rounded-3xl blur-xl" />
      
      <div className="relative grid lg:grid-cols-3 gap-8 items-center p-8">
        {/* Before State */}
        <Card className="relative overflow-hidden border-destructive/20 bg-gradient-to-br from-destructive/5 to-destructive/10 backdrop-blur-sm">
          <div className="p-8 space-y-6">
            
            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                DATEV Reports & Excel Hell
              </h3>
              <div className="space-y-3">
                {/* Visual representation of messy data */}
                <div className="space-y-2">
                  <div className="h-3 bg-destructive/20 rounded animate-pulse" />
                  <div className="h-3 bg-destructive/15 rounded w-4/5 animate-pulse" style={{ animationDelay: '0.1s' }} />
                  <div className="h-3 bg-destructive/25 rounded w-3/5 animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="h-3 bg-destructive/10 rounded w-2/3 animate-pulse" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
            
            {/* Pain Points */}
            <div className="space-y-3 pt-4 border-t border-destructive/20">
              {['Messy', 'Manual', 'Error-prone'].map((pain, index) => (
                <div key={pain} className="flex items-center gap-3 text-destructive/80">
                  <div className="w-2 h-2 rounded-full bg-destructive/60" />
                  <span className="font-medium">{pain}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-16 h-16 bg-destructive/10 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-destructive/5 rounded-full blur-lg" />
        </Card>

        {/* AI Tech Center */}
        <div className="relative flex flex-col items-center justify-center space-y-4 lg:space-y-6">
          {/* AI Processing Container */}
          <div className="relative flex items-center justify-center w-32 h-32 bg-slate-800/60 rounded-2xl border border-slate-600/50">
            {/* AI Processing Icon with Rotation Animation */}
            <div className="relative">
              <img
                src="/lovable-uploads/3d4f797c-d539-4468-b747-2b7a3ea40ae5.png"
                alt="AI Processing Icon"
                className="w-20 h-20 object-contain"
              />
            </div>

            {/* Processing Dots Around Icon */}
          </div>
          
          {/* Blue Animated Arrow */}
          <div className="hidden lg:block">
            <ArrowRight className="w-8 h-8 text-blue-500" />
          </div>
          
          {/* Mobile Blue Arrow */}
          <div className="block lg:hidden rotate-90">
            <ArrowRight className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* After State */}
        <Card className="relative overflow-hidden border-success/20 bg-gradient-to-br from-success/5 to-success/10 backdrop-blur-sm">
          <div className="p-8 space-y-6">
            
            {/* Title */}
            <div>
              <h3 className="text-lg font-semibold text-success mb-2">
                Cleansed Data in a Warehouse
              </h3>
              <div className="space-y-3">
                {/* Visual representation of clean data */}
                <div className="space-y-2">
                  <div className="h-3 bg-success/30 rounded" />
                  <div className="h-3 bg-success/25 rounded" />
                  <div className="h-3 bg-success/30 rounded" />
                  <div className="h-3 bg-success/20 rounded" />
                </div>
              </div>
            </div>
            
            {/* Benefits */}
            <div className="space-y-3 pt-4 border-t border-success/20">
              {['Structured', 'Automated', 'Reliable'].map((benefit, index) => (
                <div key={benefit} className="flex items-center gap-3 text-success/80">
                  <CheckCircle className="w-4 h-4 text-success/70" />
                  <span className="font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-16 h-16 bg-success/10 rounded-full blur-xl" />
          <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-success/5 rounded-full blur-lg" />
        </Card>
      </div>
      
      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent blur-sm" />
    </div>
  );
};

export default TransformationVisualization;