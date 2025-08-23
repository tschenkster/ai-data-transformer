-- Update remaining functions that use the old table and column names
CREATE OR REPLACE FUNCTION public.enhanced_log_security_event(p_action text, p_target_user_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb, p_identifier text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id UUID;
  v_enhanced_details jsonb;
BEGIN
  -- Enhance details with additional security context
  v_enhanced_details := COALESCE(p_details, '{}'::jsonb);
  
  IF p_identifier IS NOT NULL THEN
    v_enhanced_details := v_enhanced_details || jsonb_build_object('identifier', p_identifier);
  END IF;
  
  -- Check rate limiting for sensitive operations
  IF p_action IN ('login_attempt', 'password_reset', 'account_creation') THEN
    IF NOT check_rate_limit(p_action, COALESCE(p_identifier, auth.uid()::text), 5, 15) THEN
      v_enhanced_details := v_enhanced_details || jsonb_build_object('rate_limited', true);
    END IF;
  END IF;

  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    v_enhanced_details
  ) RETURNING security_audit_log_uuid INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- Update check_rate_limit function
CREATE OR REPLACE FUNCTION public.check_rate_limit(operation_type text, identifier text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 15)
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

-- Update detect_suspicious_activity function
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(p_user_id uuid, p_time_window_minutes integer DEFAULT 60)
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

-- Update log_failed_auth_attempt function
CREATE OR REPLACE FUNCTION public.log_failed_auth_attempt(p_email text, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
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