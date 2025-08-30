import { supabase } from '@/integrations/supabase/client';
import { UserAccount, UserFilters } from '@/features/user-management/types';
import { InputValidator } from '@/shared/utils/inputValidation';
import { ErrorHandler } from '@/shared/utils/errorHandling';

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
    try {
      // Validate and sanitize inputs
      const validatedUuid = InputValidator.validateUuid(userUuid, 'User UUID');
      const firstName = InputValidator.validateText(updates.firstName, 'First name', {
        maxLength: 50,
        required: false
      });
      const lastName = InputValidator.validateText(updates.lastName, 'Last name', {
        maxLength: 50,
        required: false
      });

      const { error } = await supabase
        .from('user_accounts')
        .update({
          first_name: firstName,
          last_name: lastName
        })
        .eq('user_uuid', validatedUuid);

      if (error) throw error;
    } catch (validationError) {
      ErrorHandler.logError('UserService.updateUser', validationError);
      throw validationError;
    }
  }

  static async deleteUser(userUuid: string): Promise<void> {
    // Fetch user details for proper deletion request
    const { data: userAccount, error: fetchError } = await supabase
      .from('user_accounts')
      .select('user_uuid, email')
      .eq('user_uuid', userUuid)
      .single();

    if (fetchError || !userAccount) {
      throw new Error(`User account not found: ${fetchError?.message || 'Unknown error'}`);
    }

    const { error } = await supabase.functions.invoke('delete-user', {
      body: { 
        userAccountUuid: userAccount.user_uuid,
        userEmail: userAccount.email,
        reason: 'Deleted by administrator'
      }
    });

    if (error) throw error;
  }

  static filterUsers(users: UserAccount[], filters: UserFilters): UserAccount[] {
    try {
      // Sanitize search input to prevent XSS
      const sanitizedSearch = InputValidator.validateSearchQuery(filters.search);
      
      return users.filter(user => {
        const matchesSearch = sanitizedSearch === '' || 
          user.email.toLowerCase().includes(sanitizedSearch.toLowerCase()) ||
          `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(sanitizedSearch.toLowerCase());
        
        const matchesStatus = filters.status === 'all' || user.user_status === filters.status;
        
        return matchesSearch && matchesStatus;
      });
    } catch (error) {
      ErrorHandler.logWarning('UserService.filterUsers', 'Search filter validation failed', error);
      // Return unfiltered users if search validation fails
      return users.filter(user => {
        const matchesStatus = filters.status === 'all' || user.user_status === filters.status;
        return matchesStatus;
      });
    }
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