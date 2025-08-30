-- Fix remaining function search path issues for security
-- These functions need explicit search_path to prevent security issues

-- Fix enhanced_check_rate_limit function
CREATE OR REPLACE FUNCTION public.enhanced_check_rate_limit(
  p_operation_type text,
  p_identifier text DEFAULT NULL,
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_count integer;
  v_window_start timestamp;
  v_current_user_id uuid;
  v_ip_address text;
BEGIN
  -- Get current user ID if available
  BEGIN
    v_current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_current_user_id := NULL;
  END;

  -- Use provided identifier or fall back to user ID
  IF p_identifier IS NOT NULL THEN
    v_ip_address := p_identifier;
  ELSIF v_current_user_id IS NOT NULL THEN
    v_ip_address := v_current_user_id::text;
  ELSE
    v_ip_address := 'anonymous';
  END IF;

  v_window_start := NOW() - (p_window_minutes || ' minutes')::interval;
  
  -- Count attempts in the window
  SELECT COUNT(*) INTO v_count
  FROM security_audit_logs 
  WHERE action = p_operation_type
    AND (ip_address = v_ip_address OR user_id = v_current_user_id)
    AND created_at >= v_window_start;

  -- Return rate limit status
  RETURN jsonb_build_object(
    'allowed', v_count < p_max_attempts,
    'attempts', v_count,
    'max_attempts', p_max_attempts,
    'window_minutes', p_window_minutes,
    'reset_time', v_window_start + (p_window_minutes || ' minutes')::interval
  );
END;
$$;

-- Fix enhanced_log_security_event function
CREATE OR REPLACE FUNCTION public.enhanced_log_security_event(
  p_action text,
  p_target_user_id uuid DEFAULT NULL,
  p_additional_data jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_event_id uuid;
  v_current_user_id uuid;
BEGIN
  -- Get current user ID
  BEGIN
    v_current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_current_user_id := NULL;
  END;

  -- Insert security event
  INSERT INTO security_audit_logs (
    user_id,
    action,
    target_user_id,
    ip_address,
    user_agent,
    additional_data
  ) VALUES (
    v_current_user_id,
    p_action,
    p_target_user_id,
    COALESCE(p_ip_address, 'unknown'),
    COALESCE(p_user_agent, 'unknown'),
    p_additional_data
  )
  RETURNING security_audit_log_id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- Fix log_security_event function  
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text,
  p_target_user_id uuid DEFAULT NULL,
  p_additional_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_event_id uuid;
  v_current_user_id uuid;
BEGIN
  -- Get current user ID
  BEGIN
    v_current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_current_user_id := NULL;
  END;

  -- Insert security event
  INSERT INTO security_audit_logs (
    user_id,
    action,
    target_user_id,
    ip_address,
    user_agent,
    additional_data
  ) VALUES (
    v_current_user_id,
    p_action,
    p_target_user_id,
    'system',
    'system',
    p_additional_data
  )
  RETURNING security_audit_log_id INTO v_event_id;

  RETURN v_event_id;
END;
$$;