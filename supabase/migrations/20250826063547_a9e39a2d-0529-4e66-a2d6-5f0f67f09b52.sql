-- Fix trigger functions to use user_uuid instead of user_account_uuid

-- Update the audit_user_account_changes function
CREATE OR REPLACE FUNCTION public.audit_user_account_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log status changes using new function and table name
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM log_security_event(
      'user_status_changed',
      NEW.supabase_user_uuid,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'user_email', NEW.email,
        'user_uuid', NEW.user_uuid  -- Changed from user_account_uuid
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the validate_user_account_status_transition function  
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
        'user_uuid', NEW.user_uuid,  -- Changed from user_account_uuid
        'changed_by', auth.uid()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;