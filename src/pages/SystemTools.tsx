import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useNavigate } from "react-router-dom";
import { CompactPageLayout } from "@/components/layout/CompactPageLayout";
import { Database, FileSpreadsheet, Settings, BarChart3, ArrowRight, Plus, Wrench, Activity, Clock, TrendingUp, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SystemTool {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  status: 'active' | 'coming-soon';
  category: 'documentation' | 'optimization' | 'monitoring';
  lastUsed?: string;
  usageCount?: number;
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
      status: 'active',
      category: 'documentation',
      lastUsed: '2 hours ago',
      usageCount: 127
    },
    {
      id: 'codebase-docs',
      title: 'Codebase Documentation Generator',
      description: 'Generate comprehensive documentation of the codebase structure, components, and architecture.',
      icon: FileSpreadsheet,
      path: '/admin/system-tools/codebase-docs',
      status: 'active',
      category: 'documentation',
      lastUsed: '1 day ago',
      usageCount: 89
    },
    {
      id: 'file-organizer',
      title: 'File Structure Organizer',
      description: 'Organize and optimize codebase file structure for better maintainability and development workflow.',
      icon: Settings,
      path: '/admin/system-tools/file-organizer',
      status: 'coming-soon',
      category: 'optimization'
    },
    {
      id: 'performance-analyzer',
      title: 'Database Performance Analyzer',
      description: 'Analyze database performance, identify bottlenecks, and optimize queries for better system performance.',
      icon: BarChart3,
      path: '/admin/system-tools/performance',
      status: 'coming-soon',
      category: 'monitoring'
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

  const activeTools = systemTools.filter(tool => tool.status === 'active');
  const comingSoonTools = systemTools.filter(tool => tool.status === 'coming-soon');
  const toolCategories = {
    documentation: systemTools.filter(tool => tool.category === 'documentation'),
    optimization: systemTools.filter(tool => tool.category === 'optimization'),
    monitoring: systemTools.filter(tool => tool.category === 'monitoring')
  };

  const ToolCard = ({ tool }: { tool: SystemTool }) => {
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
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {tool.category}
                  </Badge>
                </div>
                {tool.status === 'coming-soon' && (
                  <Badge variant="outline" className="mt-1 bg-orange-50 text-orange-700 border-orange-200">
                    Coming Soon
                  </Badge>
                )}
                {tool.status === 'active' && tool.lastUsed && (
                  <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last used {tool.lastUsed}
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {tool.usageCount} uses
                    </div>
                  </div>
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
  };

  return (
    <CompactPageLayout 
      currentPage="System Tools"
      breadcrumbItems={breadcrumbItems}
      actions={pageActions}
    >
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{activeTools.length}</div>
              <div className="text-sm text-muted-foreground">Active Tools</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{comingSoonTools.length}</div>
              <div className="text-sm text-muted-foreground">Coming Soon</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{activeTools.reduce((sum, tool) => sum + (tool.usageCount || 0), 0)}</div>
              <div className="text-sm text-muted-foreground">Total Usage</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">98.5%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </CardContent>
          </Card>
        </div>

        <p className="text-muted-foreground text-lg">
          Advanced system management tools for Super Administrators. Select a tool to get started.
        </p>

        {/* Tabbed Interface */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Tools</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {systemTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          </TabsContent>

          <TabsContent value="documentation" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {toolCategories.documentation.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {toolCategories.optimization.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {toolCategories.monitoring.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeTools
                .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                .map((tool) => <ToolCard key={tool.id} tool={tool} />)
              }
            </div>
          </TabsContent>
        </Tabs>

        {/* Roadmap Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Development Roadmap
            </CardTitle>
            <CardDescription>
              Upcoming system tools and features in development
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Q1 2025</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Database Performance Analyzer</li>
                  <li>• Query optimization recommendations</li>
                  <li>• Real-time monitoring dashboard</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Q2 2025</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• File Structure Organizer</li>
                  <li>• Automated code refactoring</li>
                  <li>• Custom organization rules</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-dashed">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Need a new system tool?
          </h3>
          <p className="text-sm text-muted-foreground">
            System tools are designed to help Super Administrators manage and maintain the platform. 
            If you need additional tools for specific administrative tasks, please contact the development team.
          </p>
        </div>
      </div>
    </CompactPageLayout>
  );
}