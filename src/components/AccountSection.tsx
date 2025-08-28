import { User, LogOut } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

interface AccountSectionProps {
  open: boolean;
  isActive: (path: string) => boolean;
  getNavClass: (path: string) => string;
}

export function AccountSection({ open, isActive, getNavClass }: AccountSectionProps) {
  const { userAccount, signOut } = useAuth();

  return (
    <>
      {/* User Profile */}
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink to="/account/profile" className={() => getNavClass('/account/profile')}>
            <User className={`h-4 w-4 flex-shrink-0 transition-colors ${
              isActive('/account/profile') ? "text-primary" : ""
            }`} />
            {open && (
              <div className="flex flex-col items-start text-xs min-w-0">
                <span className="truncate max-w-32">
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