import { NavLink, useLocation } from "react-router-dom";
import { Home, Brain, Settings, LogOut, User, Database, Languages, Map, FileSpreadsheet, BookOpen } from "lucide-react";
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
  { title: "CoA Translator", url: "/coa-translator", icon: Languages },
  { title: "CoA Mapper", url: "/coa-mapper", icon: Map },
  { title: "Trial Balance Import", url: "/trial-balance-import", icon: FileSpreadsheet },
  { title: "Journal Import", url: "/journal-import", icon: BookOpen },
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
        {/* Home - Prominent Top Position */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <NavLink
                    to="/home"
                    end
                    className={({ isActive }) => 
                      `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-all duration-200 relative ${
                        isActive 
                          ? "bg-primary/5 text-primary font-medium border-l-2 border-l-primary ml-0" 
                          : "text-foreground hover:bg-accent/30 border-l-2 border-l-transparent"
                      }`
                    }
                  >
                    <Home className={`h-4 w-4 flex-shrink-0 transition-colors ${
                      isActive ? "text-primary" : ""
                    }`} />
                    <span className="truncate">Home</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
                          `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-all duration-200 relative ${
                            isActive 
                              ? "bg-primary/5 text-primary font-medium border-l-2 border-l-primary ml-0" 
                              : "text-foreground hover:bg-accent/30 border-l-2 border-l-transparent"
                          }`
                        }
                      >
                        <Settings className={`h-4 w-4 flex-shrink-0 transition-colors ${
                          isActive ? "text-primary" : ""
                        }`} />
                        <span className="truncate">User Management</span>
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
                            `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-all duration-200 relative ${
                              isActive 
                                ? "bg-primary/5 text-primary font-medium border-l-2 border-l-primary ml-0" 
                                : "text-foreground hover:bg-accent/30 border-l-2 border-l-transparent"
                            }`
                          }
                        >
                          <Database className={`h-4 w-4 flex-shrink-0 transition-colors ${
                            isActive ? "text-primary" : ""
                          }`} />
                          <span className="truncate">Report Structures</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <NavLink
                        to="/memory"
                        end
                        className={({ isActive }) => 
                          `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-all duration-200 relative ${
                            isActive 
                              ? "bg-primary/5 text-primary font-medium border-l-2 border-l-primary ml-0" 
                              : "text-foreground hover:bg-accent/30 border-l-2 border-l-transparent"
                          }`
                        }
                      >
                        <Brain className={`h-4 w-4 flex-shrink-0 transition-colors ${
                          isActive ? "text-primary" : ""
                        }`} />
                        <span className="truncate">Memory Maintenance</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Data Transformation & Import</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) => 
                        `flex items-center gap-2 w-full px-2 py-1.5 rounded-md transition-all duration-200 relative ${
                          isActive 
                            ? "bg-primary/5 text-primary font-medium border-l-2 border-l-primary ml-0" 
                            : "text-foreground hover:bg-accent/30 border-l-2 border-l-transparent"
                        }`
                      }
                    >
                      <item.icon className={`h-4 w-4 flex-shrink-0 transition-colors ${
                        isActive ? "text-primary" : ""
                      }`} />
                      <span className="truncate">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

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
                <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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