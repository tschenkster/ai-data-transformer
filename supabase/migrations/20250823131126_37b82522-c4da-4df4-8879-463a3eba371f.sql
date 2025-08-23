-- Phase 4.1 Part 2: Update remaining functions and create new user account functions

-- Update check_rate_limit function to use new table name
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  operation_type text, 
  identifier text, 
  max_attempts integer DEFAULT 5, 
  window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Update detect_suspicious_activity function to use new table name  
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(
  p_user_id uuid, 
  p_time_window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  failed_attempts int;
  successful_logins int;
  window_start timestamptz;
BEGIN
  window_start := now() - interval '1 minute' * p_time_window_minutes;
  
  -- Check for excessive failed attempts
  SELECT count(*) INTO failed_attempts
  FROM security_audit_logs 
  WHERE (user_id = p_user_id OR details ->> 'email' = (
    SELECT email FROM auth.users WHERE id = p_user_id
  ))
  AND action IN ('failed_login_attempt', 'failed_password_reset')
  AND created_at > window_start;
  
  -- Check for successful logins from multiple IPs
  SELECT count(DISTINCT ip_address) INTO successful_logins
  FROM security_audit_logs 
  WHERE user_id = p_user_id
  AND action = 'login_success'
  AND created_at > window_start
  AND ip_address IS NOT NULL;
  
  -- Flag as suspicious if more than 5 failed attempts or logins from 3+ IPs
  RETURN (failed_attempts > 5 OR successful_logins > 3);
END;
$function$;

-- Update log_failed_auth_attempt function to use new table name
CREATE OR REPLACE FUNCTION public.log_failed_auth_attempt(
  p_email text, 
  p_ip_address inet DEFAULT NULL::inet, 
  p_user_agent text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    NULL, -- No user ID for failed attempts
    'failed_login_attempt',
    jsonb_build_object(
      'email', p_email,
      'timestamp', now()
    ),
    p_ip_address,
    p_user_agent
  );
END;
$function$;

-- Create enhanced user account management functions using new relationships
CREATE OR REPLACE FUNCTION public.get_user_account_by_supabase_uuid(p_supabase_uuid uuid)
RETURNS TABLE(
  user_account_uuid uuid,
  user_account_id integer,
  email text,
  first_name text,
  last_name text,
  status text,
  created_at timestamptz,
  last_login_at timestamptz,
  failed_login_attempts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ua.user_account_uuid,
    ua.user_account_id,
    ua.email,
    ua.first_name,
    ua.last_name,
    ua.status,
    ua.created_at,
    ua.last_login_at,
    ua.failed_login_attempts
  FROM public.user_accounts ua
  WHERE ua.supabase_user_uuid = p_supabase_uuid;
END;
$function$;