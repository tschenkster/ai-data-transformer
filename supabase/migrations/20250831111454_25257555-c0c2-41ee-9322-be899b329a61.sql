-- Drop all existing security functions first
DROP FUNCTION IF EXISTS public.enhanced_check_rate_limit(text, text, integer, integer);
DROP FUNCTION IF EXISTS public.enhanced_log_security_event(text, uuid, jsonb, inet, text);
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, jsonb);
DROP FUNCTION IF EXISTS public.log_security_event_enhanced(text, uuid, jsonb, inet, text);
DROP FUNCTION IF EXISTS public.check_rate_limit(text, text, integer, integer);

-- Create enhanced_check_rate_limit function with proper security
CREATE FUNCTION public.enhanced_check_rate_limit(operation_type text, identifier text, max_attempts integer DEFAULT 5, window_minutes integer DEFAULT 15)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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

-- Create log_security_event function with proper security
CREATE FUNCTION public.log_security_event(p_action text, p_target_user_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
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
  );
END;
$function$;

-- Create enhanced_log_security_event function with proper security
CREATE FUNCTION public.enhanced_log_security_event(p_action text, p_target_user_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    target_user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    p_action,
    p_target_user_id,
    p_details,
    p_ip_address,
    p_user_agent
  ) RETURNING security_audit_log_uuid INTO v_log_id;
  
  RETURN v_log_id;
END;
$function$;

-- Add enhanced input validation function
CREATE FUNCTION public.validate_user_input(input_data jsonb, validation_rules jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  field_name text;
  field_value text;
  rule jsonb;
BEGIN
  -- Validate each field according to rules
  FOR field_name, rule IN SELECT * FROM jsonb_each(validation_rules) LOOP
    field_value := input_data ->> field_name;
    
    -- Check required fields
    IF (rule ->> 'required')::boolean = true AND (field_value IS NULL OR field_value = '') THEN
      RETURN false;
    END IF;
    
    -- Check max length
    IF rule ? 'maxLength' AND length(field_value) > (rule ->> 'maxLength')::integer THEN
      RETURN false;
    END IF;
    
    -- Check pattern (basic regex-like validation)
    IF rule ? 'pattern' AND field_value IS NOT NULL THEN
      CASE rule ->> 'pattern'
        WHEN 'email' THEN
          IF field_value !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
            RETURN false;
          END IF;
        WHEN 'alphanumeric' THEN
          IF field_value !~ '^[A-Za-z0-9]+$' THEN
            RETURN false;
          END IF;
        WHEN 'no_special_chars' THEN
          IF field_value ~ '[<>"\''&]' THEN
            RETURN false;
          END IF;
      END CASE;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$function$;