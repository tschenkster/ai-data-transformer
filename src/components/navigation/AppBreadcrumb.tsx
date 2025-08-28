import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbConfig {
  path: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AppBreadcrumbProps {
  items?: BreadcrumbConfig[];
  currentPage?: string;
  actions?: React.ReactNode;
}

const DEFAULT_ROUTES: Record<string, BreadcrumbConfig> = {
  '/': { path: '/', label: 'Home', icon: Home },
  '/home': { path: '/home', label: 'Home', icon: Home },
  '/dashboard': { path: '/dashboard', label: 'Dashboard' },
  '/admin': { path: '/admin', label: 'Administration' },
  '/admin/user-entity-management': { path: '/admin/user-entity-management', label: 'User & Entity Management' },
  '/admin/system-tools': { path: '/admin/system-tools', label: 'System Tools' },
  '/admin/system-tools/database-docs': { path: '/admin/system-tools/database-docs', label: 'Database Documentation' },
  '/reports': { path: '/reports', label: 'Reports' },
  '/reports/structures': { path: '/reports/structures', label: 'Report Structures' },
  '/imports': { path: '/imports', label: 'Data Import' },
  '/imports/trial-balance': { path: '/imports/trial-balance', label: 'Trial Balance Import' },
  '/imports/journal-entries': { path: '/imports/journal-entries', label: 'Journal Entry Import' },
  '/coa-translator': { path: '/coa-translator', label: 'CoA Translator' },
  '/coa-mapper': { path: '/coa-mapper', label: 'CoA Mapper' },
};

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbConfig[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbConfig[] = [];
  
  // Always start with home
  breadcrumbs.push(DEFAULT_ROUTES['/home'] || { path: '/home', label: 'Home', icon: Home });
  
  // Build path segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    if (DEFAULT_ROUTES[currentPath]) {
      breadcrumbs.push(DEFAULT_ROUTES[currentPath]);
    } else {
      // Create a fallback breadcrumb for unknown paths
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ path: currentPath, label });
    }
  });
  
  return breadcrumbs;
}

export function AppBreadcrumb({ items, currentPage, actions }: AppBreadcrumbProps) {
  const location = useLocation();
  
  // Use provided items or generate from current path
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);
  const lastItem = breadcrumbItems[breadcrumbItems.length - 1];
  const previousItems = breadcrumbItems.slice(0, -1);
  
  return (
    <div className="border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
      <div className="container max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <Breadcrumb>
            <BreadcrumbList>
              {previousItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <React.Fragment key={item.path}>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link 
                          to={item.path}
                          className="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {IconComponent && <IconComponent className="h-4 w-4" />}
                          <span>{item.label}</span>
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </React.Fragment>
                );
              })}
              
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium">
                  {currentPage || lastItem?.label}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}