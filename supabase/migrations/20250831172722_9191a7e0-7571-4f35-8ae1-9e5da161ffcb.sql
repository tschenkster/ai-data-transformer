-- Update the safe deletion functions to match frontend expectations

-- Function: delete_entity_safe (updated version)
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
  v_entity_id int;
  v_access_count int := 0;
  v_dependency_count int := 0;
BEGIN
  -- Check if user has permission (super admin only)  
  IF NOT is_super_admin_user() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;

  -- Fetch entity details
  SELECT e.entity_name, e.entity_id
  INTO v_entity_name, v_entity_id
  FROM public.entities e
  WHERE e.entity_uuid = p_entity_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Entity not found'
    );
  END IF;

  -- Count dependencies (user access grants)
  SELECT COUNT(*) INTO v_access_count
  FROM public.user_entity_access uea
  WHERE uea.entity_uuid = p_entity_uuid;

  v_dependency_count := v_access_count;

  -- Block delete unless forced
  IF v_dependency_count > 0 AND NOT p_force_delete THEN
    RETURN jsonb_build_object(
      'success', false,
      'has_dependencies', true,
      'dependency_count', v_dependency_count,
      'access_count', v_access_count,
      'entity_name', v_entity_name,
      'message', format('"%s" has %s user access grant(s). Confirm force delete to remove them and delete the entity.', v_entity_name, v_dependency_count)
    );
  END IF;

  -- Clean up dependencies if force delete
  IF p_force_delete THEN
    DELETE FROM public.user_entity_access WHERE entity_uuid = p_entity_uuid;
  END IF;

  -- Delete the entity itself
  DELETE FROM public.entities WHERE entity_uuid = p_entity_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to delete entity'
    );
  END IF;

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
    'entity_name', v_entity_name,
    'message', format('Entity "%s" deleted successfully', v_entity_name)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function: delete_entity_group_safe (updated version)
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
  v_group_name text;
  v_entity_count int := 0;
  v_access_count int := 0;
  v_total_dependencies int := 0;
BEGIN
  -- Check if user has permission (super admin only)
  IF NOT is_super_admin_user() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions'
    );
  END IF;

  -- Fetch group details
  SELECT eg.entity_group_name
  INTO v_group_name
  FROM public.entity_groups eg
  WHERE eg.entity_group_uuid = p_entity_group_uuid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Entity group not found'
    );
  END IF;

  -- Count dependent entities in the group
  SELECT COUNT(*) INTO v_entity_count
  FROM public.entities e
  WHERE e.entity_group_uuid = p_entity_group_uuid;

  -- Count access grants referencing this group or its entities
  SELECT COUNT(*) INTO v_access_count
  FROM public.user_entity_access uea
  WHERE uea.entity_group_uuid = p_entity_group_uuid
     OR uea.entity_uuid IN (
       SELECT e.entity_uuid FROM public.entities e WHERE e.entity_group_uuid = p_entity_group_uuid
     );

  v_total_dependencies := v_entity_count + v_access_count;

  -- Block delete unless forced
  IF v_total_dependencies > 0 AND NOT p_force_delete THEN
    RETURN jsonb_build_object(
      'success', false,
      'has_dependencies', true,
      'entity_count', v_entity_count,
      'access_count', v_access_count,
      'entity_group_name', v_group_name,
      'message', format('Group "%s" has %s entities and %s access grant(s). Confirm force delete to remove everything.', v_group_name, v_entity_count, v_access_count)
    );
  END IF;

  -- Clean up dependencies if force delete
  IF p_force_delete THEN
    -- Clean up access grants referencing the group or its entities
    DELETE FROM public.user_entity_access uea
    WHERE uea.entity_group_uuid = p_entity_group_uuid
       OR uea.entity_uuid IN (
         SELECT e.entity_uuid FROM public.entities e WHERE e.entity_group_uuid = p_entity_group_uuid
       );

    -- Delete entities in this group
    DELETE FROM public.entities e
    WHERE e.entity_group_uuid = p_entity_group_uuid;
  END IF;

  -- Finally delete the group
  DELETE FROM public.entity_groups eg
  WHERE eg.entity_group_uuid = p_entity_group_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to delete entity group'
    );
  END IF;

  -- Log the deletion
  PERFORM log_security_event(
    'entity_group_deleted',
    auth.uid(),
    jsonb_build_object(
      'entity_group_uuid', p_entity_group_uuid,
      'entity_group_name', v_group_name,
      'force_delete', p_force_delete,
      'entities_removed', v_entity_count,
      'access_grants_removed', v_access_count
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'entity_group_name', v_group_name,
    'message', format('Entity group "%s" deleted successfully', v_group_name)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;