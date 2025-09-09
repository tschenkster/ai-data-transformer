-- Fix RLS policies for user_session_logs table to address session hijacking security concerns
-- Drop existing policies to recreate them with proper security restrictions
DROP POLICY IF EXISTS "Admins can view all session logs" ON public.user_session_logs;
DROP POLICY IF EXISTS "Users can view limited session data" ON public.user_session_logs;
DROP POLICY IF EXISTS "Restrict session manipulation" ON public.user_session_logs;
DROP POLICY IF EXISTS "Prevent session data updates" ON public.user_session_logs;

-- Create secure RLS policies for session logs with minimal access

-- Only super admins can view session logs for security monitoring purposes
-- This is critical for detecting session hijacking attempts and security breaches
CREATE POLICY "Super admins only can view session logs" 
ON public.user_session_logs 
FOR SELECT 
TO authenticated 
USING (is_super_admin_user_secure());

-- Only system functions can insert session logs (users should never directly manipulate sessions)
CREATE POLICY "System only can insert session logs" 
ON public.user_session_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (false); -- Block all direct inserts, only allow through system functions

-- Completely prevent updates to session logs for audit integrity
CREATE POLICY "Prevent all session log updates" 
ON public.user_session_logs 
FOR UPDATE 
TO authenticated 
USING (false);

-- Only super admins can delete session logs (for cleanup purposes)
CREATE POLICY "Super admins only can delete session logs" 
ON public.user_session_logs 
FOR DELETE 
TO authenticated 
USING (is_super_admin_user_secure());

-- Create a secure function for users to view limited, non-sensitive session metadata
-- This allows users to see basic session activity without exposing session tokens
CREATE OR REPLACE FUNCTION public.get_user_session_activity()
RETURNS TABLE(
  session_created_at timestamp with time zone,
  last_activity_at timestamp with time zone,
  is_current_session boolean,
  session_duration_minutes integer,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return non-sensitive session activity data
  -- Deliberately exclude session tokens, IP addresses, user agents, and detailed metadata
  RETURN QUERY
  SELECT 
    usl.created_at as session_created_at,
    usl.last_activity_at,
    (usl.session_token = COALESCE((current_setting('request.jwt.claims', true)::json ->> 'session_id'), '')) as is_current_session,
    EXTRACT(EPOCH FROM (COALESCE(usl.ended_at, now()) - usl.created_at))/60 as session_duration_minutes,
    usl.is_active
  FROM user_session_logs usl
  WHERE usl.user_id = auth.uid()
  AND usl.created_at >= (now() - interval '30 days') -- Only show last 30 days
  ORDER BY usl.last_activity_at DESC
  LIMIT 10; -- Limit to prevent information leakage
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_session_activity() TO authenticated;

-- Ensure RLS is enforced
ALTER TABLE public.user_session_logs FORCE ROW LEVEL SECURITY;