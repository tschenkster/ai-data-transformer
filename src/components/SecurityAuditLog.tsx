import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SecurityAuditEntry {
  security_audit_log_uuid: string;
  user_id: string;
  action: string;
  target_user_id?: string | null;
  details?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export function SecurityAuditLog() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [auditLog, setAuditLog] = useState<SecurityAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLog = async () => {
    try {
      setError(null);
      console.log('Fetching audit log... isAdmin:', isAdmin);
      
      const { data, error } = await supabase
        .from('security_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Supabase error fetching audit log:', error);
        setError(`Database error: ${error.message}`);
        return;
      }

      console.log('Audit log data received:', data?.length || 0, 'entries');
      setAuditLog((data || []) as SecurityAuditEntry[]);
    } catch (error) {
      console.error('Error in fetchAuditLog:', error);
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && !authLoading) {
      fetchAuditLog();
    } else if (!authLoading) {
      // If user is not admin, stop loading
      setLoading(false);
    }
  }, [isAdmin, authLoading]);

  const getActionBadge = (action: string) => {
    if (action.includes('delete')) {
      return <Badge variant="destructive">{action}</Badge>;
    } else if (action.includes('approved')) {
      return <Badge variant="success">{action}</Badge>;
    } else if (action.includes('rejected')) {
      return <Badge variant="warning">{action}</Badge>;
    } else {
      return <Badge variant="outline">{action}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (authLoading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Audit Log</CardTitle>
          <CardDescription>Loading audit entries...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You need admin privileges to view the security audit log.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Security Audit Log</CardTitle>
          <CardDescription className="text-red-600">
            Error loading audit entries: {error}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>Unable to load security audit log.</p>
            <button 
              onClick={fetchAuditLog}
              className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Audit Log</CardTitle>
        <CardDescription>
          Recent security events and administrative actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLog.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No audit entries found
                  </TableCell>
                </TableRow>
              ) : (
                auditLog.map((entry) => (
                  <TableRow key={entry.security_audit_log_uuid}>
                    <TableCell className="text-sm">
                      {formatDate(entry.created_at)}
                    </TableCell>
                    <TableCell>
                      {getActionBadge(entry.action)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.user_id?.substring(0, 8)}...
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.target_user_id ? `${entry.target_user_id.substring(0, 8)}...` : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {entry.details ? (
                        <div className="text-xs space-y-1">
                          {Object.entries(entry.details).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}