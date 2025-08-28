import React from 'react';
import { AppBreadcrumb } from '@/components/navigation/AppBreadcrumb';

interface BreadcrumbConfig {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CompactPageLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  breadcrumbItems?: BreadcrumbConfig[];
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  showBreadcrumb?: boolean;
  className?: string;
}

export function CompactPageLayout({ 
  children, 
  currentPage,
  breadcrumbItems,
  actions,
  sidebar,
  showBreadcrumb = true,
  className = ""
}: CompactPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      {showBreadcrumb && (
        <AppBreadcrumb 
          items={breadcrumbItems}
          currentPage={currentPage}
          actions={actions}
        />
      )}

      {/* Main Layout */}
      <div className="flex">
        {/* Optional Sidebar */}
        {sidebar && (
          <div className="w-64 border-r bg-muted/20 min-h-[calc(100vh-60px)]">
            {sidebar}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1">
          <div className={`container mx-auto p-6 space-y-6 ${sidebar ? 'max-w-5xl' : 'max-w-7xl'} ${className}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}