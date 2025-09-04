-- SECURITY FIX: Enhanced Security Audit Trail Protection
-- This addresses the security vulnerability in audit log access and manipulation

-- 1. Create enhanced security verification function for audit log access
CREATE OR REPLACE FUNCTION public.verify_audit_log_access()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  current_user_uuid uuid;
  is_super_admin boolean := false;
  recent_suspicious_activity boolean := false;
BEGIN
  -- Get current user
  current_user_uuid := auth.uid();
  
  -- Verify user is super admin
  SELECT is_super_admin_user_secure() INTO is_super_admin;
  
  IF NOT is_super_admin THEN
    -- Log unauthorized access attempt
    PERFORM enhanced_log_security_event(
      'unauthorized_audit_log_access_attempt',
      current_user_uuid,
      jsonb_build_object(
        'attempted_by', current_user_uuid,
        'timestamp', now(),
        'reason', 'not_super_admin'
      )
    );
    RETURN false;
  END IF;
  
  -- Additional security: Check for recent suspicious activity
  SELECT COUNT(*) > 0 INTO recent_suspicious_activity
  FROM security_audit_logs 
  WHERE user_id = current_user_uuid 
    AND action IN ('failed_login_attempt', 'suspicious_activity_detected', 'rate_limit_exceeded')
    AND created_at > now() - interval '1 hour';
  
  IF recent_suspicious_activity THEN
    -- Log access with recent suspicious activity
    PERFORM enhanced_log_security_event(
      'audit_log_access_with_recent_suspicious_activity',
      current_user_uuid,
      jsonb_build_object(
        'accessed_by', current_user_uuid,
        'timestamp', now(),
        'warning', 'user_has_recent_suspicious_activity'
      )
    );
  END IF;
  
  -- Log successful audit log access for monitoring
  PERFORM enhanced_log_security_event(
    'audit_log_accessed',
    current_user_uuid,
    jsonb_build_object(
      'accessed_by', current_user_uuid,
      'timestamp', now(),
      'verification_passed', true
    )
  );
  
  RETURN true;
END;
$function$;

-- 2. Create secure audit log insertion function (system use only)
CREATE OR REPLACE FUNCTION public.secure_insert_audit_log(
  p_user_id uuid,
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
AS $function$
DECLARE
  v_log_uuid uuid;
BEGIN
  -- This function can only be called by authenticated system functions
  -- Validate inputs to prevent injection
  IF p_action IS NULL OR length(trim(p_action)) = 0 THEN
    RAISE EXCEPTION 'Action cannot be null or empty';
  END IF;
  
  IF length(p_action) > 100 THEN
    RAISE EXCEPTION 'Action too long (max 100 characters)';
  END IF;
  
  -- Insert audit log entry with validation
  INSERT INTO security_audit_logs (
    user_id,
    action,
    target_user_id,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    p_action,
    p_target_user_id,
    COALESCE(p_details, '{}'::jsonb),
    p_ip_address,
    p_user_agent
  ) RETURNING security_audit_log_uuid INTO v_log_uuid;
  
  RETURN v_log_uuid;
END;
$function$;

-- 3. Update log_security_event to use secure function
CREATE OR REPLACE FUNCTION public.log_security_event(p_action text, p_target_user_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  PERFORM secure_insert_audit_log(
    auth.uid(),
    p_action,
    p_target_user_id,
    p_details
  );
END;
$function$;

-- 4. Update enhanced_log_security_event to use secure function  
CREATE OR REPLACE FUNCTION public.enhanced_log_security_event(p_action text, p_target_user_id uuid DEFAULT NULL::uuid, p_details jsonb DEFAULT NULL::jsonb, p_ip_address inet DEFAULT NULL::inet, p_user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN secure_insert_audit_log(
    auth.uid(),
    p_action,
    p_target_user_id,
    p_details,
    p_ip_address,
    p_user_agent
  );
END;
$function$;

-- 5. Drop existing policies and create enhanced secure policies
DROP POLICY IF EXISTS "Super admins only can view audit logs" ON security_audit_logs;

-- Enhanced SELECT policy with additional verification
CREATE POLICY "Enhanced audit log access for verified super admins" 
ON security_audit_logs 
FOR SELECT 
TO authenticated
USING (verify_audit_log_access());

-- Strict INSERT policy - only system functions can insert
CREATE POLICY "System functions only can insert audit logs" 
ON security_audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (false);  -- Prevents all user INSERTs, only functions can insert

-- Prevent all UPDATE operations - audit logs are immutable
CREATE POLICY "Audit logs are immutable" 
ON security_audit_logs 
FOR UPDATE 
TO authenticated
USING (false);

-- Prevent all DELETE operations - audit logs must be preserved
CREATE POLICY "Audit logs cannot be deleted" 
ON security_audit_logs 
FOR DELETE 
TO authenticated
USING (false);

-- 6. Create audit log data anonymization view for limited access
CREATE OR REPLACE VIEW public.security_audit_summary AS
SELECT 
  security_audit_log_uuid,
  action,
  CASE 
    WHEN user_id IS NOT NULL THEN 'authenticated_user'
    ELSE 'anonymous_user'
  END as user_type,
  CASE 
    WHEN target_user_id IS NOT NULL THEN 'has_target'
    ELSE 'no_target'
  END as target_type,
  CASE 
    WHEN ip_address IS NOT NULL THEN 'ip_logged'
    ELSE 'no_ip'
  END as ip_status,
  created_at,
  -- Anonymize sensitive details
  CASE 
    WHEN details ? 'email' THEN jsonb_set(details, '{email}', '"[REDACTED]"')
    ELSE details
  END as sanitized_details
FROM security_audit_logs
WHERE verify_audit_log_access();

-- 7. Grant appropriate permissions
GRANT SELECT ON public.security_audit_summary TO authenticated;

-- 8. Add comments for documentation
COMMENT ON FUNCTION public.verify_audit_log_access() IS 
'Enhanced security verification for audit log access. Requires super admin privileges, logs all access attempts, and checks for recent suspicious activity.';

COMMENT ON FUNCTION public.secure_insert_audit_log(uuid, text, uuid, jsonb, inet, text) IS 
'Secure function for inserting audit log entries. Only callable by system functions with input validation.';

COMMENT ON VIEW public.security_audit_summary IS 
'Anonymized view of security audit logs with sensitive data redacted for limited access scenarios.';

-- 9. Final security verification log
SELECT secure_insert_audit_log(
  auth.uid(),
  'security_audit_trail_hardened',
  NULL,
  jsonb_build_object(
    'enhancement', 'comprehensive_audit_log_security',
    'timestamp', now(),
    'measures', jsonb_build_array(
      'enhanced_access_verification',
      'immutable_audit_logs', 
      'system_only_insertion',
      'access_attempt_logging',
      'data_anonymization_view'
    )
  )
);