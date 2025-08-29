import { Link, useLocation } from 'react-router-dom';
import { Database, FileSpreadsheet, Settings, BarChart3, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SystemTool {
  id: string;
  title: string;
  path: string;
  icon: any;
  status: 'active' | 'coming-soon';
}

const systemTools: SystemTool[] = [
  {
    id: 'database-docs',
    title: 'Database Documentation',
    path: '/admin/system-tools/database-docs',
    icon: Database,
    status: 'active'
  },
  {
    id: 'codebase-docs',
    title: 'Codebase Documentation',
    path: '/admin/system-tools/codebase-docs',
    icon: FileSpreadsheet,
    status: 'active'
  },
  {
    id: 'file-organizer',
    title: 'File Structure Organizer',
    path: '/admin/system-tools/file-organizer',
    icon: Settings,
    status: 'coming-soon'
  },
  {
    id: 'performance-analyzer',
    title: 'Performance Analyzer',
    path: '/admin/system-tools/performance',
    icon: BarChart3,
    status: 'coming-soon'
  }
];

interface SystemToolsNavigationProps {
  currentToolId: string;
}

export function SystemToolsNavigation({ currentToolId }: SystemToolsNavigationProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isCurrentTool = (toolId: string) => toolId === currentToolId;

  return (
    <nav className="p-4 space-y-2">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
          SYSTEM TOOLS
        </h3>
      </div>

      {systemTools.map((tool) => {
        const IconComponent = tool.icon;
        const active = isCurrentTool(tool.id);
        const available = tool.status === 'active';

        return (
          <div key={tool.id} className="relative">
            {available ? (
              <Link to={tool.path}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-auto py-3 px-3 ${
                    active 
                      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                      : 'hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <IconComponent className={`h-4 w-4 flex-shrink-0 ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <span className="text-sm font-medium truncate">
                      {tool.title}
                    </span>
                  </div>
                  {active && (
                    <Circle className="h-2 w-2 fill-primary text-primary flex-shrink-0" />
                  )}
                </Button>
              </Link>
            ) : (
              <div className="px-3 py-3 flex items-center gap-3 opacity-60 cursor-not-allowed">
                <IconComponent className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-muted-foreground truncate block">
                    {tool.title}
                  </span>
                </div>
                <Badge variant="secondary" className="text-xs px-2 py-0.5 flex-shrink-0">
                  Soon
                </Badge>
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-6 pt-4 border-t">
        <Link to="/admin/system-tools">
          <Button variant="outline" size="sm" className="w-full">
            ← Back to Overview
          </Button>
        </Link>
      </div>
    </nav>
  );
}