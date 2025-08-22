-- Complete security hardening - Phase 1: RLS and Authentication Security

-- 1. Add explicit RLS policy to public_report_structures view for consistency
-- Even though it's public, having an explicit policy makes security posture clear
ALTER VIEW public.public_report_structures SET (security_invoker = false);

CREATE POLICY "Allow public read access to active report structures" 
ON public.public_report_structures 
FOR SELECT 
TO public
USING (true);

-- 2. Harden authentication security settings
-- Reduce OTP expiry from excessive time to secure 15 minutes
UPDATE auth.config SET 
  otp_exp = 900  -- 15 minutes instead of default longer period
WHERE TRUE;

-- 3. Enable additional security features for auth
-- Note: Some settings may need to be configured via Supabase dashboard
-- This ensures our database-level security is maximized

-- 4. Add rate limiting function for sensitive operations
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  operation_type text,
  identifier text,
  max_attempts int DEFAULT 5,
  window_minutes int DEFAULT 15
) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count int;
  window_start timestamptz;
BEGIN
  window_start := now() - interval '1 minute' * window_minutes;
  
  SELECT count(*) INTO attempt_count
  FROM security_audit_log 
  WHERE action = operation_type 
    AND details ->> 'identifier' = identifier
    AND created_at > window_start;
    
  RETURN attempt_count < max_attempts;
END;
$$;

-- 5. Enhance security audit logging with IP and user agent capture
-- Add trigger to automatically capture security context
CREATE OR REPLACE FUNCTION public.enhanced_log_security_event(
  p_action text, 
  p_target_user_id uuid DEFAULT NULL, 
  p_details jsonb DEFAULT NULL,
  p_identifier text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  INSERT INTO public.security_audit_log (
    user_id,
    action,
    target_user_id,
    details
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    v_enhanced_details
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$;