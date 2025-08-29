import { supabase } from '@/integrations/supabase/client';
import { InviteUserRequest } from '@/features/user-management/types';

export class InvitationService {
  static async inviteUser(
    invite: InviteUserRequest,
    inviterId: string,
    inviterEmail: string,
    logSecurityEvent?: (action: string, targetUserId?: string, details?: any) => Promise<void>
  ): Promise<void> {
    // Create user account with pending status
    const { data: userData, error: userError } = await supabase.auth.admin.inviteUserByEmail(
      invite.email,
      {
        data: {
          first_name: invite.firstName,
          last_name: invite.lastName,
          invited_by: inviterId,
          invited_role: invite.role
        },
        redirectTo: `${window.location.origin}/auth`
      }
    );

    if (userError) throw userError;

    // Log security event
    if (logSecurityEvent) {
      await logSecurityEvent('user_invited', userData.user?.id, {
        invited_email: invite.email,
        invited_role: invite.role,
        invited_by: inviterEmail
      });
    }
  }

  static validateInviteForm(invite: InviteUserRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!invite.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(invite.email)) {
      errors.push('Email is invalid');
    }

    if (!invite.firstName.trim()) {
      errors.push('First name is required');
    }

    if (!invite.lastName.trim()) {
      errors.push('Last name is required');
    }

    if (!invite.role) {
      errors.push('Role is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static createEmptyInviteForm(): InviteUserRequest {
    return {
      email: '',
      firstName: '',
      lastName: '',
      role: 'viewer'
    };
  }
}