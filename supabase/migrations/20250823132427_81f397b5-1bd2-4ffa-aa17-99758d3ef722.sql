-- Phase 5.1 Part 2: Workflow State Management - Create validation functions and triggers

-- Create workflow transition validation functions
CREATE OR REPLACE FUNCTION public.is_valid_user_account_status_transition(
  p_from_status public.user_account_status,
  p_to_status public.user_account_status
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Define valid state transitions for user accounts
  RETURN CASE 
    WHEN p_from_status IS NULL THEN p_to_status = 'pending' -- Initial state
    WHEN p_from_status = 'pending' THEN p_to_status IN ('approved', 'rejected')
    WHEN p_from_status = 'approved' THEN p_to_status IN ('suspended', 'archived')
    WHEN p_from_status = 'rejected' THEN p_to_status IN ('pending', 'archived')
    WHEN p_from_status = 'suspended' THEN p_to_status IN ('approved', 'archived')
    WHEN p_from_status = 'archived' THEN FALSE -- Terminal state
    ELSE FALSE
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_translation_session_status_transition(
  p_from_status public.translation_session_status,
  p_to_status public.translation_session_status
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Define valid state transitions for translation sessions
  RETURN CASE 
    WHEN p_from_status IS NULL THEN p_to_status = 'pending' -- Initial state
    WHEN p_from_status = 'pending' THEN p_to_status IN ('processing', 'cancelled')
    WHEN p_from_status = 'processing' THEN p_to_status IN ('completed', 'failed', 'paused', 'cancelled')
    WHEN p_from_status = 'paused' THEN p_to_status IN ('processing', 'cancelled')
    WHEN p_from_status = 'completed' THEN FALSE -- Terminal state
    WHEN p_from_status = 'failed' THEN p_to_status IN ('pending', 'processing') -- Allow retry
    WHEN p_from_status = 'cancelled' THEN p_to_status = 'pending' -- Allow restart
    ELSE FALSE
  END;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_valid_report_structure_lifecycle_transition(
  p_from_status public.report_structure_lifecycle_status,
  p_to_status public.report_structure_lifecycle_status
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Define valid state transitions for report structure lifecycle
  RETURN CASE 
    WHEN p_from_status IS NULL THEN p_to_status = 'draft' -- Initial state
    WHEN p_from_status = 'draft' THEN p_to_status IN ('active', 'archived')
    WHEN p_from_status = 'active' THEN p_to_status IN ('inactive', 'deprecated', 'archived')
    WHEN p_from_status = 'inactive' THEN p_to_status IN ('active', 'deprecated', 'archived')
    WHEN p_from_status = 'deprecated' THEN p_to_status IN ('archived')
    WHEN p_from_status = 'archived' THEN FALSE -- Terminal state
    ELSE FALSE
  END;
END;
$function$;

-- Create workflow validation trigger functions
CREATE OR REPLACE FUNCTION public.validate_user_account_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate status_enum transitions if column exists and is being updated
  IF TG_OP = 'UPDATE' AND OLD.status_enum IS DISTINCT FROM NEW.status_enum THEN
    IF NOT is_valid_user_account_status_transition(OLD.status_enum, NEW.status_enum) THEN
      RAISE EXCEPTION 'Invalid user account status transition from % to %', 
        OLD.status_enum, NEW.status_enum;
    END IF;
    
    -- Log the status change
    PERFORM log_security_event(
      'user_account_status_changed',
      NEW.supabase_user_uuid,
      jsonb_build_object(
        'old_status', OLD.status_enum,
        'new_status', NEW.status_enum,
        'user_account_uuid', NEW.user_account_uuid,
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;