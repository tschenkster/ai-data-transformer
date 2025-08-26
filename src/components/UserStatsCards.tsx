import { Card, CardContent } from '@/components/ui/card';
import { Users, Clock, CheckCircle, Pause, XCircle } from 'lucide-react';

interface UserStats {
  total: number;
  pending: number;
  approved: number;
  suspended: number;
  rejected: number;
}

interface UserStatsCardsProps {
  stats: UserStats;
}

export function UserStatsCards({ stats }: UserStatsCardsProps): JSX.Element {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            <div className="text-2xl font-bold">{stats.pending}</div>
          </div>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <div className="text-2xl font-bold">{stats.approved}</div>
          </div>
          <p className="text-xs text-muted-foreground">Approved</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Pause className="h-4 w-4 text-orange-600" />
            <div className="text-2xl font-bold">{stats.suspended}</div>
          </div>
          <p className="text-xs text-muted-foreground">Suspended</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </div>
          <p className="text-xs text-muted-foreground">Rejected</p>
        </CardContent>
      </Card>
    </div>
  );
}