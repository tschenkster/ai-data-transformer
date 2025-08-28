import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users, Clock, CheckCircle, Pause, XCircle, TrendingUp, TrendingDown } from 'lucide-react';

interface UserStats {
  total: number;
  pending: number;
  approved: number;
  suspended: number;
  rejected: number;
}

interface UserStatsCardsProps {
  stats: UserStats;
  previousStats?: UserStats;
}

export function UserStatsCards({ stats, previousStats }: UserStatsCardsProps): JSX.Element {
  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return null;
    if (current > previous) return <TrendingUp className="h-3 w-3 text-success" />;
    if (current < previous) return <TrendingDown className="h-3 w-3 text-destructive" />;
    return null;
  };

  const getTrendText = (current: number, previous?: number) => {
    if (!previous) return "No previous data";
    const diff = current - previous;
    const percentage = previous === 0 ? 0 : Math.round((diff / previous) * 100);
    if (diff === 0) return "No change from last period";
    return `${diff > 0 ? '+' : ''}${diff} (${percentage > 0 ? '+' : ''}${percentage}%) from last period`;
  };

  const statsConfig = [
    {
      key: 'total',
      value: stats.total,
      label: 'Total Users',
      icon: Users,
      className: 'text-primary',
      description: 'All registered users in the system'
    },
    {
      key: 'pending',
      value: stats.pending,
      label: 'Pending',
      icon: Clock,
      className: 'text-warning',
      description: 'Users awaiting approval to access the system'
    },
    {
      key: 'approved',
      value: stats.approved,
      label: 'Approved',
      icon: CheckCircle,
      className: 'text-success',
      description: 'Users with active access to the system'
    },
    {
      key: 'suspended',
      value: stats.suspended,
      label: 'Suspended',
      icon: Pause,
      className: 'text-warning',
      description: 'Users temporarily restricted from system access'
    },
    {
      key: 'rejected',
      value: stats.rejected,
      label: 'Rejected',
      icon: XCircle,
      className: 'text-destructive',
      description: 'Users denied access to the system'
    }
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-fade-in">
        {statsConfig.map(({ key, value, label, icon: Icon, className, description }) => {
          const previousValue = previousStats?.[key as keyof UserStats];
          const trendIcon = getTrendIcon(value, previousValue);
          const trendText = getTrendText(value, previousValue);

          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <Card className="relative overflow-hidden hover:shadow-elegant transition-all duration-300 cursor-pointer hover:scale-[1.02] group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-5 w-5 ${className} transition-transform group-hover:scale-110`} />
                      {trendIcon && (
                        <div className="flex items-center gap-1">
                          {trendIcon}
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-bold font-mono tracking-tight">
                        {value.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">{label}</p>
                    </div>
                    
                    {/* Progress indicator for active vs inactive users */}
                    {key === 'total' && stats.total > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Active</span>
                          <span>{Math.round((stats.approved / stats.total) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-success transition-all duration-500"
                            style={{ width: `${(stats.approved / stats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                  
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/[0.02] pointer-events-none" />
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">{description}</p>
                  <p className="text-xs text-muted-foreground">{trendText}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}