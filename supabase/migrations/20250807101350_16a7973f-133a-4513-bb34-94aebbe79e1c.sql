-- Fix the get_current_user_details function type mismatch
CREATE OR REPLACE FUNCTION public.get_current_user_details()
 RETURNS TABLE(user_uuid uuid, user_first_name character varying, user_last_name character varying, user_email character varying)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_uuid,
    COALESCE(ua.first_name, '')::character varying as user_first_name,
    COALESCE(ua.last_name, '')::character varying as user_last_name,
    COALESCE(au.email, '')::character varying as user_email
  FROM auth.users au
  LEFT JOIN public.user_accounts ua ON ua.user_id = au.id
  WHERE au.id = auth.uid();
END;
$function$