import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export function useUserManagementActions() {
  const { user, userAccount, logSecurityEvent } = useAuth();
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const inviteUser = async (inviteForm: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'viewer' | 'entity_admin' | 'super_admin';
  }): Promise<void> => {
    try {
      setActionLoading('invite');
      
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite user",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserStatus = async (userUuid: string, status: 'approved' | 'rejected' | 'suspended'): Promise<void> => {
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${status} user`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userUuid: string, userEmail: string): Promise<void> => {
    try {
      setActionLoading(`delete-${userUuid}`);
      
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { 
          userAccountUuid: userUuid, 
          userEmail: userEmail 
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  const updateUser = async (editUserForm: {
    userUuid: string;
    firstName: string;
    lastName: string;
    role: 'viewer' | 'entity_admin' | 'super_admin';
  }): Promise<void> => {
    try {
      setActionLoading('edit');
      
      const { error: accountError } = await supabase
        .from('user_accounts')
        .update({
          first_name: editUserForm.firstName || null,
          last_name: editUserForm.lastName || null,
        })
        .eq('user_uuid', editUserForm.userUuid);

      if (accountError) throw accountError;

      const { error: deleteRoleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_uuid', editUserForm.userUuid);

      if (deleteRoleError) throw deleteRoleError;

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_uuid: editUserForm.userUuid,
          user_id: editUserForm.userUuid,
          role: editUserForm.role,
          assigned_by_user_account_uuid: userAccount?.user_uuid
        });

      if (roleError) throw roleError;

      if (logSecurityEvent) {
        await logSecurityEvent('user_updated', editUserForm.userUuid, {
          updated_by: user?.email,
          changes: {
            firstName: editUserForm.firstName,
            lastName: editUserForm.lastName,
            role: editUserForm.role
          }
        });
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error", 
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
      throw error;
    } finally {
      setActionLoading(null);
    }
  };

  return {
    inviteUser,
    updateUserStatus,
    deleteUser,
    updateUser,
    actionLoading
  };
}