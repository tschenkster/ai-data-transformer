-- Security Fix: Add search_path protection to security functions
-- This prevents search path injection attacks

-- Fix enhanced_check_rate_limit function
CREATE OR REPLACE FUNCTION public.enhanced_check_rate_limit(operation_type text, identifier text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 15)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  attempt_count int;
  window_start timestamptz;
BEGIN
  window_start := now() - interval '1 minute' * window_minutes;
  
  SELECT count(*) INTO attempt_count
  FROM security_audit_logs 
  WHERE action = operation_type 
    AND details ->> 'identifier' = identifier
    AND created_at > window_start;
    
  RETURN attempt_count < max_attempts;
END;
$function$;

-- Fix enhanced_log_security_event function
CREATE OR REPLACE FUNCTION public.enhanced_log_security_event(p_action text, p_target_user_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    target_user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING security_audit_log_uuid INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(p_action text, p_target_user_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    p_details
  );
END;
$function$;

-- RLS Policy Optimization: Remove conflicting policies on user_accounts
-- The "Deny anonymous access to user accounts" policy conflicts with other policies
DROP POLICY IF EXISTS "Deny anonymous access to user accounts" ON public.user_accounts;

-- Ensure the restrictive policy is properly ordered
DROP POLICY IF EXISTS "Restrict user account access to own data" ON public.user_accounts;
CREATE POLICY "Restrict user account access to own data" ON public.user_accounts
FOR ALL 
USING (auth.uid() = supabase_user_uuid)
WITH CHECK (auth.uid() = supabase_user_uuid);

-- Add comment for policy documentation
COMMENT ON POLICY "Restrict user account access to own data" ON public.user_accounts IS 
'Primary access control: Users can only access their own account data. Admin policies override this for privileged operations.';