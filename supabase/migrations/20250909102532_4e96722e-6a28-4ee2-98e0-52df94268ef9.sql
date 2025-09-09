-- Drop and recreate function to fix return type
DROP FUNCTION IF EXISTS public.get_all_user_profiles_admin();

CREATE OR REPLACE FUNCTION public.get_all_user_profiles_admin()
RETURNS TABLE(
  user_uuid uuid,
  user_id integer,
  supabase_user_uuid uuid,
  email text,
  first_name text,
  last_name text,
  user_status user_account_status,
  created_at timestamp with time zone,
  approved_at timestamp with time zone,
  approved_by uuid,
  last_login_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only super admins can access all user profiles
  IF NOT is_super_admin_user_secure() THEN
    RAISE EXCEPTION 'Access denied: Only super admins can view all user profiles';
  END IF;

  -- Log the admin access
  PERFORM log_user_data_access(
    auth.uid(),
    'bulk_admin_access',
    'get_all_user_profiles_admin'
  );

  RETURN QUERY
  SELECT 
    ua.user_uuid,
    ua.user_id,
    ua.supabase_user_uuid,
    ua.email,
    ua.first_name,
    ua.last_name,
    ua.user_status,
    ua.created_at,
    ua.approved_at,
    ua.approved_by,
    ua.last_login_at
  FROM public.user_accounts ua
  ORDER BY ua.created_at DESC;
END;
$$;