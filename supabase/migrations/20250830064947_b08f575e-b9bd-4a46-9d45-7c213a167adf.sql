-- Remove hardcoded admin credentials and strengthen security

-- 1. Create enhanced admin check functions that use roles instead of hardcoded emails
CREATE OR REPLACE FUNCTION public.is_super_admin_user_secure()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- 2. Create function to check if user can delete other users (super admins only)
CREATE OR REPLACE FUNCTION public.can_delete_users()
RETURNS boolean
LANGUAGE sql
STABLE  
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT is_super_admin_user_secure();
$$;

-- 3. Create function to check if target user is deletable (prevent deletion of other super admins)
CREATE OR REPLACE FUNCTION public.is_user_deletable(target_user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER  
SET search_path = 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.user_accounts ua ON ua.supabase_user_uuid = ur.user_id
    WHERE ua.user_uuid = target_user_uuid 
    AND ur.role = 'super_admin'
  );
$$;

-- 4. Enhanced security audit logging with IP tracking
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
  p_action text,
  p_target_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 5. Add constraint to prevent users from updating their own roles
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Prevent users from updating their own roles unless they are super admin
  IF TG_OP = 'UPDATE' AND OLD.user_id = auth.uid() THEN
    IF NOT is_super_admin_user_secure() THEN
      RAISE EXCEPTION 'Users cannot modify their own roles';
    END IF;
  END IF;
  
  -- Log role changes for audit
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    PERFORM log_security_event_enhanced(
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
$$;

-- 6. Apply the trigger to user_roles table
DROP TRIGGER IF EXISTS prevent_self_role_escalation_trigger ON public.user_roles;
CREATE TRIGGER prevent_self_role_escalation_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_escalation();

-- 7. Enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_user_input(input_text text, max_length integer DEFAULT 1000)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
AS $$
BEGIN
  -- Basic XSS prevention and length validation
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF length(input_text) > max_length THEN
    RAISE EXCEPTION 'Input exceeds maximum length of %', max_length;
  END IF;
  
  -- Remove potential XSS patterns (basic protection)
  RETURN regexp_replace(
    regexp_replace(input_text, '<[^>]*>', '', 'g'),
    '(javascript:|data:|vbscript:)', '', 'gi'
  );
END;
$$;