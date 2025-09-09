import React from 'react';
import { cn } from '@/lib/utils';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface SectionTitleProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4;
  className?: string;
}

interface SectionDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface SectionContentProps {
  children: React.ReactNode;
  className?: string;
}

const spacingClasses = {
  sm: 'space-y-4',
  md: 'space-y-6', 
  lg: 'space-y-8',
  xl: 'space-y-12'
};

const Section = ({ children, className, spacing = 'md' }: SectionProps) => {
  return (
    <section className={cn(spacingClasses[spacing], className)}>
      {children}
    </section>
  );
};

const SectionHeader = ({ children, className }: SectionHeaderProps) => {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
};

const SectionTitle = ({ children, level = 2, className }: SectionTitleProps) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements;
  
  const levelClasses = {
    1: "text-3xl font-bold tracking-tight text-foreground",
    2: "text-2xl font-semibold tracking-tight text-foreground", 
    3: "text-xl font-semibold text-foreground",
    4: "text-lg font-medium text-foreground"
  };
  
  return (
    <Component className={cn(levelClasses[level], className)}>
      {children}
    </Component>
  );
};

const SectionDescription = ({ children, className }: SectionDescriptionProps) => {
  return (
    <p className={cn("text-muted-foreground", className)}>
      {children}
    </p>
  );
};

const SectionContent = ({ children, className }: SectionContentProps) => {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  );
};

export { Section, SectionHeader, SectionTitle, SectionDescription, SectionContent };