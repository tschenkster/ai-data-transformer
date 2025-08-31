import React from 'react';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { SystemToolsNavigation } from './SystemToolsNavigation';

interface SystemToolsLayoutProps {
  children: React.ReactNode;
  toolId: string;
  toolTitle: string;
  toolDescription: string;
  showNavigation?: boolean;
  actions?: React.ReactNode;
}

export function SystemToolsLayout({ 
  children, 
  toolId, 
  toolTitle, 
  toolDescription,
  showNavigation = true,
  actions
}: SystemToolsLayoutProps) {
  // Tool path mapping
  const toolPaths: Record<string, string> = {
    'codebase-docs': '/admin/system-tools/codebase-docs',
    'database-docs': '/admin/system-tools/database-docs', 
    'performance-analyzer': '/admin/system-tools/performance',
    'file-organizer': '/admin/system-tools/file-organizer'
  };

  const breadcrumbItems = [
    { path: '/start', label: 'Start' },
    { path: '/admin', label: 'System Administration' },
    { path: '/admin/system-tools', label: 'System Tools' },
    { path: toolPaths[toolId] || `/admin/system-tools/${toolId}`, label: toolTitle }
  ];

  const sidebar = showNavigation ? (
    <SystemToolsNavigation currentToolId={toolId} />
  ) : undefined;

  return (
    <CompactPageLayout
      breadcrumbItems={breadcrumbItems}
      actions={actions}
      sidebar={sidebar}
    >
      {/* Tool Description */}
      <div className="mb-6">
        <p className="text-muted-foreground text-lg max-w-3xl">
          {toolDescription}
        </p>
      </div>

      {/* Tool Content */}
      <div className="space-y-6">
        {children}
      </div>
    </CompactPageLayout>
  );
}