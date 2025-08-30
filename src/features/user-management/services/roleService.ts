import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/features/user-management/types';
import { InputValidator, ErrorHandler } from '@/shared/utils';
import { EnhancedSecurityService } from '@/features/auth/services/enhancedSecurityService';

export class RoleService {
  static async fetchUserRoles(): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*');

    if (error) throw error;
    return (data || []) as UserRole[];
  }

  static async updateUserRole(userUuid: string, newRole: string): Promise<void> {
    try {
      // Enhanced security check for role updates
      const securityCheck = await EnhancedSecurityService.performAdminSecurityCheck('update_user_role', {
        target_user_uuid: userUuid,
        new_role: newRole
      });

      if (!securityCheck.allowed) {
        throw new Error(`Role update denied: ${securityCheck.reason}`);
      }

      // Validate and sanitize inputs
      const validatedUserUuid = InputValidator.validateUuid(userUuid, 'User UUID');
      const validatedRole = InputValidator.validateText(newRole, 'Role', {
        maxLength: 50,
        required: true,
        allowedChars: /^(viewer|entity_admin|super_admin)$/
      });

      // First fetch the supabase_user_uuid for this user
      const { data: userAccount, error: fetchError } = await supabase
        .from('user_accounts')
        .select('supabase_user_uuid')
        .eq('user_uuid', validatedUserUuid)
        .single();

      if (fetchError) throw new Error(`User account not found: ${fetchError.message}`);
      if (!userAccount?.supabase_user_uuid) throw new Error('User account missing supabase_user_uuid');

      const supabaseUserUuid = userAccount.supabase_user_uuid;

      // Delete existing roles for this user (using both possible UUID fields for safety)
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .or(`user_uuid.eq.${validatedUserUuid},user_id.eq.${supabaseUserUuid}`);

      if (deleteError) throw deleteError;

      // Insert new role with correct UUID mapping
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: supabaseUserUuid, // Use supabase_user_uuid for user_id (foreign key to auth.users)
          user_uuid: validatedUserUuid, // Use user_uuid for user_uuid (reference to user_accounts)
          role: validatedRole as 'viewer' | 'entity_admin' | 'super_admin'
        });

      if (insertError) throw insertError;

      // Log the role change for audit purposes
      await EnhancedSecurityService.logSecurityEvent({
        action: 'user_role_updated',
        targetUserId: supabaseUserUuid,
        additionalData: {
          target_user_uuid: validatedUserUuid,
          new_role: validatedRole,
          operation: 'role_update'
        }
      });

    } catch (validationError) {
      ErrorHandler.logError('RoleService.updateUserRole', validationError);
      throw validationError;
    }
  }

  static getUserRole(userUuid: string, userRoles: UserRole[]): string {
    const role = userRoles.find(r => r.user_uuid === userUuid || r.user_id === userUuid)?.role || 'viewer';
    return role;
  }

  static getUserRoleDisplay(userUuid: string, userRoles: UserRole[]): { role: string; label: string; variant: string } {
    const role = this.getUserRole(userUuid, userRoles);
    
    switch (role) {
      case 'super_admin':
        return { role, label: 'Super Admin', variant: 'outline' };
      case 'entity_admin':
        return { role, label: 'Entity Admin', variant: 'outline' };
      default:
        return { role, label: 'Viewer', variant: 'outline' };
    }
  }

  static isUserSuperAdmin(userUuid: string, userRoles: UserRole[]): boolean {
    const role = userRoles.find(r => r.user_uuid === userUuid || r.user_id === userUuid)?.role;
    return role === 'super_admin';
  }

  static filterUsersByRole(userUuid: string, users: any[], userRoles: UserRole[], roleFilter: string): any[] {
    if (roleFilter === 'all') return users;
    
    return users.filter(user => {
      const userRole = this.getUserRole(user.user_uuid, userRoles);
      return userRole === roleFilter;
    });
  }
}