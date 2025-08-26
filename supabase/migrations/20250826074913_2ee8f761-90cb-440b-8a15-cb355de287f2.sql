-- Fix the is_admin_user_v2 function to use correct app_role enum values
CREATE OR REPLACE FUNCTION public.is_admin_user_v2()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('entity_admin', 'super_admin')
  );
$function$;