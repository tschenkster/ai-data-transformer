import React from 'react';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-20">
        <div className="text-center animate-fade-in space-y-4 mb-16">
          <Badge className="px-4 py-2 bg-primary text-primary-foreground">Simple Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Start Free, Scale as You Grow</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            No hidden fees, no per-user charges. Just powerful finance tools that grow with your startup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 flex flex-col h-full">
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">€0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mt-2">Get started with basic DATEV conversion</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>3 Uploads per Month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>AI Conversion to clean xlsx file</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>GDPR compliance</span>
                </div>
              </div>
            </div>

            <Button className="w-full mt-6" variant="outline">
              Get Started Free
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 flex flex-col h-full">
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">€49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mt-2">Perfect for getting started with properly storing data</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Unlimited Uploads per Month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>AI Conversion to clean xlsx file</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>GDPR compliance</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Storage in SQL database</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Standard Report Templates</span>
                </div>
              </div>
            </div>

            <Button className="w-full mt-6" variant="outline">
              Start Free Trial
            </Button>
          </Card>

          <Card className="p-8 hover:shadow-xl transition-all duration-300 border-2 border-primary relative overflow-hidden flex flex-col h-full">
            <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">Most Popular</Badge>
            
            <div className="flex-1 space-y-6 relative z-10">
              <div>
                <h3 className="text-2xl font-bold mb-2">Professional</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">€99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mt-2">For growing finance teams needing advanced features</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Unlimited Uploads per Month</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>AI Conversion to clean xlsx file</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>GDPR compliance</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Storage in SQL database</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Standard Report Templates</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>Design your own reports</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span>API for 3rd Party BI Tool</span>
                </div>
              </div>
            </div>

            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow mt-6 relative z-10">
              Start Free Trial
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;