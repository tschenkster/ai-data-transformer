import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Shield, RefreshCw, Search, Download, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SecurityLog {
  security_audit_log_uuid: string;
  action: string;
  user_id?: string;
  target_user_id?: string;
  details?: Record<string, any>;
  ip_address?: string | null;
  user_agent?: string;
  created_at: string;
}

interface SecurityStats {
  totalLogs: number;
  failedLogins: number;
  suspiciousActivity: number;
  rateLimitHits: number;
}

export function SecurityAuditDashboard() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalLogs: 0,
    failedLogins: 0,
    suspiciousActivity: 0,
    rateLimitHits: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { toast } = useToast();

  const fetchSecurityLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,details->>email.ilike.%${searchTerm}%`);
      }

      const { data: logsData, error: logsError } = await query;
      
      if (logsError) {
        console.error('Failed to fetch security logs:', logsError);
        toast({
          title: "Error",
          description: "Failed to fetch security logs",
          variant: "destructive"
        });
        return;
      }

      setLogs((logsData || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string | null,
        details: log.details as Record<string, any>
      })));

      const totalLogs = logsData?.length || 0;
      const failedLogins = logsData?.filter(log => log.action === 'failed_login_attempt').length || 0;
      const suspiciousActivity = logsData?.filter(log => log.action === 'suspicious_activity_detected').length || 0;
      const rateLimitHits = logsData?.filter(log => {
        const details = log.details as Record<string, any>;
        return details?.rate_limited === true;
      }).length || 0;

      setStats({
        totalLogs,
        failedLogins,
        suspiciousActivity,
        rateLimitHits
      });

    } catch (error) {
      console.error('Security logs fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load security audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityLogs();
  }, [actionFilter, startDate, endDate]);

  const handleSearch = () => {
    fetchSecurityLogs();
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case 'failed_login_attempt':
        return 'destructive';
      case 'suspicious_activity_detected':
        return 'destructive';
      case 'login_success':
        return 'default';
      case 'account_creation_attempt':
        return 'secondary';
      case 'logout':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatLogDetails = (details: Record<string, any> | null | undefined) => {
    if (!details) return 'N/A';
    
    const relevantDetails = [];
    if (details.email) relevantDetails.push(`Email: ${details.email}`);
    if (details.ip_address) relevantDetails.push(`IP: ${details.ip_address}`);
    if (details.rate_limited) relevantDetails.push('Rate Limited');
    
    return relevantDetails.length > 0 ? relevantDetails.join(', ') : 'N/A';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Security Audit Dashboard</h2>
          <p className="text-muted-foreground">Monitor authentication and security events</p>
        </div>
        <Button onClick={fetchSecurityLogs} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLogs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedLogins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.suspiciousActivity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit Hits</CardTitle>
            <Filter className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.rateLimitHits}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="flex">
                <Input
                  id="search"
                  placeholder="Search actions or emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm" className="ml-2">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="action-filter">Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="failed_login_attempt">Failed Logins</SelectItem>
                  <SelectItem value="login_success">Successful Logins</SelectItem>
                  <SelectItem value="suspicious_activity_detected">Suspicious Activity</SelectItem>
                  <SelectItem value="account_creation_attempt">Account Creation</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={fetchSecurityLogs} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
          <CardDescription>
            Recent security events and authentication logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading security logs...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No security logs found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.security_audit_log_uuid}>
                        <TableCell className="font-mono text-xs">
                          {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {formatLogDetails(log.details)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {log.ip_address || 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs">
                          {log.user_agent || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}