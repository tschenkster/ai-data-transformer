-- Phase 1: Rename user_account_uuid to user_uuid and user_account_id to user_id
-- This is a comprehensive migration that updates the primary table and all foreign key references

-- Step 1: Rename columns in the user_accounts table
ALTER TABLE public.user_accounts 
RENAME COLUMN user_account_uuid TO user_uuid;

ALTER TABLE public.user_accounts 
RENAME COLUMN user_account_id TO user_id;

-- Step 2: Update foreign key references in other tables
-- user_roles table
ALTER TABLE public.user_roles 
RENAME COLUMN user_account_uuid TO user_uuid;

-- security_audit_logs table  
ALTER TABLE public.security_audit_logs 
RENAME COLUMN user_account_uuid TO user_uuid;

ALTER TABLE public.security_audit_logs 
RENAME COLUMN target_user_account_uuid TO target_user_uuid;

-- coa_translation_sessions table
ALTER TABLE public.coa_translation_sessions 
RENAME COLUMN user_account_uuid TO user_uuid;

-- report_line_items table
ALTER TABLE public.report_line_items 
RENAME COLUMN created_by_user_account_uuid TO created_by_user_uuid;

ALTER TABLE public.report_line_items 
RENAME COLUMN updated_by_user_account_uuid TO updated_by_user_uuid;

-- report_structures table
ALTER TABLE public.report_structures 
RENAME COLUMN archived_by_user_account_uuid TO archived_by_user_uuid;

-- Step 3: Drop and recreate database functions that reference the old column names
DROP FUNCTION IF EXISTS public.get_user_with_roles(uuid);
DROP FUNCTION IF EXISTS public.get_user_account_by_supabase_uuid(uuid);
DROP FUNCTION IF EXISTS public.transition_user_account_status(uuid, user_account_status, text);

CREATE OR REPLACE FUNCTION public.get_user_with_roles(p_supabase_user_uuid uuid)
RETURNS TABLE(user_uuid uuid, email text, first_name text, last_name text, status text, roles text[], is_admin boolean, is_super_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ua.user_uuid,
    ua.email,
    ua.first_name,
    ua.last_name,
    ua.status,
    COALESCE(ARRAY_AGG(ur.role ORDER BY ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}')::text[] as roles,
    EXISTS(SELECT 1 FROM user_roles ur2 WHERE ur2.user_uuid = ua.user_uuid AND ur2.role IN ('admin', 'super_admin')) as is_admin,
    EXISTS(SELECT 1 FROM user_roles ur3 WHERE ur3.user_uuid = ua.user_uuid AND ur3.role = 'super_admin') as is_super_admin
  FROM user_accounts ua
  LEFT JOIN user_roles ur ON ur.user_uuid = ua.user_uuid
  WHERE ua.supabase_user_uuid = p_supabase_user_uuid
  GROUP BY ua.user_uuid, ua.email, ua.first_name, ua.last_name, ua.status;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_account_by_supabase_uuid(p_supabase_uuid uuid)
RETURNS TABLE(user_uuid uuid, user_id integer, email text, first_name text, last_name text, status text, created_at timestamp with time zone, last_login_at timestamp with time zone, failed_login_attempts integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ua.user_uuid,
    ua.user_id,
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

CREATE OR REPLACE FUNCTION public.transition_user_account_status(p_user_uuid uuid, p_new_status user_account_status, p_reason text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_status public.user_account_status;
  v_can_transition boolean;
BEGIN
  -- Get current status
  SELECT status_enum INTO v_current_status
  FROM public.user_accounts
  WHERE user_uuid = p_user_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User account not found: %', p_user_uuid;
  END IF;
  
  -- Check if transition is valid
  v_can_transition := is_valid_user_account_status_transition(v_current_status, p_new_status);
  
  IF NOT v_can_transition THEN
    RAISE EXCEPTION 'Invalid status transition from % to % for user %', 
      v_current_status, p_new_status, p_user_uuid;
  END IF;
  
  -- Perform the transition with audit trail
  UPDATE public.user_accounts
  SET 
    status_enum = p_new_status,
    updated_at = now()
  WHERE user_uuid = p_user_uuid;
  
  -- Log additional details if reason provided
  IF p_reason IS NOT NULL THEN
    PERFORM log_security_event(
      'user_account_status_transition_with_reason',
      (SELECT supabase_user_uuid FROM public.user_accounts WHERE user_uuid = p_user_uuid),
      jsonb_build_object(
        'user_uuid', p_user_uuid,
        'from_status', v_current_status,
        'to_status', p_new_status,
        'reason', p_reason,
        'performed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN TRUE;
END;
$function$;