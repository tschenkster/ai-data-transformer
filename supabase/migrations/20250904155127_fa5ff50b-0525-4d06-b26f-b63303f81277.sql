-- Fix SECURITY DEFINER view issue by restructuring access control
-- Drop the problematic view and recreate without SECURITY DEFINER

DROP VIEW IF EXISTS public.security_audit_summary;

-- Create a properly secured view without SECURITY DEFINER
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
  -- Anonymize sensitive details
  CASE 
    WHEN details ? 'email' THEN jsonb_set(details, '{email}', '"[REDACTED]"')
    ELSE details
  END as sanitized_details
FROM security_audit_logs;

-- Apply RLS policy to the view instead
CREATE POLICY "Summary view access for verified super admins"
ON security_audit_summary
FOR SELECT
TO authenticated  
USING (verify_audit_log_access());

-- Enable RLS on the view
ALTER VIEW public.security_audit_summary ENABLE ROW LEVEL SECURITY;

-- Update comments
COMMENT ON VIEW public.security_audit_summary IS 
'Anonymized view of security audit logs with sensitive data redacted. Access controlled via RLS policies requiring super admin verification.';