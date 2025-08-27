import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfileDisplay } from '@/features/user-management';
import { ReportStructureCard } from '@/features/report-structures';
import { WorkflowStatusManager } from '@/components/WorkflowStatusManager';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Users, FileText, Activity } from 'lucide-react';

interface DashboardStats {
  total_structures: number;
  total_line_items: number;
  recent_logins: number;
  user_count: number;
}

export default function Dashboard() {
  const { isAdmin, user } = useAuth();
  const [activeStructureUuid, setActiveStructureUuid] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveStructure();
    if (isAdmin) {
      fetchDashboardStats();
    }
  }, [isAdmin]);

  const fetchActiveStructure = async () => {
    try {
      const { data, error } = await supabase
        .from('report_structures')
        .select('report_structure_uuid')
        .eq('is_active', true)
        .single();

      if (data && !error) {
        setActiveStructureUuid(data.report_structure_uuid);
      }
    } catch (error) {
      console.error('Error fetching active structure:', error);
    }
  };

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_enhanced_user_summary');

      if (data && data.length > 0 && !error) {
        setDashboardStats({
          total_structures: Number(data[0].total_structures || 0),
          total_line_items: Number(data[0].total_line_items || 0),
          recent_logins: Number(data[0].recent_logins || 0),
          user_count: Number(data[0].user_count || 0)
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your account.
          </p>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <UserProfileDisplay />
        </div>

        {/* Admin Stats Section */}
        {isAdmin && (
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  System Overview
                </CardTitle>
                <CardDescription>
                  Enhanced statistics powered by our new database functions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-8 w-[60px]" />
                      </div>
                    ))}
                  </div>
                ) : dashboardStats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Total Users</span>
                      </div>
                      <Badge variant="secondary" className="text-lg px-3 py-1">
                        {dashboardStats.user_count.toLocaleString()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Recent Logins</span>
                      </div>
                      <Badge variant="default" className="text-lg px-3 py-1">
                        {dashboardStats.recent_logins.toLocaleString()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Report Structures</span>
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {dashboardStats.total_structures.toLocaleString()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Total Line Items</span>
                      </div>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        {dashboardStats.total_line_items.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No statistics available</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Active Report Structure Section */}
      {activeStructureUuid && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Active Report Structure</h2>
          <ReportStructureCard 
            structureUuid={activeStructureUuid}
            className="max-w-2xl"
          />
        </div>
      )}

      {/* Workflow Status Manager Section - New ENUM Features */}
      {isAdmin && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Workflow Management</h2>
          <WorkflowStatusManager />
        </div>
      )}
    </div>
  );
}