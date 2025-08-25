-- Fix grant_entity_access function with correct ON CONFLICT clauses
CREATE OR REPLACE FUNCTION public.grant_entity_access(p_user_uuid uuid, p_entity_uuid uuid, p_access_level access_level, p_granted_by_user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id integer;
  v_entity_id integer;
BEGIN
  -- Get the integer IDs
  SELECT user_id INTO v_user_id FROM user_accounts WHERE user_uuid = p_user_uuid;
  SELECT entity_id INTO v_entity_id FROM entities WHERE entity_uuid = p_entity_uuid;
  
  -- First, try to reactivate any existing inactive record
  UPDATE user_entity_access 
  SET 
    is_active = true,
    access_level = p_access_level,
    granted_by_user_uuid = p_granted_by_user_uuid,
    granted_at = now(),
    revoked_at = null
  WHERE user_account_uuid = p_user_uuid 
    AND entity_uuid = p_entity_uuid 
    AND is_active = false;
  
  -- If no inactive record was updated, insert new record
  IF NOT FOUND THEN
    INSERT INTO user_entity_access (
      user_account_uuid,
      user_account_id,
      entity_uuid,
      entity_id,
      access_level,
      granted_by_user_uuid
    ) VALUES (
      p_user_uuid,
      v_user_id,
      p_entity_uuid,
      v_entity_id,
      p_access_level,
      p_granted_by_user_uuid
    )
    ON CONFLICT (user_account_uuid, entity_uuid) WHERE is_active = true
    DO UPDATE SET
      access_level = EXCLUDED.access_level,
      granted_by_user_uuid = EXCLUDED.granted_by_user_uuid,
      granted_at = now();
  END IF;
  
  -- Log the security event
  PERFORM log_security_event(
    'entity_access_granted',
    (SELECT supabase_user_uuid FROM user_accounts WHERE user_uuid = p_user_uuid),
    jsonb_build_object(
      'target_user_uuid', p_user_uuid,
      'entity_uuid', p_entity_uuid,
      'access_level', p_access_level,
      'granted_by', p_granted_by_user_uuid
    )
  );
  
  RETURN true;
END;
$function$;

-- Also create a similar function for entity group access
CREATE OR REPLACE FUNCTION public.grant_entity_group_access(p_user_uuid uuid, p_entity_group_uuid uuid, p_access_level access_level, p_granted_by_user_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id integer;
  v_entity_group_id integer;
BEGIN
  -- Get the integer IDs
  SELECT user_id INTO v_user_id FROM user_accounts WHERE user_uuid = p_user_uuid;
  SELECT entity_group_id INTO v_entity_group_id FROM entity_groups WHERE entity_group_uuid = p_entity_group_uuid;
  
  -- First, try to reactivate any existing inactive record
  UPDATE user_entity_access 
  SET 
    is_active = true,
    access_level = p_access_level,
    granted_by_user_uuid = p_granted_by_user_uuid,
    granted_at = now(),
    revoked_at = null
  WHERE user_account_uuid = p_user_uuid 
    AND entity_group_uuid = p_entity_group_uuid 
    AND is_active = false;
  
  -- If no inactive record was updated, insert new record
  IF NOT FOUND THEN
    INSERT INTO user_entity_access (
      user_account_uuid,
      user_account_id,
      entity_group_uuid,
      entity_group_id,
      access_level,
      granted_by_user_uuid
    ) VALUES (
      p_user_uuid,
      v_user_id,
      p_entity_group_uuid,
      v_entity_group_id,
      p_access_level,
      p_granted_by_user_uuid
    )
    ON CONFLICT (user_account_uuid, entity_group_uuid) WHERE is_active = true
    DO UPDATE SET
      access_level = EXCLUDED.access_level,
      granted_by_user_uuid = EXCLUDED.granted_by_user_uuid,
      granted_at = now();
  END IF;
  
  -- Log the security event
  PERFORM log_security_event(
    'entity_group_access_granted',
    (SELECT supabase_user_uuid FROM user_accounts WHERE user_uuid = p_user_uuid),
    jsonb_build_object(
      'target_user_uuid', p_user_uuid,
      'entity_group_uuid', p_entity_group_uuid,
      'access_level', p_access_level,
      'granted_by', p_granted_by_user_uuid
    )
  );
  
  RETURN true;
END;
$function$;