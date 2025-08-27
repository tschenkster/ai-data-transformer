import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '../types';

export class RoleService {
  static async fetchUserRoles(): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_roles')
      .select('*');

    if (error) throw error;
    return (data || []) as UserRole[];
  }

  static async updateUserRole(userUuid: string, newRole: string): Promise<void> {
    // First delete existing roles for this user
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .or(`user_uuid.eq.${userUuid},user_id.eq.${userUuid}`);

    if (deleteError) throw deleteError;

    // Insert new role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userUuid,
        user_uuid: userUuid,
        role: newRole as 'viewer' | 'entity_admin' | 'super_admin'
      });

    if (insertError) throw insertError;
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