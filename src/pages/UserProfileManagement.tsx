import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { UserService } from '@/features/user-management/services/userService';
import { UserStatsCards } from '@/features/user-management/components/UserStatsCards';
import { UserFilters } from '@/features/user-management/components/UserFilters';
import { UserTableSkeleton } from '@/features/user-management/components/UserTableSkeleton';
import { EmptyUserState } from '@/features/user-management/components/EmptyUserState';
import { CompactPageLayout } from '@/components/layout/CompactPageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  Pause,
  Plus,
  Download
} from 'lucide-react';
import Footer from '@/components/Footer';

interface UserAccount {
  user_uuid: string;
  user_id: number;
  supabase_user_uuid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  user_status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived';
  created_at: string;
  approved_at?: string;
  approved_by?: string;
  last_login_at?: string;
}

export default function UserProfileManagement() {
  const { user, userAccount, isSuperAdmin, isEntityAdmin, logSecurityEvent } = useAuth();
  const { toast } = useToast();
  
  // State for data
  const [users, setUsers] = useState<UserAccount[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  
  // Form states - Remove role from invite form
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: ''
  });
  
  const [editUserForm, setEditUserForm] = useState({
    userUuid: '',
    firstName: '',
    lastName: ''
  });
  
  // Filter states - Remove role filter
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });
  
  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; userUuid: string; userEmail: string }>({
    open: false,
    userUuid: '',
    userEmail: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (isSuperAdmin) {
        // Super admins can see everything
        const usersResponse = await supabase.from('user_accounts').select('*').order('created_at', { ascending: false });

        if (usersResponse.error) throw usersResponse.error;
        setUsers((usersResponse.data || []) as UserAccount[]);
        
      } else if (isEntityAdmin()) {
        // Entity admins can only see users within their accessible entities
        const currentUserUuid = userAccount?.user_uuid;
        if (currentUserUuid) {
          const userList = await UserService.fetchUsers(false, currentUserUuid);
          setUsers(userList);
        } else {
          throw new Error('Current user UUID not available for entity admin filtering');
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    try {
      setActionLoading('invite');
      
      // Create user account with pending status - no role assignment
      const { data: userData, error: userError } = await supabase.auth.admin.inviteUserByEmail(inviteForm.email, {
        data: {
          first_name: inviteForm.firstName,
          last_name: inviteForm.lastName,
          invited_by: user?.id
        },
        redirectTo: `${window.location.origin}/auth`
      });

      if (userError) throw userError;

      // Log security event
      if (logSecurityEvent) {
        await logSecurityEvent('user_invited', userData.user?.id, {
          invited_email: inviteForm.email,
          invited_by: user?.email
        });
      }

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteForm.email}`,
      });

      setIsInviteDialogOpen(false);
      setInviteForm({ email: '', firstName: '', lastName: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserStatus = async (userUuid: string, status: 'approved' | 'rejected' | 'suspended') => {
    try {
      setActionLoading(`status-${userUuid}`);
      
      const { error } = await supabase.rpc('transition_user_account_status', {
        p_user_uuid: userUuid,
        p_new_status: status,
        p_reason: `Status changed by ${user?.email}`
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${status} successfully`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${status} user`,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async () => {
    try {
      setActionLoading(`delete-${deleteConfirm.userUuid}`);
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { 
          userAccountUuid: deleteConfirm.userUuid, 
          userEmail: deleteConfirm.userEmail 
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      setDeleteConfirm({ open: false, userUuid: '', userEmail: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openEditUserDialog = (user: UserAccount) => {
    setEditUserForm({
      userUuid: user.user_uuid,
      firstName: user.first_name || '',
      lastName: user.last_name || ''
    });
    setIsEditUserDialogOpen(true);
  };

  const updateUser = async () => {
    try {
      setActionLoading('edit');
      
      // Update user account information only - no role management
      const { error: accountError } = await supabase
        .from('user_accounts')
        .update({
          first_name: editUserForm.firstName || null,
          last_name: editUserForm.lastName || null,
        })
        .eq('user_uuid', editUserForm.userUuid);

      if (accountError) throw accountError;

      // Log security event
      if (logSecurityEvent) {
        await logSecurityEvent('user_updated', editUserForm.userUuid, {
          updated_by: user?.email,
          changes: {
            firstName: editUserForm.firstName,
            lastName: editUserForm.lastName
          }
        });
      }

      toast({
        title: "Success",
        description: "User profile updated successfully",
      });

      setIsEditUserDialogOpen(false);
      setEditUserForm({ 
        userUuid: '', 
        firstName: '', 
        lastName: ''
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update user profile",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="text-orange-600"><Pause className="w-3 h-3 mr-1" />Suspended</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-gray-600"><XCircle className="w-3 h-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserName = (user: UserAccount) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  // Filter users - remove role filtering
  const filteredUsers = users.filter(user => {
    const matchesSearch = filters.search === '' || 
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      getUserName(user).toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || user.user_status === filters.status;

    return matchesSearch && matchesStatus;
  });

  if (!isSuperAdmin && !isEntityAdmin()) {
    return (
      <CompactPageLayout currentPage="User Profile Management">
        <Card>
          <CardHeader>
            <CardTitle>User Profile Management</CardTitle>
            <CardDescription>
              You don't have permission to manage user profiles. Contact your administrator for access.
            </CardDescription>
          </CardHeader>
        </Card>
        <Footer />
      </CompactPageLayout>
    );
  }

  if (loading) {
    return (
      <CompactPageLayout currentPage="User Profile Management">
        <UserTableSkeleton />
        <Footer />
      </CompactPageLayout>
    );
  }

  // Calculate status counts
  const statusCounts = {
    total: users.length,
    pending: users.filter(u => u.user_status === 'pending').length,
    approved: users.filter(u => u.user_status === 'approved').length,
    suspended: users.filter(u => u.user_status === 'suspended').length,
    rejected: users.filter(u => u.user_status === 'rejected').length
  };

  const pageActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      {isSuperAdmin && (
        <Button size="sm" onClick={() => setIsInviteDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Invite User
        </Button>
      )}
    </div>
  );

  return (
    <CompactPageLayout 
      currentPage="User Profile Management"
      actions={pageActions}
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <UserStatsCards stats={statusCounts} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Profiles
            </CardTitle>
            <CardDescription>
              Manage user profiles, personal information, and account status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Filters - Remove role filter */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <select 
                  value={filters.status} 
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border rounded-md bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="text-sm text-muted-foreground">
                {filteredUsers.length === users.length 
                  ? `Showing all ${users.length} users`
                  : `Showing ${filteredUsers.length} of ${users.length} users`
                }
              </div>

              {/* Users Table */}
              {filteredUsers.length === 0 ? (
                <EmptyUserState 
                  isFiltered={filters.search !== '' || filters.status !== 'all'}
                  onClearFilters={() => setFilters({ search: '', status: 'all' })}
                  onInviteUser={() => setIsInviteDialogOpen(true)}
                  canInviteUsers={isSuperAdmin}
                />
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.user_uuid}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{getUserName(user)}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user.user_status)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Edit Profile Button */}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditUserDialog(user)}
                                disabled={actionLoading === 'edit'}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>

                              {/* Status Action Buttons */}
                              {user.user_status === 'pending' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => updateUserStatus(user.user_uuid, 'approved')}
                                    disabled={actionLoading === `status-${user.user_uuid}`}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => updateUserStatus(user.user_uuid, 'rejected')}
                                    disabled={actionLoading === `status-${user.user_uuid}`}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}

                              {user.user_status === 'approved' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => updateUserStatus(user.user_uuid, 'suspended')}
                                  disabled={actionLoading === `status-${user.user_uuid}`}
                                  className="text-orange-600 hover:text-orange-700"
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              )}

                              {user.user_status === 'suspended' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => updateUserStatus(user.user_uuid, 'approved')}
                                  disabled={actionLoading === `status-${user.user_uuid}`}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}

                              {/* Delete Button - Only for Super Admins */}
                              {isSuperAdmin && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ 
                                    open: true, 
                                    userUuid: user.user_uuid, 
                                    userEmail: user.email 
                                  })}
                                  disabled={actionLoading === `delete-${user.user_uuid}`}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Invite User Dialog */}
        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New User</DialogTitle>
              <DialogDescription>
                Send an invitation to a new user to join the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="user@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={inviteForm.firstName}
                  onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={inviteForm.lastName}
                  onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={inviteUser} disabled={actionLoading === 'invite'}>
                {actionLoading === 'invite' ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>
                Update the user's profile information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editUserForm.firstName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editUserForm.lastName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateUser} disabled={actionLoading === 'edit'}>
                {actionLoading === 'edit' ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user account for {deleteConfirm.userEmail}. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={deleteUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={actionLoading === `delete-${deleteConfirm.userUuid}`}
              >
                {actionLoading === `delete-${deleteConfirm.userUuid}` ? 'Deleting...' : 'Delete User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Footer />
      </div>
    </CompactPageLayout>
  );
}