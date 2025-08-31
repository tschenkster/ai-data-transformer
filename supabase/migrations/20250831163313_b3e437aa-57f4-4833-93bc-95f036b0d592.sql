-- Create safe entity deletion function
CREATE OR REPLACE FUNCTION public.delete_entity_safe(
  p_entity_uuid uuid,
  p_force_delete boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_entity_name text;
  v_dependency_count integer;
  v_result jsonb;
BEGIN
  -- Check if user has permission (super admin only)
  IF NOT is_super_admin_user() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions. Super admin access required.'
    );
  END IF;

  -- Get entity details
  SELECT entity_name INTO v_entity_name
  FROM entities 
  WHERE entity_uuid = p_entity_uuid;

  IF v_entity_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Entity not found.'
    );
  END IF;

  -- Check for dependencies
  SELECT COUNT(*) INTO v_dependency_count
  FROM user_entity_access 
  WHERE entity_uuid = p_entity_uuid AND is_active = true;

  -- If there are dependencies and force_delete is false, return dependency info
  IF v_dependency_count > 0 AND NOT p_force_delete THEN
    RETURN jsonb_build_object(
      'success', false,
      'has_dependencies', true,
      'dependency_count', v_dependency_count,
      'entity_name', v_entity_name,
      'message', format('Entity "%s" has %s active user access grants. Force delete to remove all dependencies.', v_entity_name, v_dependency_count)
    );
  END IF;

  -- If force_delete is true, remove dependencies first
  IF p_force_delete AND v_dependency_count > 0 THEN
    DELETE FROM user_entity_access WHERE entity_uuid = p_entity_uuid;
  END IF;

  -- Delete the entity
  DELETE FROM entities WHERE entity_uuid = p_entity_uuid;

  -- Log the deletion
  PERFORM log_security_event(
    'entity_deleted',
    auth.uid(),
    jsonb_build_object(
      'entity_uuid', p_entity_uuid,
      'entity_name', v_entity_name,
      'force_delete', p_force_delete,
      'dependencies_removed', v_dependency_count
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Entity "%s" deleted successfully.', v_entity_name),
    'dependencies_removed', v_dependency_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Failed to delete entity: %s', SQLERRM)
    );
END;
$$;

-- Create safe entity group deletion function
CREATE OR REPLACE FUNCTION public.delete_entity_group_safe(
  p_entity_group_uuid uuid,
  p_force_delete boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_entity_group_name text;
  v_entity_count integer;
  v_access_count integer;
  v_total_dependencies integer;
  v_result jsonb;
BEGIN
  -- Check if user has permission (super admin only)
  IF NOT is_super_admin_user() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions. Super admin access required.'
    );
  END IF;

  -- Get entity group details
  SELECT entity_group_name INTO v_entity_group_name
  FROM entity_groups 
  WHERE entity_group_uuid = p_entity_group_uuid;

  IF v_entity_group_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Entity group not found.'
    );
  END IF;

  -- Check for dependencies
  SELECT COUNT(*) INTO v_entity_count
  FROM entities 
  WHERE entity_group_uuid = p_entity_group_uuid AND is_active = true;

  SELECT COUNT(*) INTO v_access_count
  FROM user_entity_access 
  WHERE entity_group_uuid = p_entity_group_uuid AND is_active = true;

  v_total_dependencies := v_entity_count + v_access_count;

  -- If there are dependencies and force_delete is false, return dependency info
  IF v_total_dependencies > 0 AND NOT p_force_delete THEN
    RETURN jsonb_build_object(
      'success', false,
      'has_dependencies', true,
      'entity_count', v_entity_count,
      'access_count', v_access_count,
      'total_dependencies', v_total_dependencies,
      'entity_group_name', v_entity_group_name,
      'message', format('Entity group "%s" has %s entities and %s user access grants. Force delete to remove all dependencies.', v_entity_group_name, v_entity_count, v_access_count)
    );
  END IF;

  -- If force_delete is true, remove dependencies first
  IF p_force_delete AND v_total_dependencies > 0 THEN
    -- Delete user access grants first
    DELETE FROM user_entity_access WHERE entity_group_uuid = p_entity_group_uuid;
    
    -- Delete entities in this group
    DELETE FROM entities WHERE entity_group_uuid = p_entity_group_uuid;
  END IF;

  -- Delete the entity group
  DELETE FROM entity_groups WHERE entity_group_uuid = p_entity_group_uuid;

  -- Log the deletion
  PERFORM log_security_event(
    'entity_group_deleted',
    auth.uid(),
    jsonb_build_object(
      'entity_group_uuid', p_entity_group_uuid,
      'entity_group_name', v_entity_group_name,
      'force_delete', p_force_delete,
      'entities_removed', v_entity_count,
      'access_grants_removed', v_access_count
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Entity group "%s" deleted successfully.', v_entity_group_name),
    'entities_removed', v_entity_count,
    'access_grants_removed', v_access_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Failed to delete entity group: %s', SQLERRM)
    );
END;
$$;