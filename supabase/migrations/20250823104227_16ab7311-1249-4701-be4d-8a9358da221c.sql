-- Phase 1: Critical Foundation Fixes
-- Step 1.1: Create reporting schema for future analytical tables
CREATE SCHEMA IF NOT EXISTS reporting;

-- Step 1.2: Standardize primary key names from 'id' to '<entity>_uuid'
-- Note: We need to drop and recreate constraints that reference these columns

-- First, let's rename the primary key columns
-- coa_translation_sessions: id -> coa_translation_session_uuid
ALTER TABLE coa_translation_sessions RENAME COLUMN id TO coa_translation_session_uuid;

-- security_audit_log: id -> security_audit_log_uuid  
ALTER TABLE security_audit_log RENAME COLUMN id TO security_audit_log_uuid;

-- user_roles: id -> user_role_uuid
ALTER TABLE user_roles RENAME COLUMN id TO user_role_uuid;

-- Step 1.3: Standardize audit table names to plural '_logs' format
-- report_structures_change_log -> report_structure_change_logs
ALTER TABLE report_structures_change_log RENAME TO report_structure_change_logs;

-- security_audit_log -> security_audit_logs  
ALTER TABLE security_audit_log RENAME TO security_audit_logs;

-- Update any RLS policies that reference the old table names
DROP POLICY IF EXISTS "Admins can view audit logs" ON security_audit_log;
CREATE POLICY "Admins can view audit logs" 
ON security_audit_logs 
FOR SELECT 
USING (is_admin_user_v2());

-- Update policies for report_structure_change_logs
DROP POLICY IF EXISTS "Users can insert their own change logs" ON report_structures_change_log;
DROP POLICY IF EXISTS "Users can update their own change logs for undo" ON report_structures_change_log;  
DROP POLICY IF EXISTS "Admins can view all change logs" ON report_structures_change_log;

CREATE POLICY "Users can insert their own change logs" 
ON report_structure_change_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_uuid);

CREATE POLICY "Users can update their own change logs for undo" 
ON report_structure_change_logs 
FOR UPDATE 
USING ((auth.uid() = user_uuid) OR is_admin_user());

CREATE POLICY "Admins can view all change logs" 
ON report_structure_change_logs 
FOR ALL 
USING (is_admin_user());

-- Update functions that reference the old table names
CREATE OR REPLACE FUNCTION public.log_structure_change(
  p_structure_uuid uuid, 
  p_structure_id integer, 
  p_line_item_uuid uuid, 
  p_line_item_id integer, 
  p_action_type change_action_type, 
  p_line_item_key text, 
  p_line_item_description text, 
  p_previous_state jsonb DEFAULT NULL::jsonb, 
  p_new_state jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_change_uuid UUID;
  v_user_details RECORD;
BEGIN
  -- Get current user details
  SELECT * INTO v_user_details FROM public.get_current_user_details();
  
  -- Insert the change log entry
  INSERT INTO public.report_structure_change_logs (
    user_uuid,
    user_first_name,
    user_last_name,
    user_email,
    structure_uuid,
    structure_id,
    line_item_uuid,
    line_item_id,
    action_type,
    line_item_key,
    line_item_description,
    previous_state,
    new_state
  ) VALUES (
    v_user_details.user_uuid,
    v_user_details.user_first_name,
    v_user_details.user_last_name,
    v_user_details.user_email,
    p_structure_uuid,
    p_structure_id,
    p_line_item_uuid,
    p_line_item_id,
    p_action_type,
    p_line_item_key,
    p_line_item_description,
    p_previous_state,
    p_new_state
  ) RETURNING change_uuid INTO v_change_uuid;
  
  RETURN v_change_uuid;
END;
$function$;

-- Update log_security_event function to use new table name
CREATE OR REPLACE FUNCTION public.log_security_event(p_action text, p_target_user_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_log_id UUID;
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
  ) RETURNING security_audit_log_uuid INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- Update enhanced_log_security_event function
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

-- Update other functions that reference security_audit_log
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