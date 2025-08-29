import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useNavigate } from "react-router-dom";
import { CompactPageLayout } from "@/components/layout/CompactPageLayout";
import { Database, FileSpreadsheet, Settings, BarChart3, ArrowRight, Plus, Wrench } from "lucide-react";

interface SystemTool {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  status: 'active' | 'coming-soon';
}

export default function SystemTools() {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You must be a Super Administrator to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const systemTools: SystemTool[] = [
    {
      id: 'database-docs',
      title: 'Database Structure Documentation',
      description: 'Generate comprehensive documentation of the current database schema, including tables, relationships, constraints, and security policies.',
      icon: Database,
      path: '/admin/system-tools/database-docs',
      status: 'active'
    },
    {
      id: 'codebase-docs',
      title: 'Codebase Documentation Generator',
      description: 'Generate comprehensive documentation of the codebase structure, components, and architecture.',
      icon: FileSpreadsheet,
      path: '/admin/system-tools/codebase-docs',
      status: 'active'
    },
    {
      id: 'file-organizer',
      title: 'File Structure Organizer',
      description: 'Organize and optimize codebase file structure for better maintainability and development workflow.',
      icon: Settings,
      path: '/admin/system-tools/file-organizer',
      status: 'coming-soon'
    },
    {
      id: 'performance-analyzer',
      title: 'Database Performance Analyzer',
      description: 'Analyze database performance, identify bottlenecks, and optimize queries for better system performance.',
      icon: BarChart3,
      path: '/admin/system-tools/performance',
      status: 'coming-soon'
    }
  ];

  const handleToolClick = (tool: SystemTool) => {
    if (tool.status === 'active') {
      navigate(tool.path);
    }
  };

  const breadcrumbItems = [
    { path: '/home', label: 'Home' },
    { path: '/admin/user-profile-management', label: 'System Administration' }
  ];

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Wrench className="h-4 w-4 mr-2" />
        Maintenance
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New Tool
      </Button>
    </div>
  );

  return (
    <CompactPageLayout 
      currentPage="System Tools"
      breadcrumbItems={breadcrumbItems}
      actions={pageActions}
    >
      <div className="space-y-6">
        <p className="text-muted-foreground text-lg">
          Advanced system management tools for Super Administrators. Select a tool to get started.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {systemTools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Card 
              key={tool.id} 
              className={`transition-all duration-200 ${
                tool.status === 'active' 
                  ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer border-primary/20 hover:border-primary/40' 
                  : 'opacity-75 cursor-not-allowed'
              }`}
              onClick={() => handleToolClick(tool)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      tool.status === 'active' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{tool.title}</CardTitle>
                      {tool.status === 'coming-soon' && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                  {tool.status === 'active' && (
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {tool.description}
                </CardDescription>
                {tool.status === 'active' && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToolClick(tool);
                    }}
                  >
                    Open Tool
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        </div>

        <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-dashed">
          <h3 className="font-semibold mb-2">Need a new system tool?</h3>
          <p className="text-sm text-muted-foreground">
            System tools are designed to help Super Administrators manage and maintain the platform. 
            If you need additional tools for specific administrative tasks, please contact the development team.
          </p>
        </div>
      </div>
    </CompactPageLayout>
  );
}