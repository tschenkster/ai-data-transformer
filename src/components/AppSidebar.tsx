import { NavLink, useLocation } from "react-router-dom";
import React from "react";
import { 
  Home, 
  BarChart3, 
  Settings, 
  Users, 
  Database, 
  Brain,
  Languages, 
  Map, 
  FileSpreadsheet, 
  BookOpen, 
  PieChart,
  Table,
  Shield,
  Settings2,
  User, 
  LogOut,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSidebarState } from "@/hooks/use-sidebar-state";
import { useIsMobile } from "@/hooks/use-mobile";
import { AccountSection } from "./AccountSection";
import { EntitySelector } from "@/features/system-administration";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface NavigationItem {
  title: string;
  url: string;
  icon: any;
  permissions?: 'admin' | 'superAdmin';
}

interface NavigationGroup {
  id: string;
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
  permissions?: 'admin' | 'superAdmin';
}

export function AppSidebar() {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const { user, userAccount, signOut, isAdmin, isSuperAdmin, availableEntities } = useAuth();
  const { toggleGroup, isGroupCollapsed } = useSidebarState();
  const isMobile = useIsMobile();
  
  const currentPath = location.pathname;
  
  // Auto-close sidebar on mobile when navigating
  React.useEffect(() => {
    if (isMobile && open) {
      setOpen(false);
    }
  }, [currentPath, isMobile, open, setOpen]);
  
  // Check if a path is active, including child paths
  const isActive = (path: string) => {
    if (path === '/admin/user-entity-management') {
      return currentPath.startsWith('/admin/user-entity-management');
    }
    return currentPath === path;
  };

  // Navigation structure matching the exact requirements
  const navigationGroups: NavigationGroup[] = [
    {
      id: 'admin',
      title: 'System Administration',  
      collapsible: true,
      permissions: 'admin',
      items: [
        { 
          title: 'Dashboard', 
          url: '/dashboard', 
          icon: BarChart3,
          permissions: 'admin'
        },
        { 
          title: 'User & Entity Management', 
          url: '/admin/user-entity-management', 
          icon: Users,
          permissions: 'admin'
        },
        { 
          title: 'Activity Log', 
          url: '/admin/activity-log', 
          icon: Shield,
          permissions: 'admin'
        },
        { 
          title: 'System Administration', 
          url: '/admin/system', 
          icon: Settings2,
          permissions: 'superAdmin'
        }
      ]
    },
    {
      id: 'data',
      title: 'Data Import & Transformation',
      collapsible: true,
      items: [
        { title: 'CoA Translator', url: '/data/coa-translator', icon: Languages, permissions: 'admin' },
        { title: 'CoA Mapper', url: '/data/coa-mapper', icon: Map },
        { title: 'Trial Balance Import', url: '/data/trial-balance-import', icon: FileSpreadsheet },
        { title: 'Journal Import', url: '/data/journal-import', icon: BookOpen },
        { 
          title: 'Report Configuration', 
          url: '/admin/report-configuration', 
          icon: Database,
          permissions: 'superAdmin'
        },
        { 
          title: 'Memory Maintenance', 
          url: '/admin/memory-maintenance', 
          icon: Brain
        }
      ]
    },
    {
      id: 'reports',
      title: 'Data Downloads & Reports',
      collapsible: true,
      items: [
        { title: 'Financial Reports', url: '/reports/financial-reports', icon: PieChart },
        { title: 'SQL Tables', url: '/reports/sql-tables', icon: Table, permissions: 'admin' }
      ]
    }
  ];

  // Check if user has permission for an item
  const hasPermission = (permissions?: 'admin' | 'superAdmin') => {
    if (!permissions) return true;
    if (permissions === 'admin') return isAdmin;
    if (permissions === 'superAdmin') return isSuperAdmin;
    return false;
  };

  // Active state styling
  const getNavClass = (path: string) => {
    const active = isActive(path);
    return `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-all duration-200 relative ${
      active 
        ? "bg-primary/10 text-primary font-medium border-l-2 border-l-primary ml-0" 
        : "text-foreground hover:bg-accent/50 border-l-2 border-l-transparent"
    }`;
  };

  const renderNavigationItem = (item: NavigationItem) => {
    if (!hasPermission(item.permissions)) return null;
    
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild>
          <NavLink to={item.url} className={() => getNavClass(item.url)}>
            <item.icon className={`h-4 w-4 flex-shrink-0 transition-colors ${
              isActive(item.url) ? "text-primary" : ""
            }`} />
            {open && <span className="truncate">{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const renderCollapsibleGroup = (group: NavigationGroup) => {
    if (!hasPermission(group.permissions)) return null;
    
    const collapsed = isGroupCollapsed(group.id);
    const hasActiveChild = group.items.some(item => isActive(item.url) && hasPermission(item.permissions));
    
    return (
      <SidebarGroup key={group.id}>
        <Collapsible open={!collapsed} onOpenChange={() => toggleGroup(group.id)}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className={`w-full justify-between h-auto p-2 font-medium text-sm ${
                hasActiveChild ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="truncate">{group.title}</span>
              {open && (collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1">
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(renderNavigationItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </Collapsible>
      </SidebarGroup>
    );
  };

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <SidebarContent className="gap-0">
        {/* Entity Selector at Top */}
        {availableEntities.length > 1 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <div className="px-2 py-2">
                <EntitySelector />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        {/* Separator after Entity Selector if it exists */}
        {availableEntities.length > 1 && <SidebarSeparator />}

        {/* Primary Navigation */}
        <SidebarGroup className="py-2">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" className="h-10">
                  <NavLink to="/home" className={() => getNavClass('/home')}>
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                      isActive('/home') 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "bg-muted/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}>
                      <Home className="h-4 w-4" />
                    </div>
                    {open && (
                      <div className="flex flex-col">
                        <span className="font-medium">Home</span>
                        <span className="text-xs text-muted-foreground">Welcome dashboard</span>
                      </div>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Elegant separator */}
        <div className="mx-4 my-2 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>

        {/* Collapsible Groups */}
        {navigationGroups.map(renderCollapsibleGroup)}

        {/* Account Section */}
        <SidebarSeparator />
        <SidebarGroup>
          <Collapsible open={!isGroupCollapsed('account')} onOpenChange={() => toggleGroup('account')}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-between h-auto p-2 font-medium text-sm text-muted-foreground hover:text-foreground"
              >
                <span className="truncate">Account</span>
                {open && (isGroupCollapsed('account') ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              <SidebarGroupContent>
                <SidebarMenu>
                  <AccountSection 
                    open={open}
                    isActive={isActive}
                    getNavClass={getNavClass}
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}