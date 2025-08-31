-- Safe deletion functions for entities and entity groups
-- Creates RPCs to handle dependencies and support force deletion

-- Function: delete_entity_safe
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

  -- Clean up dependencies
  DELETE FROM public.user_entity_access WHERE entity_uuid = p_entity_uuid;

  -- Delete the entity itself
  DELETE FROM public.entities WHERE entity_uuid = p_entity_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to delete entity'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'entity_name', v_entity_name,
    'message', format('Entity "%s" deleted successfully', v_entity_name)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Function: delete_entity_group_safe
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

  -- Clean up access grants referencing the group or its entities
  DELETE FROM public.user_entity_access uea
  WHERE uea.entity_group_uuid = p_entity_group_uuid
     OR uea.entity_uuid IN (
       SELECT e.entity_uuid FROM public.entities e WHERE e.entity_group_uuid = p_entity_group_uuid
     );

  -- Delete entities in this group
  DELETE FROM public.entities e
  WHERE e.entity_group_uuid = p_entity_group_uuid;

  -- Finally delete the group
  DELETE FROM public.entity_groups eg
  WHERE eg.entity_group_uuid = p_entity_group_uuid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Failed to delete entity group'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'entity_group_name', v_group_name,
    'message', format('Entity group "%s" deleted successfully', v_group_name)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Optional: Allow authenticated users to execute these functions (adjust as needed)
GRANT EXECUTE ON FUNCTION public.delete_entity_safe(uuid, boolean) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.delete_entity_group_safe(uuid, boolean) TO authenticated, anon;