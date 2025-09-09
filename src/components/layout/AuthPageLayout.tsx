import React from 'react';
import Footer from '@/components/Footer';

interface AuthPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showFooter?: boolean;
  className?: string;
}

export function AuthPageLayout({ 
  children, 
  title,
  subtitle,
  showFooter = true,
  className = ""
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted/50">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Auth Header */}
          {(title || subtitle) && (
            <div className="text-center space-y-2">
              {title && (
                <h1 className="text-3xl font-bold text-foreground">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-muted-foreground">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          
          {/* Auth Content */}
          <div className={className}>
            {children}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}