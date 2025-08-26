import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UserManagementState {
  users: any[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedRole: string;
  selectedStatus: string;
}

export function useUserManagement() {
  const { user, isAdmin, isSuperAdmin, logSecurityEvent } = useAuth();
  const { toast } = useToast();
  
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: true,
    error: null,
    searchTerm: '',
    selectedRole: 'all',
    selectedStatus: 'all'
  });

  const updateState = (updates: Partial<UserManagementState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const fetchUsers = async () => {
    try {
      updateState({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('user_accounts')
        .select(`
          *,
          user_roles (
            role,
            assigned_at,
            assigned_by
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      updateState({ users: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching users:', error);
      updateState({ 
        error: error.message || 'Failed to fetch users', 
        loading: false 
      });
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const handleUserStatusChange = async (userId: string, newStatus: 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived') => {
    try {
      const { error } = await supabase
        .from('user_accounts')
        .update({ user_status: newStatus })
        .eq('user_uuid', userId);

      if (error) throw error;

      await logSecurityEvent(`user_status_changed_to_${newStatus}`, userId);
      toast({
        title: "Success",
        description: `User status updated to ${newStatus}`,
      });
      
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'viewer' | 'entity_admin' | 'super_admin') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole,
          assigned_by_user_account_uuid: user?.id
        });

      if (error) throw error;

      await logSecurityEvent(`role_changed_to_${newRole}`, userId);
      toast({
        title: "Success",
        description: `Role updated to ${newRole}`,
      });
      
      await fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = state.users.filter(user => {
    const matchesSearch = !state.searchTerm || 
      user.email?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(state.searchTerm.toLowerCase());
    
    const matchesRole = state.selectedRole === 'all' || user.role === state.selectedRole;
    const matchesStatus = state.selectedStatus === 'all' || user.user_status === state.selectedStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    ...state,
    filteredUsers,
    updateState,
    fetchUsers,
    handleUserStatusChange,
    handleRoleChange,
    canManageUsers: isAdmin || isSuperAdmin
  };
}