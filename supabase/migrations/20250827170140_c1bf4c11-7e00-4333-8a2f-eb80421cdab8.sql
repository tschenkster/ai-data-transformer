-- Phase 6 Security Enhancement - Database Schema Corrections
-- Following naming conventions: R5 (plural tables), R6 (_logs suffix), R11 (UUID+ID), R15 (_at timestamps)

-- Create user_session_logs table for session tracking (audit trail)  
CREATE TABLE IF NOT EXISTS public.user_session_logs (
  user_session_log_uuid UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_session_log_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  session_metadata JSONB DEFAULT '{}'::jsonb
);

-- Create security_rate_limits table for rate limiting tracking
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  security_rate_limit_uuid UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  security_rate_limit_id INTEGER NOT NULL GENERATED ALWAYS AS IDENTITY,
  operation_type TEXT NOT NULL,
  identifier TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  blocked_until_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_session_logs_user_id ON public.user_session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_logs_active ON public.user_session_logs(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_security_rate_limits_lookup ON public.security_rate_limits(operation_type, identifier, window_start_at);

-- Enable RLS
ALTER TABLE public.user_session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_session_logs
CREATE POLICY "Users can view their own session logs" ON public.user_session_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all session logs" ON public.user_session_logs  
  FOR ALL USING (is_admin_user_v2());

-- RLS Policies for security_rate_limits (admin only - sensitive security data)
CREATE POLICY "Admins can manage rate limits" ON public.security_rate_limits
  FOR ALL USING (is_admin_user_v2());

-- Add updated_at trigger for security_rate_limits
CREATE TRIGGER update_security_rate_limits_updated_at
  BEFORE UPDATE ON public.security_rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enhanced rate limiting function with proper table names
CREATE OR REPLACE FUNCTION public.enhanced_check_rate_limit(
  p_operation_type TEXT,
  p_identifier TEXT, 
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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