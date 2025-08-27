import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Crown, Shield, Eye, Clock, CheckCircle, XCircle, Pause, Edit, Trash2 } from 'lucide-react';

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
  role: string;
  assigned_at: string;
}

interface UserManagementTableProps {
  users: UserAccount[];
  userRoles: UserRole[];
  onEditUser: (user: UserAccount) => void;
  onStatusChange: (userUuid: string, status: 'approved' | 'rejected' | 'suspended') => void;
  onDeleteUser: (userUuid: string, email: string) => void;
  actionLoading: string | null;
  isSuperAdmin: boolean;
}

export function UserManagementTable({
  users,
  userRoles,
  onEditUser,
  onStatusChange,
  onDeleteUser,
  actionLoading,
  isSuperAdmin
}: UserManagementTableProps): JSX.Element {
  
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

  const isUserSuperAdmin = (userUuid: string) => {
    const role = userRoles.find(r => r.user_uuid === userUuid || r.user_id === userUuid)?.role;
    return role === 'super_admin';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.user_uuid}>
            <TableCell>
              <div>
                <p className="font-medium">{getUserName(user)}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </TableCell>
            <TableCell>{getUserRole(user.user_uuid)}</TableCell>
            <TableCell>{getStatusBadge(user.user_status)}</TableCell>
            <TableCell>
              <div className="text-sm">
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditUser(user)}
                  disabled={!!actionLoading}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                {user.user_status === 'pending' && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange(user.user_uuid, 'approved')}
                      disabled={!!actionLoading}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onStatusChange(user.user_uuid, 'rejected')}
                      disabled={!!actionLoading}
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                {user.user_status === 'approved' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onStatusChange(user.user_uuid, 'suspended')}
                    disabled={!!actionLoading}
                  >
                    Suspend
                  </Button>
                )}

                {isSuperAdmin && !isUserSuperAdmin(user.user_uuid) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteUser(user.user_uuid, user.email)}
                    disabled={!!actionLoading}
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
  );
}