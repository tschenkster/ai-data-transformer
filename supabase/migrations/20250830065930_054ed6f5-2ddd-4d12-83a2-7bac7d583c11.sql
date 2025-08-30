-- Check and fix any remaining SECURITY DEFINER functions without proper search_path

-- Update is_entity_admin_for_scope function if it exists
CREATE OR REPLACE FUNCTION public.is_entity_admin_for_scope(p_user_uuid uuid, p_entity_uuid uuid, p_entity_group_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is entity admin for the specific entity
  IF p_entity_uuid IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 
      FROM user_entity_access uea
      WHERE uea.user_uuid = p_user_uuid
        AND uea.entity_uuid = p_entity_uuid
        AND uea.is_active = true
        AND uea.access_level = 'entity_admin'
    );
  END IF;
  
  -- Check if user is entity admin for any entity in the group
  IF p_entity_group_uuid IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM user_entity_access uea
      JOIN entities e ON e.entity_uuid = uea.entity_uuid
      WHERE uea.user_uuid = p_user_uuid
        AND e.entity_group_uuid = p_entity_group_uuid
        AND uea.is_active = true
        AND uea.access_level = 'entity_admin'
    );
  END IF;
  
  RETURN false;
END;
$$;