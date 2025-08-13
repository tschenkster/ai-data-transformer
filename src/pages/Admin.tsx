import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Clock, UserCheck, Shield, Crown, CheckCircle, XCircle } from 'lucide-react';
import Footer from '@/components/Footer';
import { ActionButtons, createApproveAction, createRejectAction, createAdminDeleteAction, ActionButtonConfig } from '@/components/ui/action-buttons';

interface UserAccount {
  id: string;
  user_id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
}

export default function Admin() {
  const { user, userAccount, signOut, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const fetchUserAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUserAccounts((data || []) as UserAccount[]);
      
      // Calculate stats
      const stats = data?.reduce(
        (acc, userAccount) => {
          acc.total++;
          acc[userAccount.status]++;
          return acc;
        },
        { total: 0, pending: 0, approved: 0, rejected: 0 }
      ) || { total: 0, pending: 0, approved: 0, rejected: 0 };
      
      setStats(stats);
    } catch (error) {
      console.error('Error fetching user accounts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAccounts();
  }, []);

  const updateUserStatus = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      const updates: any = {
        status,
        approved_by: user?.id,
      };
      
      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_accounts')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${status} successfully`,
      });
      
      fetchUserAccounts();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: `Failed to ${status} user`,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string, userEmail: string) => {
    // Check if this is a super admin account
    const SUPER_ADMIN_EMAILS = ['thomas@cfo-team.de'];
    if (SUPER_ADMIN_EMAILS.includes(userEmail)) {
      toast({
        title: "Cannot Delete",
        description: "Super admin accounts cannot be deleted to prevent system lockout",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from auth.users will cascade to user_accounts table
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      fetchUserAccounts();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserRole = (email: string) => {
    const SUPER_ADMIN_EMAILS = ['thomas@cfo-team.de'];
    const ADMIN_EMAILS = ['thomas@cfo-team.de'];
    
    if (SUPER_ADMIN_EMAILS.includes(email)) {
      return <Badge variant="outline" className="text-purple-600"><Crown className="w-3 h-3 mr-1" />Super Admin</Badge>;
    } else if (ADMIN_EMAILS.includes(email)) {
      return <Badge variant="outline" className="text-blue-600"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
    } else {
      return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />User</Badge>;
    }
  };

  const isUserSuperAdmin = (email: string) => {
    const SUPER_ADMIN_EMAILS = ['thomas@cfo-team.de'];
    return SUPER_ADMIN_EMAILS.includes(email);
  };

  // Action configuration functions
  const getPendingUserActions = (userAccount: UserAccount): ActionButtonConfig[] => [
    createApproveAction(() => updateUserStatus(userAccount.user_id, 'approved')),
    createRejectAction(() => updateUserStatus(userAccount.user_id, 'rejected'))
  ];

  const getAllUserActions = (userAccount: UserAccount): ActionButtonConfig[] => {
    const actions: ActionButtonConfig[] = [];
    
    if (userAccount.status === 'pending') {
      actions.push(createApproveAction(() => updateUserStatus(userAccount.user_id, 'approved')));
      actions.push(createRejectAction(() => updateUserStatus(userAccount.user_id, 'rejected')));
    } else if (userAccount.status === 'rejected') {
      actions.push(createApproveAction(() => updateUserStatus(userAccount.user_id, 'approved')));
    } else if (userAccount.status === 'approved') {
      actions.push(createRejectAction(() => updateUserStatus(userAccount.user_id, 'rejected')));
    }
    
    actions.push(createAdminDeleteAction(
      () => deleteUser(userAccount.user_id, userAccount.email),
      isUserSuperAdmin(userAccount.email),
      isUserSuperAdmin(userAccount.email) ? "Cannot delete super admin account" : "Delete user"
    ));
    
    return actions;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingUsers = userAccounts.filter(ua => ua.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      {/* Main Content */}
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage user accounts and approvals</p>
          </div>
        </div>


      {/* Management Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Users ({stats.pending})
          </TabsTrigger>
          <TabsTrigger value="all">All Users</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Users awaiting approval to access the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending users to review</p>
                </div>
              ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>User Role</TableHead>
                        <TableHead>Signup Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map((userAccount) => (
                        <TableRow key={userAccount.id}>
                          <TableCell className="font-medium">{userAccount.email}</TableCell>
                          <TableCell>{getUserRole(userAccount.email)}</TableCell>
                          <TableCell>{formatDate(userAccount.created_at)}</TableCell>
                          <TableCell>{getStatusBadge(userAccount.status)}</TableCell>
                          <TableCell>
                            <ActionButtons 
                              actions={getPendingUserActions(userAccount)}
                              className="gap-2"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Complete list of all user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>User Role</TableHead>
                    <TableHead>Signup Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAccounts.map((userAccount) => (
                    <TableRow key={userAccount.id}>
                      <TableCell className="font-medium">{userAccount.email}</TableCell>
                      <TableCell>{getUserRole(userAccount.email)}</TableCell>
                      <TableCell>{formatDate(userAccount.created_at)}</TableCell>
                      <TableCell>{getStatusBadge(userAccount.status)}</TableCell>
                      <TableCell>
                        {userAccount.approved_at ? formatDate(userAccount.approved_at) : '-'}
                      </TableCell>
                       <TableCell>
                         <ActionButtons 
                           actions={getAllUserActions(userAccount)}
                           className="gap-2"
                         />
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      </div>
      <Footer />
    </div>
  );
}