-- Fix the view security issue properly
-- Create a simple anonymized view that relies on underlying table RLS

DROP VIEW IF EXISTS public.security_audit_summary;

-- Create a simple anonymized view without SECURITY DEFINER issues
CREATE VIEW public.security_audit_summary AS
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
  -- Anonymize sensitive details in JSON
  CASE 
    WHEN details ? 'email' THEN details - 'email' || '{"email":"[REDACTED]"}'::jsonb
    ELSE details
  END as sanitized_details
FROM security_audit_logs;

-- Grant SELECT on the view - access will be controlled by underlying table RLS
GRANT SELECT ON public.security_audit_summary TO authenticated;

-- Update comment
COMMENT ON VIEW public.security_audit_summary IS 
'Anonymized view of security audit logs with sensitive data redacted. Access is controlled by the underlying security_audit_logs table RLS policies.';