-- Phase 6: Enhanced Authentication & Security Features (Fixed)

-- 1. Create session management table for enhanced security
CREATE TABLE IF NOT EXISTS public.user_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_reason TEXT
);

-- Add RLS for user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions"
ON public.user_sessions FOR ALL
USING (true);

-- 2. Create rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL, -- IP, user_id, or other identifier
    action_type TEXT NOT NULL, -- 'login', 'signup', 'password_reset', etc.
    attempt_count INTEGER DEFAULT 1,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(identifier, action_type)
);

-- Add RLS for rate limits (admin only)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage rate limits"
ON public.rate_limits FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_accounts ua
        WHERE ua.supabase_user_uuid = auth.uid()
        AND ua.user_status = 'approved'
        AND EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'super_admin')
        )
    )
);

-- 3. Create security events table for detailed logging
CREATE TABLE IF NOT EXISTS public.security_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type TEXT NOT NULL, -- 'login_success', 'login_failure', 'account_locked', etc.
    severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS for security events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own security events"
ON public.security_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all security events"
ON public.security_events FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin')
    )
);

CREATE POLICY "System can insert security events"
ON public.security_events FOR INSERT
WITH CHECK (true);

-- 4. Create security functions with proper search paths
CREATE OR REPLACE FUNCTION public.handle_failed_login(user_email TEXT, client_ip INET DEFAULT NULL, client_user_agent TEXT DEFAULT NULL)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
    current_attempts INTEGER;
    lockout_duration INTERVAL;
    result JSONB;
BEGIN
    -- Get user account
    SELECT * INTO user_record 
    FROM public.user_accounts 
    WHERE email = user_email;
    
    IF NOT FOUND THEN
        -- Log failed login for non-existent user
        INSERT INTO public.security_events (user_id, event_type, severity, ip_address, user_agent, metadata)
        VALUES (NULL, 'login_failure_invalid_user', 'warning', client_ip, client_user_agent, 
                jsonb_build_object('email', user_email, 'reason', 'user_not_found'));
        
        RETURN jsonb_build_object('locked', false, 'attempts', 0);
    END IF;
    
    -- Increment failed attempts
    current_attempts := COALESCE(user_record.failed_login_attempts, 0) + 1;
    
    -- Determine lockout duration based on attempts
    CASE 
        WHEN current_attempts >= 10 THEN lockout_duration := INTERVAL '24 hours';
        WHEN current_attempts >= 5 THEN lockout_duration := INTERVAL '1 hour';
        WHEN current_attempts >= 3 THEN lockout_duration := INTERVAL '15 minutes';
        ELSE lockout_duration := NULL;
    END CASE;
    
    -- Update user account
    UPDATE public.user_accounts 
    SET 
        failed_login_attempts = current_attempts,
        locked_until = CASE WHEN lockout_duration IS NOT NULL THEN now() + lockout_duration ELSE NULL END,
        updated_at = now()
    WHERE user_uuid = user_record.user_uuid;
    
    -- Log security event
    INSERT INTO public.security_events (user_id, event_type, severity, ip_address, user_agent, metadata)
    VALUES (user_record.supabase_user_uuid, 
            CASE WHEN lockout_duration IS NOT NULL THEN 'account_locked' ELSE 'login_failure' END,
            CASE WHEN lockout_duration IS NOT NULL THEN 'error' ELSE 'warning' END,
            client_ip, client_user_agent,
            jsonb_build_object(
                'attempts', current_attempts,
                'locked_until', CASE WHEN lockout_duration IS NOT NULL THEN now() + lockout_duration ELSE NULL END
            ));
    
    result := jsonb_build_object(
        'locked', lockout_duration IS NOT NULL,
        'attempts', current_attempts,
        'locked_until', CASE WHEN lockout_duration IS NOT NULL THEN now() + lockout_duration ELSE NULL END
    );
    
    RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_successful_login(user_email TEXT, client_ip INET DEFAULT NULL, client_user_agent TEXT DEFAULT NULL)
RETURNS VOID
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get user account
    SELECT * INTO user_record 
    FROM public.user_accounts 
    WHERE email = user_email;
    
    IF FOUND THEN
        -- Reset failed login attempts and update last login
        UPDATE public.user_accounts 
        SET 
            failed_login_attempts = 0,
            locked_until = NULL,
            last_login_at = now(),
            updated_at = now()
        WHERE user_uuid = user_record.user_uuid;
        
        -- Log successful login
        INSERT INTO public.security_events (user_id, event_type, severity, ip_address, user_agent, metadata)
        VALUES (user_record.supabase_user_uuid, 'login_success', 'info', client_ip, client_user_agent,
                jsonb_build_object('email', user_email));
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_rate_limit_enhanced(identifier TEXT, action_type TEXT, max_attempts INTEGER DEFAULT 5, window_minutes INTEGER DEFAULT 15)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    current_count INTEGER;
    window_start_time TIMESTAMP WITH TIME ZONE;
    is_blocked BOOLEAN := false;
    blocked_until_time TIMESTAMP WITH TIME ZONE;
    result JSONB;
BEGIN
    window_start_time := now() - (window_minutes || ' minutes')::INTERVAL;
    
    -- Get or create rate limit record
    INSERT INTO public.rate_limits (identifier, action_type, attempt_count, window_start)
    VALUES (identifier, action_type, 1, now())
    ON CONFLICT (identifier, action_type) 
    DO UPDATE SET
        attempt_count = CASE 
            WHEN rate_limits.window_start < window_start_time THEN 1
            ELSE rate_limits.attempt_count + 1
        END,
        window_start = CASE 
            WHEN rate_limits.window_start < window_start_time THEN now()
            ELSE rate_limits.window_start
        END,
        updated_at = now()
    RETURNING attempt_count, blocked_until INTO current_count, blocked_until_time;
    
    -- Check if blocked
    IF blocked_until_time IS NOT NULL AND blocked_until_time > now() THEN
        is_blocked := true;
    ELSIF current_count > max_attempts THEN
        -- Block for increasing duration based on attempts
        blocked_until_time := now() + (LEAST(current_count - max_attempts, 60) || ' minutes')::INTERVAL;
        
        UPDATE public.rate_limits 
        SET blocked_until = blocked_until_time
        WHERE identifier = identifier AND action_type = action_type;
        
        is_blocked := true;
    END IF;
    
    result := jsonb_build_object(
        'blocked', is_blocked,
        'attempts', current_count,
        'max_attempts', max_attempts,
        'blocked_until', blocked_until_time,
        'window_reset', window_start_time + (window_minutes || ' minutes')::INTERVAL
    );
    
    RETURN result;
END;
$$;

-- 5. Create function to clean up expired sessions and rate limits
CREATE OR REPLACE FUNCTION public.cleanup_security_data()
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clean up expired sessions
    DELETE FROM public.user_sessions 
    WHERE expires_at < now() OR (revoked_at IS NOT NULL AND revoked_at < now() - INTERVAL '7 days');
    
    -- Clean up old rate limit records
    DELETE FROM public.rate_limits 
    WHERE window_start < now() - INTERVAL '24 hours' AND (blocked_until IS NULL OR blocked_until < now());
    
    -- Clean up old security events (keep for 90 days)
    DELETE FROM public.security_events 
    WHERE created_at < now() - INTERVAL '90 days';
    
    -- Reset user account locks that have expired
    UPDATE public.user_accounts 
    SET locked_until = NULL, updated_at = now()
    WHERE locked_until IS NOT NULL AND locked_until < now();
END;
$$;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action ON public.rate_limits(identifier, action_type);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id_created ON public.security_events(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_type_created ON public.security_events(event_type, created_at);

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT ON public.user_sessions TO authenticated;
GRANT SELECT ON public.security_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_failed_login(TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_successful_login(TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit_enhanced(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;