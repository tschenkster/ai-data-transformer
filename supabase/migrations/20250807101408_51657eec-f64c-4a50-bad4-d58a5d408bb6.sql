-- Drop and recreate the get_current_user_details function with correct return types
DROP FUNCTION IF EXISTS public.get_current_user_details();

CREATE OR REPLACE FUNCTION public.get_current_user_details()
 RETURNS TABLE(user_uuid uuid, user_first_name text, user_last_name text, user_email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_uuid,
    COALESCE(ua.first_name, '')::text as user_first_name,
    COALESCE(ua.last_name, '')::text as user_last_name,
    COALESCE(au.email, '')::text as user_email
  FROM auth.users au
  LEFT JOIN public.user_accounts ua ON ua.user_id = au.id
  WHERE au.id = auth.uid();
END;
$function$