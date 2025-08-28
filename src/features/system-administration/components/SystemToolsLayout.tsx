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
  const breadcrumbItems = [
    { path: '/home', label: 'Home' },
    { path: '/admin/user-entity-management', label: 'System Administration' },
    { path: '/admin/system-tools', label: 'System Tools' }
  ];

  const sidebar = showNavigation ? (
    <SystemToolsNavigation currentToolId={toolId} />
  ) : undefined;

  return (
    <CompactPageLayout
      currentPage={toolTitle}
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