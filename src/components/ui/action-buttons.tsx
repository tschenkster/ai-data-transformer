import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Eye, Edit, X, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActionButtonConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  className?: string;
}

interface ActionButtonsProps {
  title?: string;
  actions: ActionButtonConfig[];
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function ActionButtons({ 
  title = "Actions", 
  actions, 
  className,
  size = 'sm'
}: ActionButtonsProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">
          {title}
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant={action.variant || 'ghost'}
              size={size}
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                "h-7 px-2 text-xs",
                action.className
              )}
            >
              <Icon className="w-3 h-3 mr-0.5" />
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// Pre-configured action creators for common use cases
export const createSetActiveAction = (
  onClick: () => void,
  disabled?: boolean
): ActionButtonConfig => ({
  id: 'set-active',
  label: 'Set Active',
  icon: Check,
  onClick,
  disabled,
  className: 'hover:bg-green-50 hover:text-green-700 hover:border-green-200'
});

export const createViewAction = (
  onClick: () => void,
  disabled?: boolean
): ActionButtonConfig => ({
  id: 'view',
  label: 'View',
  icon: Eye,
  onClick,
  disabled,
  className: 'hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
});

export const createModifyAction = (
  onClick: () => void,
  disabled?: boolean
): ActionButtonConfig => ({
  id: 'modify',
  label: 'Modify',
  icon: Edit,
  onClick,
  disabled,
  className: 'hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200'
});

export const createDeleteAction = (
  onClick: () => void,
  disabled?: boolean
): ActionButtonConfig => ({
  id: 'delete',
  label: 'Delete',
  icon: X,
  onClick,
  disabled,
  className: 'hover:bg-red-50 hover:text-red-700 hover:border-red-200'
});

export default ActionButtons;