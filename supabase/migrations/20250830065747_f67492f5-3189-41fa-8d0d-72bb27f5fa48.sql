-- Fix remaining function search path security issues

-- Update functions that still need search_path set for security
CREATE OR REPLACE FUNCTION public.enhanced_check_rate_limit(
  p_operation_type text,
  p_identifier text,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_existing_record RECORD;
BEGIN
  v_window_start := now() - interval '1 minute' * p_window_minutes;
  
  -- Check for existing rate limit record
  SELECT * INTO v_existing_record
  FROM security_rate_limits 
  WHERE operation_type = p_operation_type 
    AND identifier = p_identifier
    AND window_start_at > v_window_start;
  
  IF v_existing_record IS NULL THEN
    -- Create new rate limit record
    INSERT INTO security_rate_limits (
      operation_type, 
      identifier, 
      attempt_count,
      window_start_at,
      last_attempt_at
    ) VALUES (
      p_operation_type,
      p_identifier, 
      1,
      now(),
      now()
    );
    RETURN true;
  ELSE
    -- Update existing record
    UPDATE security_rate_limits 
    SET 
      attempt_count = attempt_count + 1,
      last_attempt_at = now(),
      is_blocked = (attempt_count + 1) >= p_max_attempts,
      blocked_until_at = CASE 
        WHEN (attempt_count + 1) >= p_max_attempts 
        THEN now() + interval '1 minute' * p_window_minutes
        ELSE blocked_until_at
      END,
      updated_at = now()
    WHERE security_rate_limit_uuid = v_existing_record.security_rate_limit_uuid;
    
    -- Return false if rate limited
    RETURN (v_existing_record.attempt_count + 1) < p_max_attempts;
  END IF;
END;
$$;

-- Update enhanced_log_security_event function to include proper search_path
CREATE OR REPLACE FUNCTION public.enhanced_log_security_event(
  p_action text,
  p_target_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_identifier text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;