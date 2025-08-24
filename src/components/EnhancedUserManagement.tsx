import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Plus, 
  UserPlus, 
  Shield, 
  Crown, 
  Eye, 
  Settings, 
  Search,
  Filter,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  RotateCcw
} from 'lucide-react';
import { SecurityAuditLog } from '@/components/SecurityAuditLog';

interface UserAccount {
  user_uuid: string;
  user_id: number;
  supabase_user_uuid: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status: string; // Allow any string status from database
  status_enum: 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived';
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

interface UserEntityAccess {
  user_entity_access_uuid: string;
  user_account_uuid: string;
  entity_uuid?: string;
  entity_group_uuid?: string;
  access_level: 'viewer' | 'entity_admin';
  granted_at: string;
  is_active: boolean;
  user_accounts?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  entities?: {
    entity_name: string;
  };
  entity_groups?: {
    entity_group_name: string;
  };
}

interface Entity {
  entity_uuid: string;
  entity_name: string;
  is_active: boolean;
}

interface EntityGroup {
  entity_group_uuid: string;
  entity_group_name: string;
  is_active: boolean;
}

export function EnhancedUserManagement() {
  const { user, userAccount, isSuperAdmin, isEntityAdmin, logSecurityEvent } = useAuth();
  const { toast } = useToast();
  
  // State for data
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userAccess, setUserAccess] = useState<UserEntityAccess[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityGroups, setEntityGroups] = useState<EntityGroup[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Dialog states
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isAssignAccessDialogOpen, setIsAssignAccessDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  
  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'user' | 'admin' | 'super_admin'
  });
  
  const [accessForm, setAccessForm] = useState({
    userUuid: '',
    entityUuid: 'none',
    entityGroupUuid: 'none',
    accessLevel: 'viewer' as 'viewer' | 'entity_admin'
  });
  
  const [editUserForm, setEditUserForm] = useState({
    userUuid: '',
    firstName: '',
    lastName: '',
    role: 'user' as 'user' | 'admin' | 'super_admin'
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    role: 'all',
    entity: 'all'
  });
  
  // Access management filter states
  const [accessFilters, setAccessFilters] = useState({
    search: '',
    entity: 'all',
    accessLevel: 'all',
    viewBy: 'user' as 'user' | 'entity'
  });
  
  // Selected users for bulk operations
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Permission management states
  const [isUserPermissionsDialogOpen, setIsUserPermissionsDialogOpen] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState('');
  
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
        const [usersResponse, rolesResponse, accessResponse, entitiesResponse, groupsResponse] = await Promise.all([
          supabase.from('user_accounts').select('*').order('created_at', { ascending: false }),
          supabase.from('user_roles').select('*'),
          supabase.from('user_entity_access').select(`
            *,
            user_accounts!fk_user_entity_access_user(email, first_name, last_name),
            entities(entity_name),
            entity_groups(entity_group_name)
          `).eq('is_active', true),
          supabase.from('entities').select('entity_uuid, entity_name, is_active').eq('is_active', true),
          supabase.from('entity_groups').select('entity_group_uuid, entity_group_name, is_active').eq('is_active', true)
        ]);

        if (usersResponse.error) throw usersResponse.error;
        if (rolesResponse.error) throw rolesResponse.error;
        if (accessResponse.error) throw accessResponse.error;
        if (entitiesResponse.error) throw entitiesResponse.error;
        if (groupsResponse.error) throw groupsResponse.error;

        setUsers((usersResponse.data || []) as UserAccount[]);
        setUserRoles((rolesResponse.data || []) as UserRole[]);
        setUserAccess(accessResponse.data || []);
        setEntities(entitiesResponse.data || []);
        setEntityGroups(groupsResponse.data || []);
        
      } else if (isEntityAdmin()) {
        // Entity admins can only see users in their scope
        // TODO: Implement scope filtering based on entity admin permissions
        const [usersResponse, accessResponse] = await Promise.all([
          supabase.from('user_accounts').select('*').order('created_at', { ascending: false }),
          supabase.from('user_entity_access').select(`
            *,
            user_accounts!fk_user_entity_access_user(email, first_name, last_name),
            entities(entity_name),
            entity_groups(entity_group_name)
          `).eq('is_active', true)
        ]);

        if (usersResponse.error) throw usersResponse.error;
        if (accessResponse.error) throw accessResponse.error;

        setUsers((usersResponse.data || []) as UserAccount[]);
        setUserAccess(accessResponse.data || []);
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
      setInviteForm({ email: '', firstName: '', lastName: '', role: 'user' });
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

  const assignAccess = async () => {
    try {
      setActionLoading('assign');
      
      // Validate that at least one entity or entity group is selected
      if (accessForm.entityUuid === 'none' && accessForm.entityGroupUuid === 'none') {
        toast({
          title: "Validation Error",
          description: "Please select either an Entity or an Entity Group",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await supabase.rpc('grant_entity_access', {
        p_user_uuid: accessForm.userUuid,
        p_access_level: accessForm.accessLevel,
        p_granted_by_user_uuid: userAccount?.user_uuid,
        p_entity_uuid: accessForm.entityUuid === 'none' ? null : accessForm.entityUuid,
        p_entity_group_uuid: accessForm.entityGroupUuid === 'none' ? null : accessForm.entityGroupUuid
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Access granted successfully",
      });

      setIsAssignAccessDialogOpen(false);
      setAccessForm({ userUuid: '', entityUuid: 'none', entityGroupUuid: 'none', accessLevel: 'viewer' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign access",
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

  const revokeAccess = async (accessUuid: string) => {
    try {
      setActionLoading(`revoke-${accessUuid}`);
      
      const { error } = await supabase
        .from('user_entity_access')
        .update({ is_active: false })
        .eq('user_entity_access_uuid', accessUuid);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Access revoked successfully",
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke access",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateAccessLevel = async (accessUuid: string, newAccessLevel: 'viewer' | 'entity_admin') => {
    try {
      setActionLoading(`update-${accessUuid}`);
      
      const { error } = await supabase
        .from('user_entity_access')
        .update({ access_level: newAccessLevel })
        .eq('user_entity_access_uuid', accessUuid);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Access level updated to ${newAccessLevel === 'entity_admin' ? 'Entity Admin' : 'Viewer'}`,
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update access level",
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
        return <Badge variant="outline" className="text-orange-600"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-gray-600"><XCircle className="w-3 h-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUserRole = (userUuid: string) => {
    const role = userRoles.find(r => r.user_uuid === userUuid || r.user_id === userUuid)?.role || 'user';
    switch (role) {
      case 'super_admin':
        return <Badge variant="outline" className="text-purple-600"><Crown className="w-3 h-3 mr-1" />Super Admin</Badge>;
      case 'admin':
        return <Badge variant="outline" className="text-blue-600"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      default:
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" />User</Badge>;
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
    
    const matchesStatus = filters.status === 'all' || user.status === filters.status;
    
    const userRole = userRoles.find(r => r.user_uuid === user.user_uuid)?.role || 'user';
    const matchesRole = filters.role === 'all' || userRole === filters.role;

    return matchesSearch && matchesStatus && matchesRole;
  });

  // Filter user access based on access filters - exclude Super Admins as they have global access
  const filteredUserAccess = userAccess.filter(access => {
    // Exclude Super Admins from entity-specific access management
    const isAccessUserSuperAdmin = isUserSuperAdmin(access.user_account_uuid);
    if (isAccessUserSuperAdmin) return false;

    const matchesSearch = accessFilters.search === '' || 
      access.user_accounts?.email?.toLowerCase().includes(accessFilters.search.toLowerCase()) ||
      access.user_accounts?.first_name?.toLowerCase().includes(accessFilters.search.toLowerCase()) ||
      access.user_accounts?.last_name?.toLowerCase().includes(accessFilters.search.toLowerCase()) ||
      access.entities?.entity_name?.toLowerCase().includes(accessFilters.search.toLowerCase()) ||
      access.entity_groups?.entity_group_name?.toLowerCase().includes(accessFilters.search.toLowerCase());
    
    const matchesEntity = accessFilters.entity === 'all' || access.entity_uuid === accessFilters.entity;
    
    const matchesAccessLevel = accessFilters.accessLevel === 'all' || access.access_level === accessFilters.accessLevel;

    return matchesSearch && matchesEntity && matchesAccessLevel;
  });

  // Get Super Admins count for informational display
  const superAdmins = users.filter(user => isUserSuperAdmin(user.user_uuid));
  const regularUsersWithAccess = userAccess.filter(access => !isUserSuperAdmin(access.user_account_uuid));

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
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate status counts
  const statusCounts = {
    total: users.length,
    pending: users.filter(u => u.status === 'pending').length,
    approved: users.filter(u => u.status === 'approved').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    rejected: users.filter(u => u.status === 'rejected').length
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
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            {/* User Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="text-2xl font-bold">{statusCounts.total}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <div className="text-2xl font-bold">{statusCounts.pending}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="text-2xl font-bold">{statusCounts.approved}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Approved</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-orange-600" />
                    <div className="text-2xl font-bold">{statusCounts.suspended}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Suspended</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <div className="text-2xl font-bold">{statusCounts.rejected}</div>
                  </div>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </CardContent>
              </Card>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                {isSuperAdmin && (
                  <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite New User</DialogTitle>
                        <DialogDescription>
                          Send an invitation to a new user to join the system
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="invite-email">Email</Label>
                          <Input
                            id="invite-email"
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="user@company.com"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="invite-first-name">First Name</Label>
                            <Input
                              id="invite-first-name"
                              value={inviteForm.firstName}
                              onChange={(e) => setInviteForm(prev => ({ ...prev, firstName: e.target.value }))}
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <Label htmlFor="invite-last-name">Last Name</Label>
                            <Input
                              id="invite-last-name"
                              value={inviteForm.lastName}
                              onChange={(e) => setInviteForm(prev => ({ ...prev, lastName: e.target.value }))}
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="invite-role">Initial Role</Label>
                          <Select value={inviteForm.role} onValueChange={(value: 'user' | 'admin' | 'super_admin') => setInviteForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                            </SelectContent>
                          </Select>
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
                )}
              </div>
            </div>

            {/* Users Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
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
                    <TableCell>{getUserRole(user.user_uuid)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      {user.last_login_at 
                        ? new Date(user.last_login_at).toLocaleDateString() 
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {user.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserStatus(user.user_uuid, 'approved')}
                              disabled={actionLoading === `status-${user.user_uuid}`}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserStatus(user.user_uuid, 'rejected')}
                              disabled={actionLoading === `status-${user.user_uuid}`}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {user.status === 'approved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserStatus(user.user_uuid, 'suspended')}
                            disabled={actionLoading === `status-${user.user_uuid}`}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                        {user.status === 'suspended' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserStatus(user.user_uuid, 'approved')}
                            disabled={actionLoading === `status-${user.user_uuid}`}
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteConfirm({ 
                              open: true, 
                              userUuid: user.user_uuid, 
                              userEmail: user.email 
                            })}
                            disabled={actionLoading === `delete-${user.user_uuid}`}
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
          </TabsContent>

          {/* Access Tab */}
          <TabsContent value="access" className="space-y-4">
            {/* Super Admin Info Banner */}
            {superAdmins.length > 0 && (
              <Card className="bg-muted/50 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Super Admin Global Access</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {superAdmins.length} Super Admin{superAdmins.length > 1 ? 's' : ''} ({superAdmins.map(sa => getUserName(sa)).join(', ')}) 
                        {superAdmins.length === 1 ? ' has' : ' have'} global access to all entities and are not shown in entity-specific access management.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Access Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">User Access Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  Managing entity-specific access for {regularUsersWithAccess.length} access grant{regularUsersWithAccess.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAccessFilters(prev => ({ ...prev, viewBy: prev.viewBy === 'user' ? 'entity' : 'user' }))}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  View by {accessFilters.viewBy === 'user' ? 'Entity' : 'User'}
                </Button>
                <Dialog open={isUserPermissionsDialogOpen} onOpenChange={setIsUserPermissionsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View User Permissions
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>User Permissions Overview</DialogTitle>
                      <DialogDescription>
                        Select a user to view their effective permissions
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Select value={selectedUserForPermissions} onValueChange={setSelectedUserForPermissions}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user to view permissions" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.filter(u => u.status === 'approved').map((user) => (
                              <SelectItem key={user.user_uuid} value={user.user_uuid}>
                                {getUserName(user)} ({user.email}) {isUserSuperAdmin(user.user_uuid) && <Badge variant="outline" className="ml-1 text-xs">Super Admin</Badge>}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedUserForPermissions && (
                          <div className="border rounded-lg p-4">
                            {isUserSuperAdmin(selectedUserForPermissions) ? (
                              <div className="text-center py-8">
                                <Crown className="h-12 w-12 text-primary mx-auto mb-4" />
                                <h4 className="font-medium text-lg mb-2">Super Admin Global Access</h4>
                                <p className="text-muted-foreground">
                                  This user has Super Admin privileges and global access to all entities, 
                                  entity groups, and system functions. No entity-specific permissions are needed.
                                </p>
                              </div>
                            ) : (
                              <>
                                <h4 className="font-medium mb-3">Effective Permissions</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Entity/Group</TableHead>
                                      <TableHead>Type</TableHead>
                                      <TableHead>Access Level</TableHead>
                                      <TableHead>Granted</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {userAccess
                                      .filter(access => access.user_account_uuid === selectedUserForPermissions)
                                      .map((access) => (
                                      <TableRow key={access.user_entity_access_uuid}>
                                        <TableCell>
                                          {access.entities?.entity_name || access.entity_groups?.entity_group_name || 'Unknown'}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline">
                                            {access.entity_uuid ? 'Entity' : 'Entity Group'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant={access.access_level === 'entity_admin' ? 'default' : 'secondary'}>
                                            {access.access_level === 'entity_admin' ? 'Entity Admin' : 'Viewer'}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          {new Date(access.granted_at).toLocaleDateString()}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {userAccess.filter(access => access.user_account_uuid === selectedUserForPermissions).length === 0 && (
                                  <div className="text-center py-4 text-muted-foreground">
                                    No entity-specific permissions assigned
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={isAssignAccessDialogOpen} onOpenChange={setIsAssignAccessDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Assign Access
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Assign Entity Access</DialogTitle>
                      <DialogDescription>
                        Grant user access to entities or entity groups
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="access-user">User</Label>
                        <Select value={accessForm.userUuid} onValueChange={(value) => setAccessForm(prev => ({ ...prev, userUuid: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user (excluding Super Admins)" />
                          </SelectTrigger>
                          <SelectContent>
                            {users
                              .filter(u => u.status === 'approved' && !isUserSuperAdmin(u.user_uuid))
                              .map((user) => (
                              <SelectItem key={user.user_uuid} value={user.user_uuid}>
                                {getUserName(user)} ({user.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Super Admins have global access and don't need entity-specific permissions
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="access-entity" className={accessForm.entityUuid === 'none' && accessForm.entityGroupUuid === 'none' ? 'text-destructive' : ''}>
                          Entity {accessForm.entityGroupUuid === 'none' ? '(Required)' : '(Optional)'}
                        </Label>
                        <Select value={accessForm.entityUuid} onValueChange={(value) => setAccessForm(prev => ({ ...prev, entityUuid: value }))}>
                          <SelectTrigger className={accessForm.entityUuid === 'none' && accessForm.entityGroupUuid === 'none' ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select entity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No specific entity</SelectItem>
                            {entities.map((entity) => (
                              <SelectItem key={entity.entity_uuid} value={entity.entity_uuid}>
                                {entity.entity_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="access-group" className={accessForm.entityUuid === 'none' && accessForm.entityGroupUuid === 'none' ? 'text-destructive' : ''}>
                          Entity Group {accessForm.entityUuid === 'none' ? '(Required)' : '(Optional)'}
                        </Label>
                        <Select value={accessForm.entityGroupUuid} onValueChange={(value) => setAccessForm(prev => ({ ...prev, entityGroupUuid: value }))}>
                          <SelectTrigger className={accessForm.entityUuid === 'none' && accessForm.entityGroupUuid === 'none' ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select entity group" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No specific group</SelectItem>
                            {entityGroups.map((group) => (
                              <SelectItem key={group.entity_group_uuid} value={group.entity_group_uuid}>
                                {group.entity_group_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {accessForm.entityUuid === 'none' && accessForm.entityGroupUuid === 'none' && (
                        <p className="text-xs text-destructive mt-1">
                          Please select either an Entity or an Entity Group to continue
                        </p>
                      )}
                      <div>
                        <Label htmlFor="access-level">Access Level</Label>
                        <Select value={accessForm.accessLevel} onValueChange={(value: 'viewer' | 'entity_admin') => setAccessForm(prev => ({ ...prev, accessLevel: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select access level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="entity_admin">Entity Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAssignAccessDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={assignAccess} 
                        disabled={
                          actionLoading === 'assign' || 
                          !accessForm.userUuid || 
                          (accessForm.entityUuid === 'none' && accessForm.entityGroupUuid === 'none')
                        }
                      >
                        {actionLoading === 'assign' ? 'Assigning...' : 'Assign Access'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Access Filters */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={`Search ${accessFilters.viewBy === 'user' ? 'users' : 'entities'}...`}
                  value={accessFilters.search}
                  onChange={(e) => setAccessFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <Select value={accessFilters.entity} onValueChange={(value) => setAccessFilters(prev => ({ ...prev, entity: value }))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by entity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entities.map((entity) => (
                    <SelectItem key={entity.entity_uuid} value={entity.entity_uuid}>
                      {entity.entity_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={accessFilters.accessLevel} onValueChange={(value) => setAccessFilters(prev => ({ ...prev, accessLevel: value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="entity_admin">Entity Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Access Table with Inline Editing */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Entity Group</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Granted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUserAccess.map((access) => (
                  <TableRow key={access.user_entity_access_uuid}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {access.user_accounts?.first_name || access.user_accounts?.last_name 
                            ? `${access.user_accounts.first_name} ${access.user_accounts.last_name}`.trim()
                            : access.user_accounts?.email
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {access.user_accounts?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {access.entities?.entity_name || '-'}
                    </TableCell>
                    <TableCell>
                      {access.entity_groups?.entity_group_name || '-'}
                    </TableCell>
                    <TableCell>
                      {/* Inline Access Level Editor */}
                      <Select 
                        value={access.access_level} 
                        onValueChange={(value: 'viewer' | 'entity_admin') => updateAccessLevel(access.user_entity_access_uuid, value)}
                        disabled={actionLoading === `update-${access.user_entity_access_uuid}`}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            {access.access_level === 'entity_admin' ? (
                              <><Settings className="w-3 h-3 mr-1" />Admin</>
                            ) : (
                              <><Eye className="w-3 h-3 mr-1" />Viewer</>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">
                            <Eye className="w-3 h-3 mr-2" />Viewer
                          </SelectItem>
                          <SelectItem value="entity_admin">
                            <Settings className="w-3 h-3 mr-2" />Entity Admin
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(access.granted_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUserForPermissions(access.user_account_uuid);
                            setIsUserPermissionsDialogOpen(true);
                          }}
                          title="View all permissions"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => revokeAccess(access.user_entity_access_uuid)}
                          disabled={actionLoading === `revoke-${access.user_entity_access_uuid}`}
                          title="Revoke access"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

        </Tabs>
      </CardContent>

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