import React from 'react';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';

interface LandingPageLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export function LandingPageLayout({ 
  children, 
  showHeader = true,
  showFooter = true,
  className = ""
}: LandingPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {showHeader && <Header />}
      
      {/* Main Content */}
      <main className={className}>
        {children}
      </main>
      
      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}