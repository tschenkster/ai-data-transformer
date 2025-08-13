import { NavLink, useLocation } from "react-router-dom";
import { Home, Upload, Brain, Settings, LogOut, User, Database, Target } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Home", url: "/home", icon: Home },
  { title: "Upload File", url: "/upload", icon: Upload },
  { title: "Manual Mapping", url: "/manual-mapping", icon: Target },
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { user, userAccount, signOut, isAdmin, isSuperAdmin } = useAuth();
  
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  
  const getNavClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50";

  return (
    <Sidebar className={open ? "w-60" : "w-14"} collapsible="icon">
      <div className="p-2">
        <SidebarTrigger />
      </div>
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) => 
                        `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-colors ${
                          isActive 
                            ? "bg-accent text-accent-foreground font-medium" 
                            : "text-foreground hover:bg-accent/50"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Admin</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) => 
                          `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-colors ${
                            isActive 
                              ? "bg-accent text-accent-foreground font-medium" 
                              : "text-foreground hover:bg-accent/50"
                          }`
                        }
                      >
                        <Settings className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Users</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <NavLink
                        to="/memory"
                        end
                        className={({ isActive }) => 
                          `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-colors ${
                            isActive 
                              ? "bg-accent text-accent-foreground font-medium" 
                              : "text-foreground hover:bg-accent/50"
                          }`
                        }
                      >
                        <Brain className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">Memory</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {isSuperAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <NavLink
                          to="/report-structures"
                          end
                          className={({ isActive }) => 
                            `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-colors ${
                              isActive 
                                ? "bg-accent text-accent-foreground font-medium" 
                                : "text-foreground hover:bg-accent/50"
                            }`
                          }
                        >
                          <Database className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">Report Structures</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* User Account Section */}
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled>
                  <User className="h-4 w-4" />
                  <div className="flex flex-col items-start text-xs">
                    <span className="truncate max-w-32">{userAccount?.first_name} {userAccount?.last_name}</span>
                    <span className="text-muted-foreground truncate max-w-32">{user?.email}</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}