import React from 'react';
import { SystemToolsBreadcrumb } from './SystemToolsBreadcrumb';
import { SystemToolsNavigation } from './SystemToolsNavigation';

interface SystemToolsLayoutProps {
  children: React.ReactNode;
  toolId: string;
  toolTitle: string;
  toolDescription: string;
  showNavigation?: boolean;
}

export function SystemToolsLayout({ 
  children, 
  toolId, 
  toolTitle, 
  toolDescription,
  showNavigation = true 
}: SystemToolsLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      <div className="border-b bg-muted/30">
        <div className="container max-w-7xl mx-auto px-6 py-3">
          <SystemToolsBreadcrumb toolId={toolId} toolTitle={toolTitle} />
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex">
        {/* Side Navigation */}
        {showNavigation && (
          <div className="w-64 border-r bg-muted/20 min-h-[calc(100vh-60px)]">
            <SystemToolsNavigation currentToolId={toolId} />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          <div className={`container mx-auto p-6 space-y-6 ${showNavigation ? 'max-w-5xl' : 'max-w-7xl'}`}>
            {/* Tool Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{toolTitle}</h1>
              <p className="text-muted-foreground text-lg max-w-3xl">
                {toolDescription}
              </p>
            </div>

            {/* Tool Content */}
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}