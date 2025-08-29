import { SystemToolsLayout } from '@/features/system-administration/components/SystemToolsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { BarChart3, Zap, Database, TrendingUp, Calendar, Bell, ArrowRight, Star, Activity, Clock, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

export default function PerformanceAnalyzer() {
  const { isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');

  if (!isSuperAdmin) {
    return (
      <SystemToolsLayout
        toolId="performance-analyzer"
        toolTitle="Database Performance Analyzer"
        toolDescription="Analyze database performance and identify optimization opportunities."
        showNavigation={false}
      >
        <Card className="w-96 mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You must be a Super Administrator to access this page.
            </p>
          </CardContent>
        </Card>
      </SystemToolsLayout>
    );
  }

  const handleNotifyMe = () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to receive updates.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Notification Registered",
      description: "You'll be notified when the Performance Analyzer is available.",
    });
    setEmail('');
  };

  const plannedFeatures = [
    {
      icon: Database,
      title: "Query Performance Analysis",
      description: "Identify slow queries and get optimization recommendations with execution plan analysis."
    },
    {
      icon: TrendingUp,
      title: "Performance Trends",
      description: "Track database performance metrics over time to identify patterns and degradation."
    },
    {
      icon: Zap,
      title: "Index Optimization",
      description: "Analyze index usage and get recommendations for creating or removing indexes."
    },
    {
      icon: Activity,
      title: "Real-time Monitoring",
      description: "Monitor database performance in real-time with alerts for performance issues."
    }
  ];

  const mockMetrics = [
    { label: "Avg Query Time", value: "45ms", change: "+12%", status: "warning" },
    { label: "Active Connections", value: "23", change: "-5%", status: "good" },
    { label: "Cache Hit Rate", value: "94.2%", change: "+2%", status: "good" },
    { label: "Slow Queries", value: "7", change: "+3", status: "warning" }
  ];

  return (
    <SystemToolsLayout
      toolId="performance-analyzer"
      toolTitle="Database Performance Analyzer"
      toolDescription="Advanced database performance monitoring, analysis, and optimization recommendations."
    >
      {/* Coming Soon Banner */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-800">Coming Soon</CardTitle>
                <CardDescription className="text-blue-700">
                  Advanced database performance analysis and optimization
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
              Q1 2025
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-blue-800">
            The Database Performance Analyzer will provide comprehensive insights into your database performance, 
            including query optimization, index analysis, and real-time monitoring capabilities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="Enter your email for updates"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleNotifyMe} className="bg-blue-600 hover:bg-blue-700">
              <Bell className="mr-2 h-4 w-4" />
              Notify Me
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Planned Features
          </CardTitle>
          <CardDescription>
            Comprehensive database performance analysis capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plannedFeatures.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div key={feature.title} className="flex gap-4 p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Preview Mockup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Dashboard Preview
          </CardTitle>
          <CardDescription>
            A preview of the performance monitoring dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Mockup Dashboard */}
            <div className="border rounded-lg p-6 bg-muted/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/40 pointer-events-none" />
              
              <div className="space-y-6 relative">
                {/* Mock Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mockMetrics.map((metric) => (
                    <div key={metric.label} className="bg-background/80 p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{metric.label}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          metric.status === 'good' ? 'bg-green-500' : 
                          metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <div className="text-lg font-semibold">{metric.value}</div>
                      <div className={`text-xs ${
                        metric.change.startsWith('+') && metric.status === 'warning' ? 'text-yellow-600' :
                        metric.change.startsWith('-') ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock Chart Area */}
                <div className="bg-background/80 p-4 rounded-lg border">
                  <h3 className="font-medium mb-3">Query Performance Trends</h3>
                  <div className="h-32 bg-muted/50 rounded flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>

                {/* Mock Slow Queries */}
                <div className="bg-background/80 p-4 rounded-lg border">
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    Recent Slow Queries
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">SELECT * FROM reports WHERE...</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">2.3s</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">UPDATE user_accounts SET...</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">1.8s</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay indicating it's a preview */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-lg font-semibold text-muted-foreground">Preview Mode</p>
                <p className="text-sm text-muted-foreground">Live monitoring coming soon</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Development Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Development Timeline
          </CardTitle>
          <CardDescription>
            Track the progress of the Performance Analyzer development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Requirements Analysis</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Completed
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Performance metrics identification and monitoring strategy</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Database Integration</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Completed
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Setup monitoring functions and performance data collection</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Analytics Engine</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    In Progress
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Building analysis algorithms and optimization recommendations</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-muted-foreground rounded-full" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Dashboard & UI</span>
                  <Badge variant="outline">
                    Planned
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Interactive dashboard and visualization components</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-muted-foreground rounded-full" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Launch</span>
                  <Badge variant="outline">
                    Q1 2025
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">Public release with full monitoring and analysis features</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Performance Tips */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-primary">Performance Optimization Tips</CardTitle>
          <CardDescription>
            Manual optimization strategies while waiting for the automated analyzer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Query Optimization:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use proper indexes on frequently queried columns</li>
                <li>• Avoid SELECT * queries</li>
                <li>• Use LIMIT for large result sets</li>
                <li>• Consider query result caching</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Database Monitoring:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Monitor connection pool usage</li>
                <li>• Track slow query logs</li>
                <li>• Check cache hit ratios</li>
                <li>• Monitor disk I/O patterns</li>
              </ul>
            </div>
          </div>
          
          <Button variant="outline" className="w-full">
            <ArrowRight className="mr-2 h-4 w-4" />
            View Performance Best Practices
          </Button>
        </CardContent>
      </Card>
    </SystemToolsLayout>
  );
}