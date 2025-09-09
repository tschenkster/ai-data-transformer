import React from 'react';
import { AppBreadcrumb } from '@/components/navigation/AppBreadcrumb';
import Footer from '@/components/Footer';

interface BreadcrumbConfig {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface StandardPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  breadcrumbItems?: BreadcrumbConfig[];
  actions?: React.ReactNode;
  sidebar?: React.ReactNode;
  showBreadcrumb?: boolean;
  showFooter?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-3xl',
  md: 'max-w-4xl', 
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
  full: 'max-w-none'
};

export function StandardPageLayout({ 
  children, 
  title,
  description,
  breadcrumbItems,
  actions,
  sidebar,
  showBreadcrumb = true,
  showFooter = true,
  maxWidth = 'xl',
  className = ""
}: StandardPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Navigation */}
      {showBreadcrumb && (
        <AppBreadcrumb 
          items={breadcrumbItems}
          currentPage={title}
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
          <div className={`container mx-auto p-6 space-y-6 ${maxWidthClasses[maxWidth]} ${className}`}>
            {/* Page Header */}
            {(title || description) && (
              <div className="space-y-2">
                {title && (
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-lg text-muted-foreground max-w-3xl">
                    {description}
                  </p>
                )}
              </div>
            )}
            
            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}