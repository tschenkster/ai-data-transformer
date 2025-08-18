import React from 'react';
import { AlertTriangle, CheckCircle, Sparkles, ArrowRight, Zap, Database, FileSpreadsheet, Wand2 } from 'lucide-react';
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
              <h3 className="text-xl font-bold text-destructive mb-2">
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

        {/* AI Magic Wand Center */}
        <div className="relative flex flex-col items-center justify-center space-y-4 lg:space-y-6">
          {/* AI Magic Wand Container */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* Magic Wand */}
            <div className="relative z-20 flex flex-col items-center">
              {/* Star tip with dynamic glow */}
              <div className="relative mb-1">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-300 to-orange-500 rounded-sm rotate-45 shadow-lg shadow-orange-400/60 animate-pulse" />
                <div className="absolute inset-0 w-6 h-6 bg-gradient-to-tl from-orange-200 to-orange-400 rounded-sm rotate-45 opacity-70" />
                {/* Dynamic star rays */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 border border-orange-300/30 rounded-sm rotate-45 animate-ping" style={{ animationDuration: '1.8s' }} />
              </div>
              
              {/* Wand handle with gradient */}
              <div className="w-2 h-12 bg-gradient-to-b from-blue-400 via-blue-600 to-blue-800 rounded-full shadow-lg shadow-blue-600/50 relative animate-pulse" style={{ animationDuration: '2s' }}>
                {/* Handle shine */}
                <div className="absolute left-0 top-2 w-0.5 h-8 bg-gradient-to-b from-blue-200 to-blue-300 rounded-full opacity-70" />
              </div>
            </div>
            
            {/* Animated sparkles in specified colors */}
            <div className="absolute -top-5 -left-8 w-3 h-3 bg-blue-400 rounded-full animate-bounce opacity-85" style={{ animationDelay: '0s', animationDuration: '1.3s' }} />
            <div className="absolute -top-3 right-6 w-2.5 h-2.5 bg-pink-400 rounded-full animate-bounce opacity-90" style={{ animationDelay: '0.3s', animationDuration: '1.5s' }} />
            <div className="absolute top-0 -left-9 w-2 h-2 bg-orange-400 rounded-full animate-bounce opacity-80" style={{ animationDelay: '0.6s', animationDuration: '1.7s' }} />
            <div className="absolute top-3 right-7 w-3.5 h-3.5 bg-cyan-400 rounded-full animate-bounce opacity-85" style={{ animationDelay: '0.9s', animationDuration: '1.4s' }} />
            <div className="absolute top-6 -left-6 w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce opacity-75" style={{ animationDelay: '1.2s', animationDuration: '1.6s' }} />
            <div className="absolute bottom-4 right-5 w-2 h-2 bg-pink-500 rounded-full animate-bounce opacity-80" style={{ animationDelay: '1.5s', animationDuration: '1.8s' }} />
            <div className="absolute bottom-1 -left-7 w-3 h-3 bg-cyan-500 rounded-full animate-bounce opacity-90" style={{ animationDelay: '1.8s', animationDuration: '1.2s' }} />
            <div className="absolute bottom-6 left-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce opacity-85" style={{ animationDelay: '2.1s', animationDuration: '1.9s' }} />
            
            {/* AI letters with dynamic movement */}
            <div className="absolute -top-7 -left-12 text-3xl font-bold text-blue-600 animate-bounce opacity-95" style={{ animationDelay: '0.2s', animationDuration: '2.2s' }}>A</div>
            <div className="absolute -bottom-5 right-10 text-3xl font-bold text-pink-600 animate-bounce opacity-95" style={{ animationDelay: '1.4s', animationDuration: '2.2s' }}>I</div>
            
            {/* Energy pulse rings */}
            <div className="absolute inset-0 border-2 border-blue-300/40 rounded-full animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="absolute inset-3 border border-pink-400/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.7s' }} />
            <div className="absolute inset-1 border border-orange-300/25 rounded-full animate-ping" style={{ animationDuration: '1.8s', animationDelay: '1.2s' }} />
          </div>
          
          {/* AI Magic Label */}
          <div className="text-center space-y-2">
            <div className="flex items-center gap-2 justify-center">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
                AI Magic
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Instant Transformation
            </p>
          </div>
          
          {/* Blue Animated Arrow */}
          <div className="hidden lg:block">
            <ArrowRight className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
          
          {/* Mobile Blue Arrow */}
          <div className="block lg:hidden rotate-90">
            <ArrowRight className="w-8 h-8 text-blue-500 animate-pulse" />
          </div>
        </div>

        {/* After State */}
        <Card className="relative overflow-hidden border-success/20 bg-gradient-to-br from-success/5 to-success/10 backdrop-blur-sm">
          <div className="p-8 space-y-6">
            
            {/* Title */}
            <div>
              <h3 className="text-xl font-bold text-success mb-2">
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