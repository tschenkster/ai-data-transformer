import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UserService } from '@/features/user-management/services/userService';
import { RoleService } from '@/features/user-management/services/roleService';
import { InvitationService } from '@/features/user-management/services/invitationService';
import { InviteUserRequest, UpdateUserRequest } from '@/features/user-management/types';

export function useUserActions(onDataChange?: () => void): {
  actionLoading: string | null;
  inviteUser: (inviteData: InviteUserRequest) => Promise<void>;
  updateUserStatus: (userUuid: string, status: 'approved' | 'rejected' | 'suspended') => Promise<void>;
  updateUser: (updateData: UpdateUserRequest) => Promise<void>;
  deleteUser: (userUuid: string) => Promise<void>;
} {
  const { user, logSecurityEvent, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const inviteUser = async (inviteData: InviteUserRequest) => {
    const validation = InvitationService.validateInviteForm(inviteData);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    setActionLoading('invite');
    try {
      await InvitationService.inviteUser(
        inviteData,
        user?.id || '',
        user?.email || '',
        logSecurityEvent
      );

      toast({
        title: "Success",
        description: `Invitation sent to ${inviteData.email}`,
      });

      onDataChange?.();
    } finally {
      setActionLoading(null);
    }
  };

  const updateUserStatus = async (
    userUuid: string, 
    status: 'approved' | 'rejected' | 'suspended'
  ) => {
    setActionLoading(`status-${userUuid}`);
    try {
      await UserService.updateUserStatus(
        userUuid, 
        status, 
        `Status changed by ${user?.email}`
      );

      toast({
        title: "Success",
        description: `User status updated to ${status}`,
      });

      onDataChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const updateUser = async (updateData: UpdateUserRequest) => {
    setActionLoading('edit');
    try {
      // Update user account information
      await UserService.updateUser(updateData.userUuid, {
        firstName: updateData.firstName,
        lastName: updateData.lastName
      });

      // Update role if provided and user is super admin
      if (updateData.role && isSuperAdmin) {
        await RoleService.updateUserRole(updateData.userUuid, updateData.role);
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      onDataChange?.();
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

  const deleteUser = async (userUuid: string) => {
    setActionLoading(`delete-${userUuid}`);
    try {
      await UserService.deleteUser(userUuid);

      toast({
        title: "Success",
        description: "User deleted successfully",
      });

      onDataChange?.();
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

  return {
    actionLoading,
    inviteUser,
    updateUserStatus,
    updateUser,
    deleteUser
  };
}