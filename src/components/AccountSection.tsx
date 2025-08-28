import { User, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { EntitySelector } from '@/features/system-administration';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';

interface AccountSectionProps {
  open: boolean;
  isActive: (path: string) => boolean;
  getNavClass: (path: string) => string;
}

export function AccountSection({ open, isActive, getNavClass }: AccountSectionProps) {
  const { userAccount, signOut, isSuperAdmin, isAdmin, currentEntity, availableEntities } = useAuth();

  const getRoleDisplay = () => {
    if (isSuperAdmin) return 'Super Admin';
    if (isAdmin) return 'Admin';
    return 'User';
  };

  const getRoleBadgeVariant = () => {
    if (isSuperAdmin) return 'default';
    if (isAdmin) return 'secondary';
    return 'outline';
  };

  return (
    <>
      {/* Entity & Role Info */}
      <SidebarMenuItem>
        <div className="px-2 py-3 space-y-2">
          {/* Entity Selector */}
          {availableEntities.length > 1 && (
            <div className="space-y-1">
              <EntitySelector />
            </div>
          )}
          
          {/* Current Entity & Role Display */}
          {open && (
            <div className="space-y-1">
              {currentEntity && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">{currentEntity.entity_name}</span>
                </div>
              )}
              <Badge variant={getRoleBadgeVariant()} className="text-xs h-5">
                {getRoleDisplay()}
              </Badge>
            </div>
          )}
        </div>
      </SidebarMenuItem>
      
      {/* User Profile */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink to="/account/profile" className={() => getNavClass('/account/profile')}>
            <User className={`h-4 w-4 flex-shrink-0 transition-colors ${
              isActive('/account/profile') ? "text-primary" : ""
            }`} />
            {open && (
              <div className="flex flex-col items-start text-xs min-w-0">
                <span className="truncate max-w-32 font-medium">
                  {userAccount?.first_name} {userAccount?.last_name}
                </span>
              </div>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
      
      {/* Logout */}
      <SidebarMenuItem>
        <SidebarMenuButton 
          onClick={signOut} 
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          {open && <span>Logout</span>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}