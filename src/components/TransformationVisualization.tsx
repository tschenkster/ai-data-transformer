import React from 'react';
import { ArrowRight, FileSpreadsheet, Database, Zap } from 'lucide-react';

const TransformationVisualization = () => {
  return (
    <div className="relative w-full max-w-5xl mx-auto my-8">
      <div className="relative bg-card rounded-lg border shadow-sm p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            AI-Powered Data Transformation
          </h2>
          <p className="text-muted-foreground">
            From messy spreadsheets to clean, structured databases
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Left Panel - Problem State */}
          <div className="relative bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <div className="mb-4">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-destructive mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Excel Hell</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Inconsistent formatting</li>
              <li>• Manual data entry errors</li>
              <li>• Version control nightmares</li>
              <li>• Limited collaboration</li>
              <li>• No data validation</li>
            </ul>
            <div className="mt-4 px-3 py-2 bg-destructive/5 rounded text-xs text-destructive font-medium">
              Time-consuming & Error-prone
            </div>
          </div>

          {/* Center - Transformation Process */}
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="bg-primary/10 border border-primary/20 rounded-full p-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-foreground mb-1">AI Processing</h4>
              <p className="text-xs text-muted-foreground">Intelligent transformation</p>
            </div>
            <ArrowRight className="w-6 h-6 text-muted-foreground hidden md:block" />
            <div className="md:hidden flex items-center space-x-2">
              <div className="h-px bg-border flex-1"></div>
              <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
              <div className="h-px bg-border flex-1"></div>
            </div>
          </div>

          {/* Right Panel - Solution State */}
          <div className="relative bg-success/10 border border-success/20 rounded-lg p-6 text-center">
            <div className="mb-4">
              <Database className="w-12 h-12 mx-auto text-success mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Clean Database</h3>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li>• Standardized structure</li>
              <li>• Automated validation</li>
              <li>• Real-time collaboration</li>
              <li>• Data integrity</li>
              <li>• Instant insights</li>
            </ul>
            <div className="mt-4 px-3 py-2 bg-success/5 rounded text-xs text-success font-medium">
              Efficient & Reliable
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-6 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Transform your data workflow in minutes, not hours
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransformationVisualization;