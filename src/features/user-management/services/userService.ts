import { supabase } from '@/integrations/supabase/client';
import { UserAccount, UserFilters } from '../types';

export class UserService {
  static async fetchUsers(isSuperAdmin: boolean, userUuid?: string): Promise<UserAccount[]> {
    if (isSuperAdmin) {
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserAccount[];
    } else {
      // Entity admins can only see users within their accessible entities
      if (!userUuid) {
        throw new Error('User UUID required for entity admin scope filtering');
      }
      
      // Get users through entity access scope - fallback to standard query
      const { data, error } = await supabase
        .from('user_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as UserAccount[];
    }
  }

  static async updateUserStatus(
    userUuid: string, 
    status: 'approved' | 'rejected' | 'suspended',
    reason?: string
  ): Promise<void> {
    const { error } = await supabase.rpc('transition_user_account_status', {
      p_user_uuid: userUuid,
      p_new_status: status,
      p_reason: reason
    });

    if (error) throw error;
  }

  static async updateUser(
    userUuid: string,
    updates: { firstName: string; lastName: string }
  ): Promise<void> {
    const { error } = await supabase
      .from('user_accounts')
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName
      })
      .eq('user_uuid', userUuid);

    if (error) throw error;
  }

  static async deleteUser(userUuid: string): Promise<void> {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { 
        userUuid: userUuid,
        forceDelete: true,
        reason: 'Deleted by administrator'
      }
    });

    if (error) throw error;
  }

  static filterUsers(users: UserAccount[], filters: UserFilters): UserAccount[] {
    return users.filter(user => {
      const matchesSearch = filters.search === '' || 
        user.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = filters.status === 'all' || user.user_status === filters.status;
      
      return matchesSearch && matchesStatus;
    });
  }

  static calculateUserStats(users: UserAccount[]) {
    return {
      total: users.length,
      pending: users.filter(u => u.user_status === 'pending').length,
      approved: users.filter(u => u.user_status === 'approved').length,
      suspended: users.filter(u => u.user_status === 'suspended').length,
      rejected: users.filter(u => u.user_status === 'rejected').length
    };
  }

  static getUserName(user: UserAccount): string {
    if (user.first_name || user.last_name) {
      return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    return user.email;
  }
}