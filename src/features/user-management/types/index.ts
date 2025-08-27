export interface UserAccount {
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

export interface UserRole {
  user_role_uuid: string;
  user_uuid?: string;
  user_id: string;
  role: string;
  assigned_at: string;
}

export interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UpdateUserRequest {
  userUuid: string;
  firstName: string;
  lastName: string;
  role?: string;
}

export interface UserFilters {
  search: string;
  status: string;
  role: string;
}

export interface UserStats {
  total: number;
  pending: number;
  approved: number;
  suspended: number;
  rejected: number;
}