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
            {/* Icon Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-destructive/70" />
                <span className="text-sm font-medium text-destructive/70">Current State</span>
              </div>
            </div>
            
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

        {/* Transformation Arrow with AI Magic */}
        <div className="relative flex flex-col items-center justify-center space-y-4 lg:space-y-6">
          {/* 3D Magic Wand with Sparkles */}
          <div className="relative">
            {/* Magic Wand */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Star at tip */}
              <div className="relative mb-1">
                <div className="w-6 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm rotate-45 shadow-lg shadow-yellow-500/50" />
                <div className="absolute inset-0 w-6 h-6 bg-gradient-to-tl from-yellow-200 to-yellow-400 rounded-sm rotate-45 opacity-70" />
              </div>
              
              {/* Wand handle */}
              <div className="w-2 h-12 bg-gradient-to-b from-purple-400 via-purple-600 to-purple-800 rounded-full shadow-lg shadow-purple-600/40 relative">
                {/* Handle highlight */}
                <div className="absolute left-0 top-1 w-1 h-8 bg-gradient-to-b from-purple-200 to-purple-300 rounded-full opacity-60" />
              </div>
            </div>
            
            {/* Colorful Sparkles */}
            <div className="absolute -top-6 -left-6 w-4 h-4 bg-blue-400 rounded-full animate-pulse opacity-80" style={{ animationDelay: '0s' }} />
            <div className="absolute -top-4 right-2 w-3 h-3 bg-pink-400 rounded-full animate-pulse opacity-70" style={{ animationDelay: '0.3s' }} />
            <div className="absolute top-2 -left-8 w-2 h-2 bg-orange-400 rounded-full animate-pulse opacity-90" style={{ animationDelay: '0.6s' }} />
            <div className="absolute top-6 -right-4 w-3 h-3 bg-cyan-400 rounded-full animate-pulse opacity-80" style={{ animationDelay: '0.9s' }} />
            <div className="absolute -bottom-2 -left-4 w-2 h-2 bg-blue-300 rounded-full animate-pulse opacity-60" style={{ animationDelay: '1.2s' }} />
            <div className="absolute bottom-4 right-6 w-4 h-4 bg-pink-300 rounded-full animate-pulse opacity-70" style={{ animationDelay: '1.5s' }} />
            
            {/* AI Letters */}
            <div className="absolute -top-8 -left-12 text-2xl font-bold text-purple-600 animate-pulse opacity-80" style={{ animationDelay: '0.2s' }}>A</div>
            <div className="absolute -bottom-6 right-8 text-2xl font-bold text-purple-600 animate-pulse opacity-80" style={{ animationDelay: '0.8s' }}>I</div>
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
            {/* Icon Header */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-success/70" />
                <span className="text-sm font-medium text-success/70">Transformed</span>
              </div>
            </div>
            
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