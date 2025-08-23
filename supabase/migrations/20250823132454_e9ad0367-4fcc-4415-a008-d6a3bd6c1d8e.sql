-- Phase 5.1 Part 3: Complete workflow state management with remaining triggers

-- Create remaining workflow validation trigger functions
CREATE OR REPLACE FUNCTION public.validate_translation_session_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.validate_report_structure_lifecycle_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
      NEW.created_by_supabase_user_uuid,
      jsonb_build_object(
        'structure_uuid', NEW.report_structure_uuid,
        'structure_name', NEW.report_structure_name,
        'old_status', OLD.lifecycle_status,
        'new_status', NEW.lifecycle_status,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply workflow validation triggers to tables
DROP TRIGGER IF EXISTS validate_user_account_status_trigger ON public.user_accounts;
CREATE TRIGGER validate_user_account_status_trigger
  BEFORE UPDATE ON public.user_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_user_account_status_transition();

DROP TRIGGER IF EXISTS validate_translation_session_status_trigger ON public.coa_translation_sessions;
CREATE TRIGGER validate_translation_session_status_trigger
  BEFORE UPDATE ON public.coa_translation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_translation_session_status_transition();

DROP TRIGGER IF EXISTS validate_report_structure_lifecycle_trigger ON public.report_structures;
CREATE TRIGGER validate_report_structure_lifecycle_trigger
  BEFORE UPDATE ON public.report_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_report_structure_lifecycle_transition();

-- Create helper functions for safe status transitions
CREATE OR REPLACE FUNCTION public.transition_user_account_status(
  p_user_account_uuid uuid,
  p_new_status public.user_account_status,
  p_reason text DEFAULT NULL
)
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
  WHERE user_account_uuid = p_user_account_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User account not found: %', p_user_account_uuid;
  END IF;
  
  -- Check if transition is valid
  v_can_transition := is_valid_user_account_status_transition(v_current_status, p_new_status);
  
  IF NOT v_can_transition THEN
    RAISE EXCEPTION 'Invalid status transition from % to % for user %', 
      v_current_status, p_new_status, p_user_account_uuid;
  END IF;
  
  -- Perform the transition with audit trail
  UPDATE public.user_accounts
  SET 
    status_enum = p_new_status,
    updated_at = now()
  WHERE user_account_uuid = p_user_account_uuid;
  
  -- Log additional details if reason provided
  IF p_reason IS NOT NULL THEN
    PERFORM log_security_event(
      'user_account_status_transition_with_reason',
      (SELECT supabase_user_uuid FROM public.user_accounts WHERE user_account_uuid = p_user_account_uuid),
      jsonb_build_object(
        'user_account_uuid', p_user_account_uuid,
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