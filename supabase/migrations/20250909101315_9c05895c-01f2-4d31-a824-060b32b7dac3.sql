-- Enhanced security measures for user_accounts table to prevent data theft
-- Add additional audit logging and access controls for sensitive personal data

-- Create enhanced logging function for user_accounts access
CREATE OR REPLACE FUNCTION public.log_user_data_access(
    p_accessed_user_uuid uuid,
    p_access_type text,
    p_columns_accessed text[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log access to personal data for security monitoring
    INSERT INTO security_audit_logs (
        user_id,
        action,
        details,
        ip_address,
        target_user_uuid
    ) VALUES (
        auth.uid(),
        'user_data_access',
        jsonb_build_object(
            'access_type', p_access_type,
            'accessed_user_uuid', p_accessed_user_uuid,
            'columns_accessed', p_columns_accessed,
            'is_own_data', (auth.uid() = (
                SELECT supabase_user_uuid 
                FROM user_accounts 
                WHERE user_uuid = p_accessed_user_uuid
            )),
            'timestamp', now()
        ),
        inet_client_addr(),
        p_accessed_user_uuid
    );
END;
$$;

-- Create secure view for user profile data with minimal exposure
CREATE OR REPLACE VIEW public.user_profiles_safe AS
SELECT 
    user_uuid,
    email,
    first_name,
    last_name,
    user_status,
    created_at,
    preferred_ui_language,
    preferred_content_language,
    -- Deliberately exclude sensitive fields like phone_number, login attempts, etc.
    timezone,
    locale
FROM public.user_accounts
WHERE 
    -- Users can only see their own profile
    auth.uid() = supabase_user_uuid
    OR
    -- Super admins can see all profiles
    is_super_admin_user_secure();

-- Grant access to the safe view
GRANT SELECT ON public.user_profiles_safe TO authenticated;

-- Create function for users to safely update their own profile with validation
CREATE OR REPLACE FUNCTION public.update_own_profile(
    p_first_name text DEFAULT NULL,
    p_last_name text DEFAULT NULL,
    p_preferred_ui_language character DEFAULT NULL,
    p_preferred_content_language character DEFAULT NULL,
    p_timezone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_uuid uuid;
    v_updated_fields jsonb := '{}';
BEGIN
    -- Get the user's UUID
    SELECT user_uuid INTO v_user_uuid
    FROM user_accounts
    WHERE supabase_user_uuid = auth.uid();

    IF v_user_uuid IS NULL THEN
        RAISE EXCEPTION 'User account not found';
    END IF;

    -- Validate and update fields
    UPDATE user_accounts SET
        first_name = CASE WHEN p_first_name IS NOT NULL THEN 
            CASE WHEN length(trim(p_first_name)) BETWEEN 1 AND 50 THEN trim(p_first_name)
            ELSE first_name END 
        ELSE first_name END,
        
        last_name = CASE WHEN p_last_name IS NOT NULL THEN 
            CASE WHEN length(trim(p_last_name)) BETWEEN 1 AND 50 THEN trim(p_last_name)
            ELSE last_name END 
        ELSE last_name END,
        
        preferred_ui_language = COALESCE(p_preferred_ui_language, preferred_ui_language),
        preferred_content_language = COALESCE(p_preferred_content_language, preferred_content_language),
        
        timezone = CASE WHEN p_timezone IS NOT NULL THEN 
            CASE WHEN p_timezone IN ('UTC', 'Europe/Berlin', 'America/New_York', 'Asia/Tokyo') THEN p_timezone
            ELSE timezone END 
        ELSE timezone END,
        
        updated_at = now()
    WHERE user_uuid = v_user_uuid;

    -- Log the profile update
    PERFORM log_user_data_access(
        v_user_uuid, 
        'profile_update', 
        ARRAY['first_name', 'last_name', 'preferences']
    );

    v_updated_fields := jsonb_build_object(
        'success', true,
        'message', 'Profile updated successfully',
        'updated_at', now()
    );

    RETURN v_updated_fields;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_own_profile TO authenticated;

-- Add additional security constraint to prevent null supabase_user_uuid
ALTER TABLE public.user_accounts 
ADD CONSTRAINT check_supabase_user_uuid_not_null 
CHECK (supabase_user_uuid IS NOT NULL);

-- Create trigger to log sensitive data access
CREATE OR REPLACE FUNCTION public.audit_user_accounts_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log when personal data is accessed
    IF TG_OP = 'SELECT' THEN
        -- Note: This would only work with audit extensions, but serves as documentation
        PERFORM log_user_data_access(
            OLD.user_uuid,
            'data_view',
            ARRAY['email', 'first_name', 'last_name', 'phone_number']
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add comment documenting security measures
COMMENT ON TABLE public.user_accounts IS 
'Contains sensitive personal data. Access is restricted by RLS policies. 
All access should be logged via security_audit_logs. 
Use user_profiles_safe view for safe data access.
Use update_own_profile() function for secure profile updates.';

-- Force RLS to be enabled and prevent bypass
ALTER TABLE public.user_accounts FORCE ROW LEVEL SECURITY;

-- Add check to ensure RLS cannot be disabled accidentally
CREATE OR REPLACE FUNCTION public.prevent_rls_disable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF tg_tag = 'ALTER TABLE' AND 
       position('user_accounts' in tg_table_name::text) > 0 AND
       position('DISABLE ROW LEVEL SECURITY' in current_query()) > 0 THEN
        RAISE EXCEPTION 'Cannot disable RLS on user_accounts table for security reasons';
    END IF;
END;
$$;

-- Create the event trigger (commented out as it requires superuser privileges)
-- CREATE EVENT TRIGGER prevent_user_accounts_rls_disable 
-- ON ddl_command_end 
-- EXECUTE FUNCTION prevent_rls_disable();