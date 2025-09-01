import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Activity, TrendingUp, Clock, AlertCircle, RefreshCw, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface MonitoringMetric {
  id: string;
  name: string;
  value: string | number;
  trend?: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical';
  description: string;
}

interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
}

export function MonitoringPanel() {
  const [metrics, setMetrics] = useState<MonitoringMetric[]>([
    {
      id: 'data_completeness',
      name: 'Data Completeness',
      value: '0%',
      status: 'good',
      description: 'Percentage of translation records with complete source tracking'
    },
    {
      id: 'constraint_violations',
      name: 'Constraint Violations',
      value: 0,
      status: 'good',
      description: 'Number of records violating data integrity constraints'
    },
    {
      id: 'translation_accuracy',
      name: 'Translation Accuracy',
      value: 'N/A',
      status: 'good',
      description: 'AI translation accuracy based on source tracking quality'
    },
    {
      id: 'system_performance',
      name: 'System Performance',
      value: 'N/A',
      status: 'good',
      description: 'Translation service response time (avg last 24h)'
    }
  ]);

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchMonitoringData = async () => {
    setLoading(true);
    
    try {
      // Fetch monitoring data from the backend
      const { data, error } = await supabase.functions.invoke('historic-translation-monitoring', {
        body: { operation: 'get_dashboard_metrics' }
      });

      if (error) throw error;

      // Update metrics with real data
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: data?.metrics?.[metric.id]?.value ?? metric.value,
        status: data?.metrics?.[metric.id]?.status ?? metric.status,
        trend: data?.metrics?.[metric.id]?.trend
      })));

      // Update alerts
      setAlerts(data?.alerts?.map((alert: any) => ({
        ...alert,
        timestamp: new Date(alert.timestamp)
      })) || []);

      setLastUpdate(new Date());
      
    } catch (error: any) {
      console.error('Error fetching monitoring data:', error);
      toast({
        title: "Monitoring Error",
        description: "Failed to fetch current monitoring data.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupAutomaticMonitoring = async () => {
    try {
      const { error } = await supabase.functions.invoke('historic-translation-monitoring', {
        body: { 
          operation: 'setup_monitoring',
          schedule: 'daily' // Run daily checks
        }
      });

      if (error) throw error;

      toast({
        title: "Monitoring Activated",
        description: "Automatic daily monitoring has been configured successfully.",
      });
      
    } catch (error: any) {
      toast({
        title: "Setup Failed",
        description: error.message || "Failed to setup automatic monitoring.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    
    // Set up periodic refresh every 5 minutes
    const interval = setInterval(fetchMonitoringData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: MonitoringMetric['status']) => {
    switch (status) {
      case 'good': return 'text-success';
      case 'warning': return 'text-warning';
      case 'critical': return 'text-destructive';
    }
  };

  const getStatusBadge = (status: MonitoringMetric['status']) => {
    switch (status) {
      case 'good':
        return <Badge variant="outline" className="bg-success/10 text-success border-success">Good</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning">Warning</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive">Critical</Badge>;
    }
  };

  const getTrendIcon = (trend?: MonitoringMetric['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-success" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-destructive rotate-180" />;
      default: return null;
    }
  };

  const getSeverityIcon = (severity: AlertItem['severity']) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-warning" />;
      default: return <Activity className="h-4 w-4 text-primary" />;
    }
  };

  const criticalMetrics = metrics.filter(m => m.status === 'critical').length;
  const warningMetrics = metrics.filter(m => m.status === 'warning').length;

  return (
    <div className="space-y-6">
      
      {/* Monitoring Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Monitoring
              </CardTitle>
              <CardDescription>
                Continuous monitoring of translation data integrity and system health
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={fetchMonitoringData}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={setupAutomaticMonitoring}
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Setup Auto-Monitoring
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {metrics.filter(m => m.status === 'good').length}
              </div>
              <div className="text-sm text-muted-foreground">Healthy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">{warningMetrics}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">{criticalMetrics}</div>
              <div className="text-sm text-muted-foreground">Critical</div>
            </div>
          </div>
          {lastUpdate && (
            <div className="mt-4 text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{metric.name}</CardTitle>
                {getStatusBadge(metric.status)}
              </div>
              <CardDescription>{metric.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                  {metric.value}
                </span>
                {getTrendIcon(metric.trend)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Active Alerts
            {alerts.length > 0 && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                {alerts.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time alerts for data integrity issues and system events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active alerts. All systems are running normally.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getSeverityIcon(alert.severity)}
                  <div className="flex-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">
                        {alert.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Health Summary */}
      {criticalMetrics === 0 && warningMetrics === 0 && alerts.length === 0 && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Excellent! All monitoring metrics are healthy and no active alerts. 
            Your translation system is operating at optimal performance with complete data integrity.
          </AlertDescription>
        </Alert>
      )}

      {(criticalMetrics > 0 || alerts.length > 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Attention required:</strong> {criticalMetrics} critical metric{criticalMetrics !== 1 ? 's' : ''} 
            and {alerts.length} active alert{alerts.length !== 1 ? 's' : ''} detected. 
            Review the issues above and take corrective action as needed.
          </AlertDescription>
        </Alert>
      )}

    </div>
  );
}