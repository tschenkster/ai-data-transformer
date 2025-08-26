-- Fix field name inconsistency between user_accounts and user_entity_access tables
-- Rename columns in user_entity_access to match user_accounts naming convention

-- First, drop the existing unique constraints and indexes that reference the old column names
ALTER TABLE user_entity_access DROP CONSTRAINT IF EXISTS unique_active_entity_access;
ALTER TABLE user_entity_access DROP CONSTRAINT IF EXISTS unique_active_entity_group_access;
DROP INDEX IF EXISTS idx_user_entity_access_user_account;
DROP INDEX IF EXISTS idx_user_entity_access_entity;
DROP INDEX IF EXISTS idx_user_entity_access_entity_group;

-- Rename the columns
ALTER TABLE user_entity_access RENAME COLUMN user_account_uuid TO user_uuid;
ALTER TABLE user_entity_access RENAME COLUMN user_account_id TO user_id;

-- Recreate the unique constraints with new column names
ALTER TABLE user_entity_access ADD CONSTRAINT unique_active_entity_access 
  UNIQUE (user_uuid, entity_uuid) WHERE is_active = true AND entity_uuid IS NOT NULL;

ALTER TABLE user_entity_access ADD CONSTRAINT unique_active_entity_group_access 
  UNIQUE (user_uuid, entity_group_uuid) WHERE is_active = true AND entity_group_uuid IS NOT NULL;

-- Recreate indexes with new column names
CREATE INDEX idx_user_entity_access_user ON user_entity_access (user_uuid);
CREATE INDEX idx_user_entity_access_entity ON user_entity_access (entity_uuid);
CREATE INDEX idx_user_entity_access_entity_group ON user_entity_access (entity_group_uuid);

-- Update the grant_entity_access function to use new field names
CREATE OR REPLACE FUNCTION public.grant_entity_access(p_user_uuid uuid, p_access_level access_level, p_granted_by_user_uuid uuid, p_entity_uuid uuid DEFAULT NULL::uuid, p_entity_group_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id int;
  v_entity_id int;
  v_entity_group_id int;
BEGIN
  -- Validate parameters: exactly one of entity or group must be provided
  IF (p_entity_uuid IS NULL AND p_entity_group_uuid IS NULL)
     OR (p_entity_uuid IS NOT NULL AND p_entity_group_uuid IS NOT NULL) THEN
    RAISE EXCEPTION 'Provide exactly one of p_entity_uuid or p_entity_group_uuid';
  END IF;

  -- Fetch the user_id (int) for denormalized storage
  SELECT ua.user_id INTO v_user_id
  FROM public.user_accounts ua
  WHERE ua.user_uuid = p_user_uuid;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found for user_uuid=%', p_user_uuid;
  END IF;

  IF p_entity_uuid IS NOT NULL THEN
    -- Entity path
    SELECT e.entity_id INTO v_entity_id
    FROM public.entities e
    WHERE e.entity_uuid = p_entity_uuid;

    IF v_entity_id IS NULL THEN
      RAISE EXCEPTION 'Entity not found for entity_uuid=%', p_entity_uuid;
    END IF;

    -- Reactivate inactive, if present
    UPDATE public.user_entity_access
    SET is_active = true,
        access_level = p_access_level,
        granted_by_user_uuid = p_granted_by_user_uuid,
        granted_at = now(),
        revoked_at = NULL
    WHERE user_uuid = p_user_uuid
      AND entity_uuid = p_entity_uuid
      AND is_active = false;

    IF NOT FOUND THEN
      -- Insert or upsert on active entity grant (predicate must match the unique partial index)
      INSERT INTO public.user_entity_access (
        user_uuid,
        user_id,
        entity_uuid,
        entity_id,
        access_level,
        granted_by_user_uuid
      )
      VALUES (
        p_user_uuid,
        v_user_id,
        p_entity_uuid,
        v_entity_id,
        p_access_level,
        p_granted_by_user_uuid
      )
      ON CONFLICT (user_uuid, entity_uuid)
      WHERE is_active = true AND entity_uuid IS NOT NULL
      DO UPDATE SET
        access_level = EXCLUDED.access_level,
        granted_by_user_uuid = EXCLUDED.granted_by_user_uuid,
        granted_at = now();
    END IF;

    PERFORM public.log_security_event(
      'entity_access_granted',
      (SELECT supabase_user_uuid FROM public.user_accounts WHERE user_uuid = p_user_uuid),
      jsonb_build_object(
        'target_user_uuid', p_user_uuid,
        'entity_uuid', p_entity_uuid,
        'access_level', p_access_level,
        'granted_by', p_granted_by_user_uuid
      )
    );

  ELSE
    -- Entity group path
    SELECT eg.entity_group_id INTO v_entity_group_id
    FROM public.entity_groups eg
    WHERE eg.entity_group_uuid = p_entity_group_uuid;

    IF v_entity_group_id IS NULL THEN
      RAISE EXCEPTION 'Entity group not found for entity_group_uuid=%', p_entity_group_uuid;
    END IF;

    -- Reactivate inactive, if present
    UPDATE public.user_entity_access
    SET is_active = true,
        access_level = p_access_level,
        granted_by_user_uuid = p_granted_by_user_uuid,
        granted_at = now(),
        revoked_at = NULL
    WHERE user_uuid = p_user_uuid
      AND entity_group_uuid = p_entity_group_uuid
      AND is_active = false;

    IF NOT FOUND THEN
      -- Insert or upsert on active group grant (predicate must match the unique partial index)
      INSERT INTO public.user_entity_access (
        user_uuid,
        user_id,
        entity_group_uuid,
        entity_group_id,
        access_level,
        granted_by_user_uuid
      )
      VALUES (
        p_user_uuid,
        v_user_id,
        p_entity_group_uuid,
        v_entity_group_id,
        p_access_level,
        p_granted_by_user_uuid
      )
      ON CONFLICT (user_uuid, entity_group_uuid)
      WHERE is_active = true AND entity_group_uuid IS NOT NULL
      DO UPDATE SET
        access_level = EXCLUDED.access_level,
        granted_by_user_uuid = EXCLUDED.granted_by_user_uuid,
        granted_at = now();
    END IF;

    PERFORM public.log_security_event(
      'entity_group_access_granted',
      (SELECT supabase_user_uuid FROM public.user_accounts WHERE user_uuid = p_user_uuid),
      jsonb_build_object(
        'target_user_uuid', p_user_uuid,
        'entity_group_uuid', p_entity_group_uuid,
        'access_level', p_access_level,
        'granted_by', p_granted_by_user_uuid
      )
    );
  END IF;

  RETURN true;
END;
$function$;

-- Update the user_has_entity_access function
CREATE OR REPLACE FUNCTION public.user_has_entity_access(p_user_uuid uuid, p_entity_uuid uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Super admins have access to all entities
  IF is_super_admin_user() THEN
    RETURN true;
  END IF;
  
  -- Check if user has direct access to the entity
  RETURN EXISTS (
    SELECT 1 
    FROM user_entity_access uea
    WHERE uea.user_uuid = p_user_uuid
    AND uea.entity_uuid = p_entity_uuid
    AND uea.is_active = true
  );
END;
$function$;

-- Update the get_user_accessible_entities function
CREATE OR REPLACE FUNCTION public.get_user_accessible_entities(p_user_uuid uuid)
 RETURNS TABLE(entity_uuid uuid, entity_name text, entity_code text, access_level text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Super admins can see all entities
  IF is_super_admin_user() THEN
    RETURN QUERY
    SELECT e.entity_uuid, e.entity_name, e.entity_code, 'super_admin'::text as access_level
    FROM entities e
    WHERE e.is_active = true
    ORDER BY e.entity_name;
  ELSE
    -- Regular users see only entities they have access to
    RETURN QUERY
    SELECT e.entity_uuid, e.entity_name, e.entity_code, uea.access_level::text
    FROM entities e
    JOIN user_entity_access uea ON e.entity_uuid = uea.entity_uuid
    WHERE uea.user_uuid = p_user_uuid
    AND uea.is_active = true
    AND e.is_active = true
    ORDER BY e.entity_name;
  END IF;
END;
$function$;

-- Update the is_entity_admin_for_scope function
CREATE OR REPLACE FUNCTION public.is_entity_admin_for_scope(p_user_uuid uuid, p_entity_uuid uuid DEFAULT NULL::uuid, p_entity_group_uuid uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is super admin first (can manage everything)
  IF is_super_admin_user() THEN
    RETURN true;
  END IF;
  
  -- Check direct entity access
  IF p_entity_uuid IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM user_entity_access uea
      WHERE uea.user_uuid = p_user_uuid
        AND uea.entity_uuid = p_entity_uuid
        AND uea.is_active = true
        AND uea.access_level = 'entity_admin'
    );
  END IF;
  
  -- Check entity group access
  IF p_entity_group_uuid IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM user_entity_access uea
      WHERE uea.user_uuid = p_user_uuid
        AND uea.entity_group_uuid = p_entity_group_uuid
        AND uea.is_active = true
        AND uea.access_level = 'entity_admin'
    );
  END IF;
  
  RETURN false;
END;
$function$;

-- Drop and recreate RLS policies on user_entity_access with updated column names
DROP POLICY IF EXISTS "Entity admins can delete access grants in their scope v2" ON user_entity_access;
DROP POLICY IF EXISTS "Entity admins can insert access grants in their scope v2" ON user_entity_access;
DROP POLICY IF EXISTS "Entity admins can update access grants in their scope v2" ON user_entity_access;
DROP POLICY IF EXISTS "Entity admins can view access grants in their scope v2" ON user_entity_access;
DROP POLICY IF EXISTS "Super admins can manage all user entity access" ON user_entity_access;
DROP POLICY IF EXISTS "Users can view their own access grants" ON user_entity_access;

-- Recreate RLS policies with updated column names
CREATE POLICY "Entity admins can delete access grants in their scope v2" ON user_entity_access
  FOR DELETE USING (
    is_super_admin_user() OR 
    is_entity_admin_for_scope(
      (SELECT user_accounts.user_uuid FROM user_accounts WHERE user_accounts.supabase_user_uuid = auth.uid()),
      entity_uuid, 
      entity_group_uuid
    )
  );

CREATE POLICY "Entity admins can insert access grants in their scope v2" ON user_entity_access
  FOR INSERT WITH CHECK (
    is_super_admin_user() OR 
    is_entity_admin_for_scope(
      (SELECT user_accounts.user_uuid FROM user_accounts WHERE user_accounts.supabase_user_uuid = auth.uid()),
      entity_uuid, 
      entity_group_uuid
    )
  );

CREATE POLICY "Entity admins can update access grants in their scope v2" ON user_entity_access
  FOR UPDATE USING (
    is_super_admin_user() OR 
    is_entity_admin_for_scope(
      (SELECT user_accounts.user_uuid FROM user_accounts WHERE user_accounts.supabase_user_uuid = auth.uid()),
      entity_uuid, 
      entity_group_uuid
    )
  );

CREATE POLICY "Entity admins can view access grants in their scope v2" ON user_entity_access
  FOR SELECT USING (
    is_super_admin_user() OR 
    user_uuid = (SELECT user_accounts.user_uuid FROM user_accounts WHERE user_accounts.supabase_user_uuid = auth.uid()) OR
    is_entity_admin_for_scope(
      (SELECT user_accounts.user_uuid FROM user_accounts WHERE user_accounts.supabase_user_uuid = auth.uid()),
      entity_uuid, 
      entity_group_uuid
    )
  );

CREATE POLICY "Super admins can manage all user entity access" ON user_entity_access
  FOR ALL USING (is_super_admin_user());

CREATE POLICY "Users can view their own access grants" ON user_entity_access
  FOR SELECT USING (
    user_uuid = (SELECT user_accounts.user_uuid FROM user_accounts WHERE user_accounts.supabase_user_uuid = auth.uid())
  );