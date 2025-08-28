import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import { UserService } from '../services/userService';
import { UserStatsCards } from './UserStatsCards';
import { UserFilters } from './UserFilters';
import { UserTableSkeleton } from './UserTableSkeleton';
import { EmptyUserState } from './EmptyUserState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Crown, 
  Eye, 
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  RotateCcw,
  Pause
} from 'lucide-react';

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

interface UserRole {
  user_role_uuid: string;
  user_uuid?: string;
  user_id: string;
  role: string; // Allow any role from database
  assigned_at: string;
}


export function UserManagementPanel() {
  const { user, userAccount, isSuperAdmin, isEntityAdmin, logSecurityEvent } = useAuth();
  const { toast } = useToast();
  
  // State for data
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  
  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'viewer' as 'viewer' | 'entity_admin' | 'super_admin'
  });
  
  
  const [editUserForm, setEditUserForm] = useState({
    userUuid: '',
    firstName: '',
    lastName: '',
    role: 'viewer' as 'viewer' | 'entity_admin' | 'super_admin',
    phoneNumber: '',
    timezone: 'UTC',
    locale: 'en-US'
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    role: 'all'
  });
  
  // Selected users for bulk operations
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  
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
        const [usersResponse, rolesResponse] = await Promise.all([
          supabase.from('user_accounts').select('*').order('created_at', { ascending: false }),
          supabase.from('user_roles').select('*')
        ]);

        if (usersResponse.error) throw usersResponse.error;
        if (rolesResponse.error) throw rolesResponse.error;

        setUsers((usersResponse.data || []) as UserAccount[]);
        setUserRoles((rolesResponse.data || []) as UserRole[]);
        
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
      
      // Create user account with pending status
      const { data: userData, error: userError } = await supabase.auth.admin.inviteUserByEmail(inviteForm.email, {
        data: {
          first_name: inviteForm.firstName,
          last_name: inviteForm.lastName,
          invited_by: user?.id,
          invited_role: inviteForm.role
        },
        redirectTo: `${window.location.origin}/auth`
      });

      if (userError) throw userError;

      // Log security event
      if (logSecurityEvent) {
        await logSecurityEvent('user_invited', userData.user?.id, {
          invited_email: inviteForm.email,
          invited_role: inviteForm.role,
          invited_by: user?.email
        });
      }

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteForm.email}`,
      });

      setIsInviteDialogOpen(false);
      setInviteForm({ email: '', firstName: '', lastName: '', role: 'viewer' });
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
    const userRole = userRoles.find(r => r.user_uuid === user.user_uuid || r.user_id === user.user_uuid)?.role || 'viewer';
    setEditUserForm({
      userUuid: user.user_uuid,
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      role: userRole as 'viewer' | 'entity_admin' | 'super_admin',
      phoneNumber: '', // Note: phone_number not available in current interface
      timezone: 'UTC', // Note: timezone not available in current interface  
      locale: 'en-US' // Note: locale not available in current interface
    });
    setIsEditUserDialogOpen(true);
  };

  const updateUser = async () => {
    try {
      setActionLoading('edit');
      
      // Update user account information
      const { error: accountError } = await supabase
        .from('user_accounts')
        .update({
          first_name: editUserForm.firstName || null,
          last_name: editUserForm.lastName || null,
        })
        .eq('user_uuid', editUserForm.userUuid);

      if (accountError) throw accountError;

      // Update user role if Super Admin is making the change
      if (isSuperAdmin) {
        // First delete existing roles for this user
        const { error: deleteRoleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_uuid', editUserForm.userUuid);

        if (deleteRoleError) throw deleteRoleError;

        // Insert new role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_uuid: editUserForm.userUuid,
            user_id: editUserForm.userUuid, // Use the same UUID for both fields
            role: editUserForm.role,
            assigned_by_user_account_uuid: userAccount?.user_uuid
          });

        if (roleError) throw roleError;
      }

      // Log security event
      if (logSecurityEvent) {
        await logSecurityEvent('user_updated', editUserForm.userUuid, {
          updated_by: user?.email,
          changes: {
            firstName: editUserForm.firstName,
            lastName: editUserForm.lastName,
            ...(isSuperAdmin && { role: editUserForm.role })
          }
        });
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setIsEditUserDialogOpen(false);
      setEditUserForm({ 
        userUuid: '', 
        firstName: '', 
        lastName: '', 
        role: 'viewer',
        phoneNumber: '',
        timezone: 'UTC',
        locale: 'en-US'
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update user",
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

  const getUserRole = (userUuid: string) => {
    const role = userRoles.find(r => r.user_uuid === userUuid || r.user_id === userUuid)?.role || 'viewer';
    switch (role) {
      case 'super_admin':
        return <Badge variant="outline" className="text-purple-600"><Crown className="w-3 h-3 mr-1" />Super Admin</Badge>;
      case 'entity_admin':
        return <Badge variant="outline" className="text-blue-600"><Shield className="w-3 h-3 mr-1" />Entity Admin</Badge>;
      default:
        return <Badge variant="outline"><Eye className="w-3 h-3 mr-1" />Viewer</Badge>;
    }
  };

  const getUserName = (user: UserAccount) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  };

  // Helper function to check if a user is Super Admin
  const isUserSuperAdmin = (userUuid: string) => {
    const role = userRoles.find(r => r.user_uuid === userUuid || r.user_id === userUuid)?.role;
    return role === 'super_admin';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = filters.search === '' || 
      user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      getUserName(user).toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesStatus = filters.status === 'all' || user.user_status === filters.status;
    
    const userRole = userRoles.find(r => r.user_uuid === user.user_uuid)?.role || 'viewer';
    const matchesRole = filters.role === 'all' || userRole === filters.role;

    return matchesSearch && matchesStatus && matchesRole;
  });

  if (!isSuperAdmin && !isEntityAdmin()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            You don't have permission to manage users. Contact your administrator for access.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return <UserTableSkeleton />;
  }

  // Calculate status counts
  const statusCounts = {
    total: users.length,
    pending: users.filter(u => u.user_status === 'pending').length,
    approved: users.filter(u => u.user_status === 'approved').length,
    suspended: users.filter(u => u.user_status === 'suspended').length,
    rejected: users.filter(u => u.user_status === 'rejected').length
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Manage users, roles, and access permissions across entities and groups
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Enhanced User Statistics */}
          <UserStatsCards stats={statusCounts} />

          {/* Enhanced Filters */}
          <UserFilters 
            filters={filters}
            onFiltersChange={setFilters}
            availableRoles={['super_admin', 'entity_admin', 'viewer']}
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {filteredUsers.length === users.length 
                ? `Showing all ${users.length} users`
                : `Showing ${filteredUsers.length} of ${users.length} users`
              }
            </div>
            {isSuperAdmin && (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite User
                  </Button>
                </DialogTrigger>
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
                    <div className="grid gap-2">
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={inviteForm.role}
                        onValueChange={(value: 'viewer' | 'entity_admin' | 'super_admin') => 
                          setInviteForm({ ...inviteForm, role: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="entity_admin">Entity Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={inviteUser}
                      disabled={!inviteForm.email || !inviteForm.firstName || !inviteForm.lastName || actionLoading === 'invite'}
                    >
                      {actionLoading === 'invite' ? 'Sending...' : 'Send Invitation'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Users Table or Empty State */}
          {filteredUsers.length === 0 ? (
            <EmptyUserState 
              isFiltered={filters.search !== '' || filters.status !== 'all' || filters.role !== 'all'}
              onClearFilters={() => setFilters({ search: '', status: 'all', role: 'all' })}
              onInviteUser={() => setIsInviteDialogOpen(true)}
              canInviteUsers={isSuperAdmin}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.user_uuid} className="hover:bg-muted/50 transition-colors">
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {getUserName(user).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{getUserName(user)}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getUserRole(user.user_uuid)}</TableCell>
                        <TableCell>{getStatusBadge(user.user_status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.last_login_at 
                            ? new Date(user.last_login_at).toLocaleDateString() 
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end space-x-1">
                            {/* Edit User Button */}
                            {(isSuperAdmin || isEntityAdmin()) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditUserDialog(user)}
                                disabled={actionLoading === 'edit'}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {/* Status Change Buttons */}
                            {user.user_status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateUserStatus(user.user_uuid, 'approved')}
                                  disabled={actionLoading === `status-${user.user_uuid}`}
                                  className="h-8 w-8 p-0 text-success hover:text-success"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => updateUserStatus(user.user_uuid, 'rejected')}
                                  disabled={actionLoading === `status-${user.user_uuid}`}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {user.user_status === 'approved' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateUserStatus(user.user_uuid, 'suspended')}
                                disabled={actionLoading === `status-${user.user_uuid}`}
                                className="h-8 w-8 p-0 text-warning hover:text-warning"
                              >
                                <Pause className="h-3 w-3" />
                              </Button>
                            )}
                            {user.user_status === 'suspended' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateUserStatus(user.user_uuid, 'approved')}
                                disabled={actionLoading === `status-${user.user_uuid}`}
                                className="h-8 w-8 p-0"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {/* Delete Button - Super Admin Only */}
                            {isSuperAdmin && !isUserSuperAdmin(user.user_uuid) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setDeleteConfirm({ 
                                  open: true, 
                                  userUuid: user.user_uuid, 
                                  userEmail: user.email 
                                })}
                                disabled={actionLoading === `delete-${user.user_uuid}`}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and role assignments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  value={editUserForm.firstName}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  value={editUserForm.lastName}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            {/* Role can only be changed by Super Admins */}
            {isSuperAdmin && (
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editUserForm.role} 
                  onValueChange={(value: 'viewer' | 'entity_admin' | 'super_admin') => 
                    setEditUserForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="entity_admin">Entity Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Show current role for Entity Admins (read-only) */}
            {!isSuperAdmin && (
              <div>
                <Label>Current Role</Label>
                <div className="mt-2">
                  {editUserForm.role === 'super_admin' && (
                    <Badge variant="outline" className="text-purple-600">
                      <Crown className="w-3 h-3 mr-1" />Super Admin
                    </Badge>
                  )}
                  {editUserForm.role === 'entity_admin' && (
                    <Badge variant="outline" className="text-blue-600">
                      <Shield className="w-3 h-3 mr-1" />Entity Admin
                    </Badge>
                  )}
                  {editUserForm.role === 'viewer' && (
                    <Badge variant="outline">
                      <Eye className="w-3 h-3 mr-1" />Viewer
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Only Super Admins can change user roles
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditUserDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateUser} 
              disabled={actionLoading === 'edit'}
            >
              {actionLoading === 'edit' ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user account for <strong>{deleteConfirm.userEmail}</strong>?
              This action cannot be undone and will permanently remove all user data and access permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm({ open: false, userUuid: '', userEmail: '' })}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              disabled={actionLoading === `delete-${deleteConfirm.userUuid}`}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading === `delete-${deleteConfirm.userUuid}` ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}