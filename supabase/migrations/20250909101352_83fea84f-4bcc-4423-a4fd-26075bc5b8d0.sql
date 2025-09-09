-- Fix the Security Definer View issue by removing the problematic view
-- and creating proper security functions instead

-- Drop the security definer view that was flagged as a security risk
DROP VIEW IF EXISTS public.user_profiles_safe;

-- Create secure function for getting user profile data instead of a view
CREATE OR REPLACE FUNCTION public.get_user_profile_safe()
RETURNS TABLE(
    user_uuid uuid,
    email text,
    first_name text,
    last_name text,
    user_status user_account_status,
    created_at timestamp with time zone,
    preferred_ui_language character,
    preferred_content_language character,
    timezone text,
    locale text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_uuid uuid;
BEGIN
    -- Get the user's UUID from their account
    SELECT ua.user_uuid INTO v_user_uuid
    FROM user_accounts ua
    WHERE ua.supabase_user_uuid = auth.uid();

    -- Log access to user profile data
    IF v_user_uuid IS NOT NULL THEN
        PERFORM log_user_data_access(
            v_user_uuid, 
            'profile_view', 
            ARRAY['email', 'first_name', 'last_name', 'user_status']
        );
    END IF;

    -- Return only the user's own profile data (non-sensitive fields)
    RETURN QUERY
    SELECT 
        ua.user_uuid,
        ua.email,
        ua.first_name,
        ua.last_name,
        ua.user_status,
        ua.created_at,
        ua.preferred_ui_language,
        ua.preferred_content_language,
        ua.timezone,
        ua.locale
    FROM user_accounts ua
    WHERE ua.supabase_user_uuid = auth.uid();
END;
$$;

-- Create secure function for admins to get user profile data
CREATE OR REPLACE FUNCTION public.get_all_user_profiles_admin()
RETURNS TABLE(
    user_uuid uuid,
    email text,
    first_name text,
    last_name text,
    user_status user_account_status,
    created_at timestamp with time zone,
    last_login_at timestamp with time zone,
    failed_login_attempts integer,
    preferred_ui_language character,
    preferred_content_language character
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is super admin
    IF NOT is_super_admin_user_secure() THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required';
    END IF;

    -- Log admin access to user data
    INSERT INTO security_audit_logs (
        user_id,
        action,
        details
    ) VALUES (
        auth.uid(),
        'admin_user_data_access',
        jsonb_build_object(
            'access_type', 'bulk_user_profiles',
            'timestamp', now()
        )
    );

    -- Return all user profiles for admin view
    RETURN QUERY
    SELECT 
        ua.user_uuid,
        ua.email,
        ua.first_name,
        ua.last_name,
        ua.user_status,
        ua.created_at,
        ua.last_login_at,
        ua.failed_login_attempts,
        ua.preferred_ui_language,
        ua.preferred_content_language
    FROM user_accounts ua
    ORDER BY ua.created_at DESC;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_profile_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_profiles_admin() TO authenticated;

-- Update the comment on user_accounts table
COMMENT ON TABLE public.user_accounts IS 
'Contains sensitive personal data. Access is strictly controlled by RLS policies. 
All access is logged via security_audit_logs for compliance and security monitoring.
Use get_user_profile_safe() for user self-access.
Use get_all_user_profiles_admin() for admin access.
Use update_own_profile() for secure profile updates.
Direct table access should be avoided in application code.';