import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfileDisplay, UserService } from '@/features/user-management';
import { ReportStructureCard } from '@/features/report-structure-manager';
import { WorkflowStatusManager } from '@/components/WorkflowStatusManager';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Activity, 
  Plus, 
  Settings, 
  TrendingUp, 
  Clock, 
  Shield, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Pause,
  ArrowUp,
  ArrowDown,
  Eye,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UserAccount, UserStats } from '@/features/user-management/types';

interface DashboardStats {
  total_structures: number;
  total_line_items: number;
  recent_logins: number;
  user_count: number;
}

export default function Dashboard() {
  const { isAdmin, user, userAccount, isSuperAdmin } = useAuth();
  const [activeStructureUuid, setActiveStructureUuid] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [userStatsLoading, setUserStatsLoading] = useState(false);

  useEffect(() => {
    fetchActiveStructure();
    if (isAdmin) {
      fetchDashboardStats();
      fetchUsers();
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

  const fetchUsers = async () => {
    setUserStatsLoading(true);
    try {
      const userList = await UserService.fetchUsers(isSuperAdmin, userAccount?.user_uuid);
      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users for stats:', error);
    } finally {
      setUserStatsLoading(false);
    }
  };

  // Custom Modern Stats Card Component
  const ModernStatsCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = "blue",
    description 
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    color?: "blue" | "green" | "purple" | "orange" | "red";
    description?: string;
  }) => {
    const colorClasses = {
      blue: "from-blue-500 to-blue-600",
      green: "from-green-500 to-green-600", 
      purple: "from-purple-500 to-purple-600",
      orange: "from-orange-500 to-orange-600",
      red: "from-red-500 to-red-600"
    };

    const bgClasses = {
      blue: "from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900",
      green: "from-green-50 to-green-100 dark:from-green-950 dark:to-green-900",
      purple: "from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900", 
      orange: "from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900",
      red: "from-red-50 to-red-100 dark:from-red-950 dark:to-red-900"
    };

    return (
      <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${bgClasses[color]} shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <div className="flex items-baseline space-x-2">
                <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                {trend && trendValue && (
                  <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
                    trend === 'up' ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20' :
                    trend === 'down' ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20' :
                    'text-gray-700 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20'
                  }`}>
                    {trend === 'up' && <ArrowUp className="h-3 w-3 mr-1" />}
                    {trend === 'down' && <ArrowDown className="h-3 w-3 mr-1" />}
                    {trendValue}
                  </div>
                )}
              </div>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
            <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const dashboardActions = (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <>
          <Button variant="outline" size="sm" className="bg-background/80 backdrop-blur-sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg">
            <Plus className="h-4 w-4 mr-2" />
            Quick Action
          </Button>
        </>
      )}
    </div>
  );

  const adminCrumbs = [
    { path: '/start', label: 'Start' },
    { path: '/admin', label: 'System Administration' },
    { path: '/dashboard', label: 'Dashboard' }
  ];

  return (
    <CompactPageLayout 
      breadcrumbItems={adminCrumbs}
      currentPage="Dashboard"
      actions={dashboardActions}
    >
      <div className="space-y-8">

        {/* Modern Stats Cards - Admin Only */}
        {isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
              <Badge variant="secondary" className="px-3 py-1">
                <Zap className="h-3 w-3 mr-1" />
                Live Data
              </Badge>
            </div>
            
            {userStatsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="space-y-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernStatsCard
                  title="Total Users"
                  value={users.length}
                  icon={Users}
                  color="blue"
                  trend="up"
                  trendValue="+12%"
                  description="Active platform users"
                />
                <ModernStatsCard
                  title="Pending Approvals"
                  value={users.filter(u => u.user_status === 'pending').length}
                  icon={Clock}
                  color="orange"
                  description="Awaiting approval"
                />
                <ModernStatsCard
                  title="Approved Users"
                  value={users.filter(u => u.user_status === 'approved').length}
                  icon={CheckCircle}
                  color="green"
                  trend="up"
                  trendValue="+5"
                  description="Successfully onboarded"
                />
                <ModernStatsCard
                  title="System Health"
                  value="99.9%"
                  icon={Shield}
                  color="green"
                  trend="up"
                  trendValue="Excellent"
                  description="Uptime this month"
                />
              </div>
            )}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* User Profile Section */}
          <div className="lg:col-span-4">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Your Profile</h3>
              <UserProfileDisplay />
              
              {/* Quick Actions Card */}
              <Card className="bg-gradient-to-br from-muted/50 to-muted/25 border-dashed">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription>Frequently used features</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start h-12">
                    <Users className="h-4 w-4 mr-3" />
                    Manage Users
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-12">
                    <FileText className="h-4 w-4 mr-3" />
                    View Reports
                  </Button>
                  <Button variant="ghost" className="w-full justify-start h-12">
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* System Stats and Activity - Admin Only */}
          {isAdmin && (
            <div className="lg:col-span-8">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">System Activity</h3>
                
                {/* Enhanced System Overview */}
                <Card className="bg-gradient-to-br from-background to-muted/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      System Metrics
                    </CardTitle>
                    <CardDescription>
                      Real-time performance and usage statistics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="grid grid-cols-2 gap-6">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="space-y-3">
                            <Skeleton className="h-4 w-[100px]" />
                            <Skeleton className="h-8 w-[60px]" />
                            <Skeleton className="h-2 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : dashboardStats ? (
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium">Total Users</span>
                          </div>
                          <div className="text-2xl font-bold">{dashboardStats.user_count}</div>
                          <Progress value={75} className="h-2" />
                          <p className="text-xs text-muted-foreground">75% of capacity</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                              <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="font-medium">Recent Logins</span>
                          </div>
                          <div className="text-2xl font-bold">{dashboardStats.recent_logins}</div>
                          <Progress value={90} className="h-2" />
                          <p className="text-xs text-muted-foreground">High activity</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                              <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="font-medium">Report Structures</span>
                          </div>
                          <div className="text-2xl font-bold">{dashboardStats.total_structures}</div>
                          <Progress value={60} className="h-2" />
                          <p className="text-xs text-muted-foreground">Growing collection</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                              <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <span className="font-medium">Line Items</span>
                          </div>
                          <div className="text-2xl font-bold">{dashboardStats.total_line_items}</div>
                          <Progress value={85} className="h-2" />
                          <p className="text-xs text-muted-foreground">Comprehensive data</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No statistics available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>

        {/* Active Report Structure Section */}
        {activeStructureUuid && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Active Report Structure</h2>
              <Badge variant="default" className="px-3 py-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
            <ReportStructureCard 
              structureUuid={activeStructureUuid}
              className="max-w-none"
            />
          </div>
        )}

        {/* Workflow Management Section */}
        {isAdmin && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Workflow Management</h2>
              <Badge variant="outline" className="px-3 py-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Enhanced
              </Badge>
            </div>
            <WorkflowStatusManager />
          </div>
        )}
      </div>
    </CompactPageLayout>
  );
}