-- Enhanced User Management Functions

-- Function to safely invite users with proper role assignment
CREATE OR REPLACE FUNCTION public.invite_user_with_role(
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_role app_role DEFAULT 'user',
  p_invited_by_uuid uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM user_accounts WHERE email = p_email) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User with this email already exists'
    );
  END IF;
  
  -- Create user account record with pending status
  INSERT INTO user_accounts (
    email,
    first_name, 
    last_name,
    status,
    status_enum
  ) VALUES (
    p_email,
    p_first_name,
    p_last_name,
    'pending',
    'pending'
  );
  
  -- Log invitation event
  PERFORM log_security_event(
    'user_invited',
    NULL, -- No target user ID yet
    jsonb_build_object(
      'invited_email', p_email,
      'invited_role', p_role,
      'invited_by', p_invited_by_uuid
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User invitation prepared successfully'
  );
END;
$$;

-- Function to bulk update user statuses with validation
CREATE OR REPLACE FUNCTION public.bulk_update_user_status(
  p_user_uuids uuid[],
  p_new_status user_account_status,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_updated_count integer := 0;
  v_failed_count integer := 0;
  v_user_uuid uuid;
  v_current_status user_account_status;
BEGIN
  -- Check permissions
  IF NOT (is_admin_user_v2() OR is_super_admin_user()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions for bulk operations'
    );
  END IF;
  
  -- Process each user
  FOREACH v_user_uuid IN ARRAY p_user_uuids
  LOOP
    -- Get current status
    SELECT status_enum INTO v_current_status 
    FROM user_accounts 
    WHERE user_uuid = v_user_uuid;
    
    -- Validate transition
    IF is_valid_user_account_status_transition(v_current_status, p_new_status) THEN
      -- Update status
      UPDATE user_accounts 
      SET 
        status_enum = p_new_status,
        status = p_new_status::text,
        updated_at = now()
      WHERE user_uuid = v_user_uuid;
      
      -- Log the change
      PERFORM log_security_event(
        'bulk_user_status_update',
        (SELECT supabase_user_uuid FROM user_accounts WHERE user_uuid = v_user_uuid),
        jsonb_build_object(
          'user_uuid', v_user_uuid,
          'from_status', v_current_status,
          'to_status', p_new_status,
          'reason', COALESCE(p_reason, 'Bulk status update'),
          'performed_by', auth.uid()
        )
      );
      
      v_updated_count := v_updated_count + 1;
    ELSE
      v_failed_count := v_failed_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'failed_count', v_failed_count,
    'message', format('Updated %s users, %s failed due to invalid transitions', v_updated_count, v_failed_count)
  );
END;
$$;

-- Function to get enhanced user summary with additional metrics
CREATE OR REPLACE FUNCTION public.get_enhanced_user_management_summary()
RETURNS TABLE(
  total_users bigint,
  active_users bigint,
  pending_users bigint,
  suspended_users bigint,
  total_access_grants bigint,
  recent_invitations bigint,
  entity_admins bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::bigint as total_users,
    COUNT(*) FILTER (WHERE ua.status = 'approved')::bigint as active_users,
    COUNT(*) FILTER (WHERE ua.status = 'pending')::bigint as pending_users,
    COUNT(*) FILTER (WHERE ua.status = 'suspended')::bigint as suspended_users,
    (SELECT COUNT(*) FROM user_entity_access WHERE is_active = true)::bigint as total_access_grants,
    COUNT(*) FILTER (WHERE ua.created_at > now() - interval '7 days')::bigint as recent_invitations,
    (SELECT COUNT(*) FROM user_entity_access WHERE access_level = 'entity_admin' AND is_active = true)::bigint as entity_admins
  FROM user_accounts ua
  WHERE (is_admin_user_v2() OR is_super_admin_user());
END;
$$;

-- Function to get user effective permissions
CREATE OR REPLACE FUNCTION public.get_user_effective_permissions(p_user_uuid uuid)
RETURNS TABLE(
  entity_uuid uuid,
  entity_name text,
  entity_group_uuid uuid,
  entity_group_name text,
  access_level access_level,
  granted_at timestamp with time zone,
  granted_by_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if current user has permission to view these permissions
  IF NOT (is_super_admin_user() OR 
          is_admin_user_v2() OR 
          auth.uid() = (SELECT supabase_user_uuid FROM user_accounts WHERE user_uuid = p_user_uuid)) THEN
    RAISE EXCEPTION 'Insufficient permissions to view user permissions';
  END IF;
  
  RETURN QUERY
  SELECT 
    uea.entity_uuid,
    e.entity_name,
    uea.entity_group_uuid,
    eg.entity_group_name,
    uea.access_level,
    uea.granted_at,
    COALESCE(
      granter.first_name || ' ' || granter.last_name,
      granter.email
    ) as granted_by_name
  FROM user_entity_access uea
  LEFT JOIN entities e ON e.entity_uuid = uea.entity_uuid
  LEFT JOIN entity_groups eg ON eg.entity_group_uuid = uea.entity_group_uuid
  LEFT JOIN user_accounts granter ON granter.user_uuid = uea.granted_by_user_uuid
  WHERE uea.user_account_uuid = p_user_uuid
    AND uea.is_active = true
  ORDER BY uea.granted_at DESC;
END;
$$;

-- Function to check for permission conflicts
CREATE OR REPLACE FUNCTION public.check_permission_conflicts(p_user_uuid uuid)
RETURNS TABLE(
  conflict_type text,
  description text,
  entity_name text,
  access_levels text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check for multiple access levels on same entity
  RETURN QUERY
  SELECT 
    'multiple_entity_access'::text as conflict_type,
    'User has multiple access levels for the same entity'::text as description,
    e.entity_name,
    array_agg(uea.access_level::text ORDER BY uea.granted_at) as access_levels
  FROM user_entity_access uea
  JOIN entities e ON e.entity_uuid = uea.entity_uuid
  WHERE uea.user_account_uuid = p_user_uuid
    AND uea.is_active = true
    AND uea.entity_uuid IS NOT NULL
  GROUP BY e.entity_uuid, e.entity_name
  HAVING COUNT(DISTINCT uea.access_level) > 1;
  
  -- Check for conflicting group vs entity permissions
  RETURN QUERY
  SELECT 
    'group_entity_conflict'::text as conflict_type,
    'User has both group-level and entity-level access that may conflict'::text as description,
    e.entity_name,
    ARRAY['group: ' || group_access.access_level::text, 'entity: ' || entity_access.access_level::text] as access_levels
  FROM user_entity_access entity_access
  JOIN entities e ON e.entity_uuid = entity_access.entity_uuid
  JOIN user_entity_access group_access ON group_access.entity_group_uuid = e.entity_group_uuid
    AND group_access.user_account_uuid = entity_access.user_account_uuid
  WHERE entity_access.user_account_uuid = p_user_uuid
    AND entity_access.is_active = true
    AND group_access.is_active = true
    AND entity_access.entity_uuid IS NOT NULL
    AND group_access.entity_group_uuid IS NOT NULL
    AND entity_access.access_level != group_access.access_level;
END;
$$;

-- Function to revoke all user access (for account deactivation)
CREATE OR REPLACE FUNCTION public.revoke_all_user_access(
  p_user_uuid uuid,
  p_reason text DEFAULT 'Account deactivation'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_revoked_count integer;
BEGIN
  -- Check permissions
  IF NOT (is_admin_user_v2() OR is_super_admin_user()) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions to revoke access'
    );
  END IF;
  
  -- Revoke all active access
  UPDATE user_entity_access 
  SET 
    is_active = false,
    revoked_at = now()
  WHERE user_account_uuid = p_user_uuid 
    AND is_active = true;
    
  GET DIAGNOSTICS v_revoked_count = ROW_COUNT;
  
  -- Log the action
  PERFORM log_security_event(
    'bulk_access_revocation',
    (SELECT supabase_user_uuid FROM user_accounts WHERE user_uuid = p_user_uuid),
    jsonb_build_object(
      'user_uuid', p_user_uuid,
      'revoked_count', v_revoked_count,
      'reason', p_reason,
      'performed_by', auth.uid()
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'revoked_count', v_revoked_count,
    'message', format('Revoked %s access grants', v_revoked_count)
  );
END;
$$;