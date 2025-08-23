-- Phase 4.1: Database Function Updates - Update all functions to use new column names and tables

-- Update log_structure_change function to use new column names
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
  
  -- Insert the change log entry using new table name
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
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_action text, 
  p_target_user_id uuid DEFAULT NULL::uuid, 
  p_details jsonb DEFAULT NULL::jsonb
)
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
CREATE OR REPLACE FUNCTION public.enhanced_log_security_event(
  p_action text, 
  p_target_user_id uuid DEFAULT NULL::uuid, 
  p_details jsonb DEFAULT NULL::jsonb, 
  p_identifier text DEFAULT NULL::text
)
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