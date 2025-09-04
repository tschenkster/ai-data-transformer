-- Fix any remaining functions missing search_path security setting
-- Check and update all remaining security definer functions

-- Fix ensure_single_active_structure function
CREATE OR REPLACE FUNCTION public.ensure_single_active_structure()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.report_structures 
    SET is_active = false 
    WHERE report_structure_id != NEW.report_structure_id 
    AND is_active = true;
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix enforce_node_limit function
CREATE OR REPLACE FUNCTION public.enforce_node_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF (SELECT COUNT(*) FROM public.report_line_items WHERE report_structure_id = NEW.report_structure_id) >= 300 THEN
    RAISE EXCEPTION 'Report structure cannot exceed 300 nodes. Current structure has reached the maximum limit.';
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix audit_user_account_changes function
CREATE OR REPLACE FUNCTION public.audit_user_account_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

-- Fix prevent_self_role_escalation function
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Prevent users from updating their own roles unless they are super admin
  IF TG_OP = 'UPDATE' AND OLD.user_id = auth.uid() THEN
    IF NOT is_super_admin_user_secure() THEN
      RAISE EXCEPTION 'Users cannot modify their own roles';
    END IF;
  END IF;
  
  -- Log role changes for audit
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM enhanced_log_security_event(
      'user_role_changed',
      NEW.user_id,
      jsonb_build_object(
        'old_role', CASE WHEN TG_OP = 'UPDATE' THEN OLD.role ELSE NULL END,
        'new_role', NEW.role,
        'target_user_uuid', NEW.user_uuid
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix validate_translation_session_status_transition function
CREATE OR REPLACE FUNCTION public.validate_translation_session_status_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Validate status_enum transitions if column exists and is being updated
  IF TG_OP = 'UPDATE' AND OLD.status_enum IS DISTINCT FROM NEW.status_enum THEN
    IF NOT is_valid_translation_session_status_transition(OLD.status_enum, NEW.status_enum) THEN
      RAISE EXCEPTION 'Invalid translation session status transition from % to %', 
        OLD.status_enum, NEW.status_enum;
    END IF;
    
    -- Log the status change for audit
    PERFORM log_security_event(
      'translation_session_status_changed',
      NEW.user_id,
      jsonb_build_object(
        'session_uuid', NEW.coa_translation_session_uuid,
        'old_status', OLD.status_enum,
        'new_status', NEW.status_enum,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix validate_report_structure_lifecycle_transition function  
CREATE OR REPLACE FUNCTION public.validate_report_structure_lifecycle_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Validate lifecycle_status transitions if column exists and is being updated
  IF TG_OP = 'UPDATE' AND OLD.lifecycle_status IS DISTINCT FROM NEW.lifecycle_status THEN
    IF NOT is_valid_report_structure_lifecycle_transition(OLD.lifecycle_status, NEW.lifecycle_status) THEN
      RAISE EXCEPTION 'Invalid report structure lifecycle transition from % to %', 
        OLD.lifecycle_status, NEW.lifecycle_status;
    END IF;
    
    -- Log the status change for audit
    PERFORM log_security_event(
      'report_structure_lifecycle_changed',
      auth.uid(),
      jsonb_build_object(
        'structure_uuid', NEW.report_structure_uuid,
        'old_status', OLD.lifecycle_status,
        'new_status', NEW.lifecycle_status,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;