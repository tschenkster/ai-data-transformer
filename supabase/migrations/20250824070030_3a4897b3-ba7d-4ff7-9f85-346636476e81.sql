-- Update the get_users_by_status function to return the renamed column
CREATE OR REPLACE FUNCTION public.get_users_by_status(p_status user_account_status)
RETURNS TABLE(user_uuid uuid, email text, first_name text, last_name text, status_enum user_account_status, created_at timestamp with time zone, updated_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ua.user_uuid,
    ua.email,
    ua.first_name,
    ua.last_name,
    ua.status_enum,
    ua.created_at,
    ua.updated_at
  FROM public.user_accounts ua
  WHERE ua.status_enum = p_status
  AND (is_admin_user_v2() OR auth.uid() = ua.supabase_user_uuid)
  ORDER BY ua.updated_at DESC;
END;
$function$