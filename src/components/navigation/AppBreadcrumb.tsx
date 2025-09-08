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
import { useUITranslations } from '@/hooks/useUITranslations';

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
  '/': { path: '/', label: 'Start', icon: Home },
  '/start': { path: '/start', label: 'Start', icon: Home },
  '/dashboard': { path: '/dashboard', label: 'Dashboard' },
  '/admin': { path: '/admin', label: 'System Administration' },
  '/admin/user-profile-management': { path: '/admin/user-profile-management', label: 'User Profile Management' },
  '/admin/roles-permissions-management': { path: '/admin/roles-permissions-management', label: 'Roles & Permissions Management' },
  '/admin/entity-management': { path: '/admin/entity-management', label: 'Entity Management' },
  '/admin/system-tools': { path: '/admin/system-tools', label: 'System Tools' },
  '/admin/system-tools/database-docs': { path: '/admin/system-tools/database-docs', label: 'Database Documentation' },
  '/admin/system-tools/codebase-docs': { path: '/admin/system-tools/codebase-docs', label: 'Codebase Documentation Generator' },
  '/admin/system-tools/performance-analyzer': { path: '/admin/system-tools/performance-analyzer', label: 'Performance Analyzer' },
  '/admin/system-tools/file-organizer': { path: '/admin/system-tools/file-organizer', label: 'File Organizer' },
  '/reports': { path: '/reports', label: 'Reports' },
  '/reports/structures': { path: '/reports/structures', label: 'Report Structures' },
  '/imports': { path: '/imports', label: 'Data Import' },
  '/imports/trial-balance': { path: '/imports/trial-balance', label: 'Trial Balance Import' },
  '/imports/journal-entries': { path: '/imports/journal-entries', label: 'Journal Entry Import' },
  '/coa-translator': { path: '/coa-translator', label: 'CoA Translator' },
  '/coa-mapper': { path: '/coa-mapper', label: 'CoA Mapper' },
};

function generateBreadcrumbsFromPath(pathname: string, routes: Record<string, BreadcrumbConfig>): BreadcrumbConfig[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbConfig[] = [];
  
  // Always start with home
  breadcrumbs.push(routes['/start'] || { path: '/start', label: 'Start', icon: Home });
  
  // Build path segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    if (routes[currentPath]) {
      breadcrumbs.push(routes[currentPath]);
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
  const { t } = useUITranslations();
  
  // Create translated default routes
  const getTranslatedRoutes = () => ({
    '/': { path: '/', label: t('NAV_START', 'Start'), icon: Home },
    '/start': { path: '/start', label: t('NAV_START', 'Start'), icon: Home },
    '/dashboard': { path: '/dashboard', label: t('NAV_DASHBOARD', 'Dashboard') },
    '/admin': { path: '/admin', label: t('NAV_SYSTEM_ADMINISTRATION', 'System Administration') },
    '/admin/user-profile-management': { path: '/admin/user-profile-management', label: t('NAV_USER_PROFILE_MANAGEMENT', 'User Profile Management') },
    '/admin/roles-permissions-management': { path: '/admin/roles-permissions-management', label: t('NAV_ROLES_PERMISSIONS_MANAGEMENT', 'Roles & Permissions Management') },
    '/admin/entity-management': { path: '/admin/entity-management', label: t('NAV_ENTITY_MANAGEMENT', 'Entity Management') },
    '/admin/system-tools': { path: '/admin/system-tools', label: t('NAV_SYSTEM_TOOLS', 'System Tools') },
    '/admin/system-tools/database-docs': { path: '/admin/system-tools/database-docs', label: t('NAV_DATABASE_DOCUMENTATION', 'Database Documentation') },
    '/admin/system-tools/codebase-docs': { path: '/admin/system-tools/codebase-docs', label: t('NAV_CODEBASE_DOCUMENTATION', 'Codebase Documentation Generator') },
    '/admin/system-tools/performance-analyzer': { path: '/admin/system-tools/performance-analyzer', label: t('NAV_PERFORMANCE_ANALYZER', 'Performance Analyzer') },
    '/admin/system-tools/file-organizer': { path: '/admin/system-tools/file-organizer', label: t('NAV_FILE_ORGANIZER', 'File Organizer') },
    '/admin/report-structure-manager': { path: '/admin/report-structure-manager', label: t('NAV_REPORT_STRUCTURE_MANAGER', 'Report Structure Manager') },
    '/reports': { path: '/reports', label: t('NAV_REPORTS', 'Reports') },
    '/reports/structures': { path: '/reports/structures', label: t('NAV_REPORT_STRUCTURES', 'Report Structures') },
    '/imports': { path: '/imports', label: t('NAV_DATA_IMPORT', 'Data Import') },
    '/imports/trial-balance': { path: '/imports/trial-balance', label: t('NAV_TRIAL_BALANCE_IMPORT', 'Trial Balance Import') },
    '/imports/journal-entries': { path: '/imports/journal-entries', label: t('NAV_JOURNAL_ENTRY_IMPORT', 'Journal Entry Import') },
    '/coa-translator': { path: '/coa-translator', label: t('NAV_COA_TRANSLATOR', 'CoA Translator') },
    '/coa-mapper': { path: '/coa-mapper', label: t('NAV_COA_MAPPER', 'CoA Mapper') },
  });
  
  // Use provided items or generate from current path with translations
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname, getTranslatedRoutes());
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
                  <div key={item.path} className="flex items-center">
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
                  </div>
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