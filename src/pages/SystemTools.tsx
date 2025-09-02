import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Navigate, useNavigate } from "react-router-dom";
import { CompactPageLayout } from "@/components/layout/CompactPageLayout";
import { Database, FileSpreadsheet, Settings, BarChart3, ArrowRight, Plus, Wrench, Activity, Clock, TrendingUp, Users, Languages } from "lucide-react";
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
      id: 'sql-maintenance',
      title: 'SQL Maintenance',
      description: 'Clean and maintain database tables with comprehensive safety measures, audit trails, and CSV export functionality.',
      icon: Database,
      path: '/admin/system-tools/sql-maintenance',
      status: 'active',
      category: 'optimization',
      lastUsed: 'New',
      usageCount: 0
    },
    {
      id: 'historic-translation-fixer',
      title: 'Historic Translation Fixer',
      description: 'Fix NULL values in translation tables, enforce data integrity, and ensure complete audit trails.',
      icon: Wrench,
      path: '/admin/system-tools/historic-translation-fixer',
      status: 'active',
      category: 'optimization',
      lastUsed: 'New',
      usageCount: 0
    },
    {
      id: 'multilingual-management',
      title: 'Multilingual Management',
      description: 'Manage translations, migrate data to multilingual system, and configure language settings.',
      icon: Languages,
      path: '/admin/multilingual-management',
      status: 'active',
      category: 'documentation',
      lastUsed: 'New',
      usageCount: 0
    },
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
    { path: '/start', label: 'Start' },
    { path: '/admin', label: 'System Administration' },
    { path: '/admin/system-tools', label: 'System Tools' }
  ];


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
        className={`group transition-all duration-200 ${
          tool.status === 'active' 
            ? 'hover:shadow-md cursor-pointer border-border hover:border-primary/50 hover:bg-accent/50' 
            : 'opacity-60 cursor-not-allowed'
        }`}
        onClick={() => handleToolClick(tool)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${
              tool.status === 'active' 
                ? 'bg-primary/10 text-primary group-hover:bg-primary/15' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <IconComponent className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-base leading-none">{tool.title}</h3>
                {tool.status === 'coming-soon' && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Coming Soon
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {tool.description}
              </p>
            </div>
            {tool.status === 'active' && (
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <CompactPageLayout 
      currentPage="System Tools"
      breadcrumbItems={breadcrumbItems}
    >
      <div className="space-y-6">

        {/* Tool Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {systemTools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
        </div>


      </div>
    </CompactPageLayout>
  );
}