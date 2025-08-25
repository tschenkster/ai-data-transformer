
-- 1) Data hygiene: deactivate duplicate active grants (entity)
WITH ranked AS (
  SELECT
    user_entity_access_id,
    user_account_uuid,
    entity_uuid,
    granted_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_account_uuid, entity_uuid
      ORDER BY granted_at DESC, user_entity_access_id DESC
    ) AS rn
  FROM public.user_entity_access
  WHERE is_active = true AND entity_uuid IS NOT NULL
)
UPDATE public.user_entity_access uea
SET is_active = false, revoked_at = now()
FROM ranked r
WHERE uea.user_entity_access_id = r.user_entity_access_id
  AND r.rn > 1;

-- 1b) Data hygiene: deactivate duplicate active grants (entity group)
WITH ranked AS (
  SELECT
    user_entity_access_id,
    user_account_uuid,
    entity_group_uuid,
    granted_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_account_uuid, entity_group_uuid
      ORDER BY granted_at DESC, user_entity_access_id DESC
    ) AS rn
  FROM public.user_entity_access
  WHERE is_active = true AND entity_group_uuid IS NOT NULL
)
UPDATE public.user_entity_access uea
SET is_active = false, revoked_at = now()
FROM ranked r
WHERE uea.user_entity_access_id = r.user_entity_access_id
  AND r.rn > 1;

-- 2) Enforce uniqueness with partial unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS uea_unique_active_entity
ON public.user_entity_access (user_account_uuid, entity_uuid)
WHERE is_active = true AND entity_uuid IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uea_unique_active_entity_group
ON public.user_entity_access (user_account_uuid, entity_group_uuid)
WHERE is_active = true AND entity_group_uuid IS NOT NULL;

-- 3) Unify the granting function (supports either entity OR group, not both)
CREATE OR REPLACE FUNCTION public.grant_entity_access(
  p_user_uuid uuid,
  p_access_level public.access_level,
  p_granted_by_user_uuid uuid,
  p_entity_uuid uuid DEFAULT NULL,
  p_entity_group_uuid uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    WHERE user_account_uuid = p_user_uuid
      AND entity_uuid = p_entity_uuid
      AND is_active = false;

    IF NOT FOUND THEN
      -- Insert or upsert on active entity grant
      INSERT INTO public.user_entity_access (
        user_account_uuid,
        user_account_id,
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
      ON CONFLICT (user_account_uuid, entity_uuid)
      WHERE is_active = true
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
    WHERE user_account_uuid = p_user_uuid
      AND entity_group_uuid = p_entity_group_uuid
      AND is_active = false;

    IF NOT FOUND THEN
      -- Insert or upsert on active group grant
      INSERT INTO public.user_entity_access (
        user_account_uuid,
        user_account_id,
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
      ON CONFLICT (user_account_uuid, entity_group_uuid)
      WHERE is_active = true
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
$$;
