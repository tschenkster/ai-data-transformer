-- Fix security functions with mutable search path
-- Update functions that are missing SET search_path = 'public'

-- Fix handle_new_user_role function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer'::app_role);
  RETURN NEW;
END;
$function$;

-- Fix update_translations_updated_at function  
CREATE OR REPLACE FUNCTION public.update_translations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$function$;

-- Enhance RLS policy for user_accounts to be more explicit about anonymous access
DROP POLICY IF EXISTS "Deny anonymous access to user accounts" ON public.user_accounts;
CREATE POLICY "Deny anonymous access to user accounts" 
ON public.user_accounts 
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add additional security policy to ensure authenticated users can only access their own data
DROP POLICY IF EXISTS "Restrict user account access to own data" ON public.user_accounts;
CREATE POLICY "Restrict user account access to own data"
ON public.user_accounts
FOR ALL
TO authenticated
USING (auth.uid() = supabase_user_uuid)
WITH CHECK (auth.uid() = supabase_user_uuid);

-- Enhance user session logs policy to prevent session token exposure
DROP POLICY IF EXISTS "Users can view their own session logs" ON public.user_session_logs;
CREATE POLICY "Users can view limited session data"
ON public.user_session_logs
FOR SELECT
TO authenticated  
USING (
  auth.uid() = user_id 
  AND current_setting('request.jwt.claims', true)::json->>'role' = 'authenticated'
);

-- Restrict user session logs INSERT/UPDATE to prevent token manipulation
CREATE POLICY "Restrict session manipulation"
ON public.user_session_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Prevent session data updates"
ON public.user_session_logs
FOR UPDATE
TO authenticated
USING (false);

-- Add extra protection for security audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit_logs;
CREATE POLICY "Super admins only can view audit logs"
ON public.security_audit_logs
FOR SELECT
TO authenticated
USING (is_super_admin_user_secure());

-- Log this security enhancement
INSERT INTO public.security_audit_logs (
  user_id,
  action,
  details
) VALUES (
  auth.uid(),
  'security_enhancement_applied',
  jsonb_build_object(
    'enhancement_type', 'automated_security_fixes',
    'functions_updated', array['handle_new_user_role', 'update_translations_updated_at'],
    'policies_enhanced', array['user_accounts', 'user_session_logs', 'security_audit_logs'],
    'timestamp', now()
  )
);