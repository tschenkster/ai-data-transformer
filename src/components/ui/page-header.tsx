import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface PageHeaderTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface PageHeaderDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface PageHeaderActionsProps {
  children: React.ReactNode;
  className?: string;
}

const PageHeader = ({ children, className }: PageHeaderProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
};

const PageHeaderTitle = ({ children, className }: PageHeaderTitleProps) => {
  return (
    <h1 className={cn("text-3xl font-bold tracking-tight text-foreground", className)}>
      {children}
    </h1>
  );
};

const PageHeaderDescription = ({ children, className }: PageHeaderDescriptionProps) => {
  return (
    <p className={cn("text-lg text-muted-foreground max-w-3xl", className)}>
      {children}
    </p>
  );
};

const PageHeaderActions = ({ children, className }: PageHeaderActionsProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  );
};

export { PageHeader, PageHeaderTitle, PageHeaderDescription, PageHeaderActions };