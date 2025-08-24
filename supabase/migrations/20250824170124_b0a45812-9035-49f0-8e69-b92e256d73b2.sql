-- Add unique indexes to support ON CONFLICT in grant_entity_access function

-- First, add unique index for entity-specific access (when entity_uuid is not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entity_access_active_entity
ON user_entity_access (user_account_uuid, entity_uuid) 
WHERE is_active = true AND entity_uuid IS NOT NULL;

-- Add unique index for entity group access (when entity_group_uuid is not null) 
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_entity_access_active_group
ON user_entity_access (user_account_uuid, entity_group_uuid) 
WHERE is_active = true AND entity_group_uuid IS NOT NULL;

-- Update the grant_entity_access function with correct parameter ordering
CREATE OR REPLACE FUNCTION public.grant_entity_access(
  p_user_uuid uuid, 
  p_access_level access_level, 
  p_granted_by_user_uuid uuid,
  p_entity_uuid uuid DEFAULT NULL::uuid, 
  p_entity_group_uuid uuid DEFAULT NULL::uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id integer;
  v_entity_id integer;
  v_entity_group_id integer;
BEGIN
  -- Get the integer IDs
  SELECT user_id INTO v_user_id FROM user_accounts WHERE user_uuid = p_user_uuid;
  
  IF p_entity_uuid IS NOT NULL THEN
    SELECT entity_id INTO v_entity_id FROM entities WHERE entity_uuid = p_entity_uuid;
  END IF;
  
  IF p_entity_group_uuid IS NOT NULL THEN
    SELECT entity_group_id INTO v_entity_group_id FROM entity_groups WHERE entity_group_uuid = p_entity_group_uuid;
  END IF;

  -- Handle entity-specific access
  IF p_entity_uuid IS NOT NULL THEN
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
    ON CONFLICT (user_account_uuid, entity_uuid)
    DO UPDATE SET
      access_level = EXCLUDED.access_level,
      granted_by_user_uuid = EXCLUDED.granted_by_user_uuid,
      granted_at = now();
      
  -- Handle entity group access
  ELSIF p_entity_group_uuid IS NOT NULL THEN
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
    ON CONFLICT (user_account_uuid, entity_group_uuid)
    DO UPDATE SET
      access_level = EXCLUDED.access_level,
      granted_by_user_uuid = EXCLUDED.granted_by_user_uuid,
      granted_at = now();
  ELSE
    RAISE EXCEPTION 'Either entity_uuid or entity_group_uuid must be provided';
  END IF;
  
  -- Log the security event
  PERFORM log_security_event(
    'entity_access_granted',
    (SELECT supabase_user_uuid FROM user_accounts WHERE user_uuid = p_user_uuid),
    jsonb_build_object(
      'target_user_uuid', p_user_uuid,
      'entity_uuid', p_entity_uuid,
      'entity_group_uuid', p_entity_group_uuid,
      'access_level', p_access_level,
      'granted_by', p_granted_by_user_uuid
    )
  );
  
  RETURN true;
END;
$function$;