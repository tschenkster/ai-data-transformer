import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield,
  AlertTriangle,
  Archive
} from 'lucide-react';

interface UserAccountWithStatus {
  user_account_uuid: string;
  email: string;
  first_name: string;
  last_name: string;
  status_enum: string;
  created_at: string;
  updated_at: string;
}

interface TranslationSessionWithStatus {
  coa_translation_session_uuid: string;
  filename: string;
  status_enum: string;
  total_accounts: number;
  processed_accounts: number;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export function WorkflowStatusManager() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<UserAccountWithStatus[]>([]);
  const [processingSessions, setProcessingSessions] = useState<TranslationSessionWithStatus[]>([]);
  const [validTransitions, setValidTransitions] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingUsers();
      fetchProcessingSessions();
    }
  }, [isAdmin]);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_users_by_status', { p_status: 'pending' });

      if (error) {
        console.error('Error fetching pending users:', error);
        return;
      }

      setPendingUsers(data || []);
    } catch (error) {
      console.error('Error in fetchPendingUsers:', error);
    }
  };

  const fetchProcessingSessions = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_translation_sessions_by_status', { p_status: 'processing' });

      if (error) {
        console.error('Error fetching processing sessions:', error);
        return;
      }

      setProcessingSessions(data || []);
    } catch (error) {
      console.error('Error in fetchProcessingSessions:', error);
    }
  };

  const fetchValidTransitions = async (currentStatus: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_valid_user_account_status_transitions', { 
          p_current_status: currentStatus as 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived'
        });

      if (error) {
        console.error('Error fetching valid transitions:', error);
        return;
      }

      setValidTransitions(data || []);
    } catch (error) {
      console.error('Error in fetchValidTransitions:', error);
    }
  };

  const transitionUserStatus = async (userUuid: string, newStatus: 'approved' | 'rejected' | 'pending' | 'suspended' | 'archived', reason: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .rpc('transition_user_account_status', {
          p_user_account_uuid: userUuid,
          p_new_status: newStatus,
          p_reason: reason
        });

      if (error) {
        toast({
          title: "Transition Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Status Updated",
        description: `User status successfully changed to ${newStatus}`,
        variant: "default",
      });

      // Refresh data
      await fetchPendingUsers();
      setSelectedUser(null);
      setValidTransitions([]);
    } catch (error) {
      console.error('Error transitioning user status:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'suspended':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-500" />;
      case 'processing':
        return <Settings className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'suspended':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Workflow Status Manager
          </CardTitle>
          <CardDescription>
            Administrative access required to manage workflow states
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Pending User Approvals ({pendingUsers.length})
          </CardTitle>
          <CardDescription>
            Users awaiting approval with ENUM-based status workflow validation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No pending users at this time
            </p>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div key={user.user_account_uuid} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(user.status_enum)}
                    <div>
                      <p className="font-medium">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.email
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge className={getStatusColor(user.status_enum)}>
                      {user.status_enum}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user.user_account_uuid);
                        fetchValidTransitions(user.status_enum);
                      }}
                    >
                      Manage Status
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => transitionUserStatus(user.user_account_uuid, 'approved' as const, 'Manual approval by admin')}
                      disabled={loading}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => transitionUserStatus(user.user_account_uuid, 'rejected' as const, 'Manual rejection by admin')}
                      disabled={loading}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Sessions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Active Translation Sessions ({processingSessions.length})
          </CardTitle>
          <CardDescription>
            Translation sessions with ENUM-based status tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          {processingSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No active translation sessions
            </p>
          ) : (
            <div className="space-y-4">
              {processingSessions.map((session) => (
                <div key={session.coa_translation_session_uuid} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(session.status_enum)}
                    <div>
                      <p className="font-medium">{session.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.processed_accounts} / {session.total_accounts} accounts processed
                      </p>
                    </div>
                    <Badge className={getStatusColor(session.status_enum)}>
                      {session.status_enum}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{session.progress_percentage}%</p>
                    <p className="text-sm text-muted-foreground">Progress</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Transition Manager */}
      {selectedUser && validTransitions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Status Transition Manager</CardTitle>
            <CardDescription>
              Valid transitions based on workflow rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Available transitions for selected user:
              </p>
              <Select onValueChange={(value: 'approved' | 'rejected' | 'pending' | 'suspended' | 'archived') => {
                if (selectedUser) {
                  transitionUserStatus(selectedUser, value, `Transition to ${value} via status manager`);
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {validTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        {status}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedUser(null);
                  setValidTransitions([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}