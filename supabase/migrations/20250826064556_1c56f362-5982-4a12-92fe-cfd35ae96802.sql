-- Phase 1: Ensure data consistency between status and status_enum columns
UPDATE user_accounts 
SET status = status_enum::text 
WHERE status != status_enum::text;

-- Phase 2: Rename status_enum to user_status
ALTER TABLE user_accounts 
RENAME COLUMN status_enum TO user_status;

-- Phase 3: Drop the redundant status column
ALTER TABLE user_accounts 
DROP COLUMN status;

-- Phase 4: Update database functions to use user_status

-- Update get_users_by_status function
CREATE OR REPLACE FUNCTION public.get_users_by_status(p_status user_account_status)
 RETURNS TABLE(user_uuid uuid, email text, first_name text, last_name text, user_status user_account_status, created_at timestamp with time zone, updated_at timestamp with time zone)
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
    ua.user_status,
    ua.created_at,
    ua.updated_at
  FROM public.user_accounts ua
  WHERE ua.user_status = p_status
  AND (is_admin_user_v2() OR auth.uid() = ua.supabase_user_uuid)
  ORDER BY ua.updated_at DESC;
END;
$function$;

-- Update transition_user_account_status function
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
  SELECT user_status INTO v_current_status
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
    user_status = p_new_status,
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

-- Update bulk_update_user_status function
CREATE OR REPLACE FUNCTION public.bulk_update_user_status(p_user_uuids uuid[], p_new_status user_account_status, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated_count integer := 0;
  v_failed_count integer := 0;
  v_user_uuid uuid;
  v_current_status user_account_status;
BEGIN
  -- Check permissions
  IF NOT (is_admin_user_v2() OR is_super_admin_user()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions for bulk operations'
    );
  END IF;
  
  -- Process each user
  FOREACH v_user_uuid IN ARRAY p_user_uuids
  LOOP
    -- Get current status
    SELECT user_status INTO v_current_status 
    FROM user_accounts 
    WHERE user_uuid = v_user_uuid;
    
    -- Validate transition
    IF is_valid_user_account_status_transition(v_current_status, p_new_status) THEN
      -- Update status
      UPDATE user_accounts 
      SET 
        user_status = p_new_status,
        updated_at = now()
      WHERE user_uuid = v_user_uuid;
      
      -- Log the change
      PERFORM log_security_event(
        'bulk_user_status_update',
        (SELECT supabase_user_uuid FROM user_accounts WHERE user_uuid = v_user_uuid),
        jsonb_build_object(
          'user_uuid', v_user_uuid,
          'from_status', v_current_status,
          'to_status', p_new_status,
          'reason', COALESCE(p_reason, 'Bulk status update'),
          'performed_by', auth.uid()
        )
      );
      
      v_updated_count := v_updated_count + 1;
    ELSE
      v_failed_count := v_failed_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'failed_count', v_failed_count,
    'message', format('Updated %s users, %s failed due to invalid transitions', v_updated_count, v_failed_count)
  );
END;
$function$;

-- Update get_enhanced_user_management_summary function
CREATE OR REPLACE FUNCTION public.get_enhanced_user_management_summary()
 RETURNS TABLE(total_users bigint, active_users bigint, pending_users bigint, suspended_users bigint, total_access_grants bigint, recent_invitations bigint, entity_admins bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_users,
    COUNT(*) FILTER (WHERE ua.user_status = 'approved')::bigint as active_users,
    COUNT(*) FILTER (WHERE ua.user_status = 'pending')::bigint as pending_users,
    COUNT(*) FILTER (WHERE ua.user_status = 'suspended')::bigint as suspended_users,
    (SELECT COUNT(*) FROM user_entity_access WHERE is_active = true)::bigint as total_access_grants,
    COUNT(*) FILTER (WHERE ua.created_at > now() - interval '7 days')::bigint as recent_invitations,
    (SELECT COUNT(DISTINCT uea.user_uuid) FROM user_entity_access uea WHERE uea.access_level = 'entity_admin' AND uea.is_active = true)::bigint as entity_admins
  FROM user_accounts ua
  WHERE is_admin_user_v2();
END;
$function$;

-- Update get_enhanced_user_summary function
CREATE OR REPLACE FUNCTION public.get_enhanced_user_summary()
 RETURNS TABLE(user_count bigint, active_users bigint, pending_users bigint, total_structures bigint, total_line_items bigint, recent_logins bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as user_count,
    COUNT(*) FILTER (WHERE ua.user_status = 'approved')::bigint as active_users,
    COUNT(*) FILTER (WHERE ua.user_status = 'pending')::bigint as pending_users,
    (SELECT COUNT(*) FROM report_structures)::bigint as total_structures,
    (SELECT COUNT(*) FROM report_line_items)::bigint as total_line_items,
    COUNT(*) FILTER (WHERE ua.last_login_at > now() - interval '7 days')::bigint as recent_logins
  FROM user_accounts ua
  WHERE is_admin_user_v2();
END;
$function$;

-- Update get_user_summary function
CREATE OR REPLACE FUNCTION public.get_user_summary()
 RETURNS TABLE(user_count bigint, active_users bigint, pending_users bigint, total_structures bigint)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    COUNT(*) as user_count,
    COUNT(*) FILTER (WHERE user_status = 'approved') as active_users,
    COUNT(*) FILTER (WHERE user_status = 'pending') as pending_users,
    (SELECT COUNT(*) FROM report_structures) as total_structures
  FROM user_accounts
  WHERE is_admin_user_v2();
$function$;

-- Update get_user_with_roles function
CREATE OR REPLACE FUNCTION public.get_user_with_roles(p_supabase_user_uuid uuid)
 RETURNS TABLE(user_uuid uuid, email text, first_name text, last_name text, user_status text, roles text[], is_admin boolean, is_super_admin boolean)
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
    ua.user_status::text,
    COALESCE(ARRAY_AGG(ur.role ORDER BY ur.role) FILTER (WHERE ur.role IS NOT NULL), '{}')::text[] as roles,
    EXISTS(SELECT 1 FROM user_roles ur2 WHERE ur2.user_uuid = ua.user_uuid AND ur2.role IN ('admin', 'super_admin')) as is_admin,
    EXISTS(SELECT 1 FROM user_roles ur3 WHERE ur3.user_uuid = ua.user_uuid AND ur3.role = 'super_admin') as is_super_admin
  FROM user_accounts ua
  LEFT JOIN user_roles ur ON ur.user_uuid = ua.user_uuid
  WHERE ua.supabase_user_uuid = p_supabase_user_uuid
  GROUP BY ua.user_uuid, ua.email, ua.first_name, ua.last_name, ua.user_status;
END;
$function$;

-- Update get_user_account_by_supabase_uuid function
CREATE OR REPLACE FUNCTION public.get_user_account_by_supabase_uuid(p_supabase_uuid uuid)
 RETURNS TABLE(user_uuid uuid, user_id integer, email text, first_name text, last_name text, user_status text, created_at timestamp with time zone, last_login_at timestamp with time zone, failed_login_attempts integer)
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
    ua.user_status::text,
    ua.created_at,
    ua.last_login_at,
    ua.failed_login_attempts
  FROM public.user_accounts ua
  WHERE ua.supabase_user_uuid = p_supabase_uuid;
END;
$function$;

-- Update audit trigger function
CREATE OR REPLACE FUNCTION public.audit_user_account_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log status changes using new function and table name
  IF TG_OP = 'UPDATE' AND OLD.user_status != NEW.user_status THEN
    PERFORM log_security_event(
      'user_status_changed',
      NEW.supabase_user_uuid,
      jsonb_build_object(
        'old_status', OLD.user_status,
        'new_status', NEW.user_status,
        'user_email', NEW.email,
        'user_uuid', NEW.user_uuid
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update validation trigger function
CREATE OR REPLACE FUNCTION public.validate_user_account_status_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate user_status transitions if column exists and is being updated
  IF TG_OP = 'UPDATE' AND OLD.user_status IS DISTINCT FROM NEW.user_status THEN
    IF NOT is_valid_user_account_status_transition(OLD.user_status, NEW.user_status) THEN
      RAISE EXCEPTION 'Invalid user account status transition from % to %', 
        OLD.user_status, NEW.user_status;
    END IF;
    
    -- Log the status change
    PERFORM log_security_event(
      'user_account_status_changed',
      NEW.supabase_user_uuid,
      jsonb_build_object(
        'old_status', OLD.user_status,
        'new_status', NEW.user_status,
        'user_uuid', NEW.user_uuid,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;