import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SystemToolsBreadcrumbProps {
  toolId: string;
  toolTitle: string;
}

export function SystemToolsBreadcrumb({ toolId, toolTitle }: SystemToolsBreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Link 
        to="/home" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      
      <ChevronRight className="h-4 w-4" />
      
      <Link 
        to="/admin" 
        className="hover:text-foreground transition-colors"
      >
        System Administration
      </Link>
      
      <ChevronRight className="h-4 w-4" />
      
      <Link 
        to="/admin/system-tools" 
        className="hover:text-foreground transition-colors"
      >
        System Tools
      </Link>
      
      <ChevronRight className="h-4 w-4" />
      
      <span className="text-foreground font-medium">{toolTitle}</span>
    </nav>
  );
}