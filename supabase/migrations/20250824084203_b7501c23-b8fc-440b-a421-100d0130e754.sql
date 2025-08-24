-- Add entity context to existing tables and create essential functions

-- Add entity context to existing tables
ALTER TABLE public.report_structures 
ADD COLUMN IF NOT EXISTS entity_uuid UUID,
ADD COLUMN IF NOT EXISTS entity_id INTEGER;

ALTER TABLE public.report_line_items 
ADD COLUMN IF NOT EXISTS entity_uuid UUID,
ADD COLUMN IF NOT EXISTS entity_id INTEGER;

ALTER TABLE public.coa_translation_sessions 
ADD COLUMN IF NOT EXISTS coa_translation_session_id INTEGER GENERATED ALWAYS AS IDENTITY,
ADD COLUMN IF NOT EXISTS entity_uuid UUID,
ADD COLUMN IF NOT EXISTS entity_id INTEGER;

ALTER TABLE public.security_audit_logs 
ADD COLUMN IF NOT EXISTS security_audit_log_id INTEGER GENERATED ALWAYS AS IDENTITY,
ADD COLUMN IF NOT EXISTS entity_uuid UUID,
ADD COLUMN IF NOT EXISTS entity_id INTEGER;

-- Add foreign key constraints (only if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'fk_report_structures_entity') THEN
        ALTER TABLE public.report_structures 
        ADD CONSTRAINT fk_report_structures_entity 
        FOREIGN KEY (entity_uuid) REFERENCES entities(entity_uuid);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'fk_report_line_items_entity') THEN
        ALTER TABLE public.report_line_items 
        ADD CONSTRAINT fk_report_line_items_entity 
        FOREIGN KEY (entity_uuid) REFERENCES entities(entity_uuid);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'fk_coa_translation_sessions_entity') THEN
        ALTER TABLE public.coa_translation_sessions 
        ADD CONSTRAINT fk_coa_translation_sessions_entity 
        FOREIGN KEY (entity_uuid) REFERENCES entities(entity_uuid);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'fk_security_audit_logs_entity') THEN
        ALTER TABLE public.security_audit_logs 
        ADD CONSTRAINT fk_security_audit_logs_entity 
        FOREIGN KEY (entity_uuid) REFERENCES entities(entity_uuid);
    END IF;
END $$;

-- Add unique constraints for new ID columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'uq_coa_translation_sessions_id') THEN
        ALTER TABLE public.coa_translation_sessions 
        ADD CONSTRAINT uq_coa_translation_sessions_id UNIQUE (coa_translation_session_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                  WHERE constraint_name = 'uq_security_audit_logs_id') THEN
        ALTER TABLE public.security_audit_logs 
        ADD CONSTRAINT uq_security_audit_logs_id UNIQUE (security_audit_log_id);
    END IF;
END $$;

-- Backfill entity_uuid for existing records
UPDATE public.report_structures 
SET entity_uuid = (SELECT entity_uuid FROM entities WHERE entity_code = 'DEFAULT_ENTITY'),
    entity_id = (SELECT entity_id FROM entities WHERE entity_code = 'DEFAULT_ENTITY')
WHERE entity_uuid IS NULL;

UPDATE public.report_line_items 
SET entity_uuid = (SELECT entity_uuid FROM entities WHERE entity_code = 'DEFAULT_ENTITY'),
    entity_id = (SELECT entity_id FROM entities WHERE entity_code = 'DEFAULT_ENTITY')
WHERE entity_uuid IS NULL;

UPDATE public.coa_translation_sessions 
SET entity_uuid = (SELECT entity_uuid FROM entities WHERE entity_code = 'DEFAULT_ENTITY'),
    entity_id = (SELECT entity_id FROM entities WHERE entity_code = 'DEFAULT_ENTITY')
WHERE entity_uuid IS NULL;

-- Create essential entity management functions
CREATE OR REPLACE FUNCTION public.get_user_accessible_entities(p_user_uuid uuid)
RETURNS TABLE(entity_uuid uuid, entity_name text, entity_code text, access_level text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    WHERE uea.user_account_uuid = p_user_uuid
    AND uea.is_active = true
    AND e.is_active = true
    ORDER BY e.entity_name;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_entity_access(p_user_uuid uuid, p_entity_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Super admins have access to all entities
  IF is_super_admin_user() THEN
    RETURN true;
  END IF;
  
  -- Check if user has direct access to the entity
  RETURN EXISTS (
    SELECT 1 
    FROM user_entity_access uea
    WHERE uea.user_account_uuid = p_user_uuid
    AND uea.entity_uuid = p_entity_uuid
    AND uea.is_active = true
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_entity_access(
  p_user_uuid uuid,
  p_entity_uuid uuid,
  p_access_level access_level,
  p_granted_by_user_uuid uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id integer;
  v_entity_id integer;
BEGIN
  -- Get the integer IDs
  SELECT user_id INTO v_user_id FROM user_accounts WHERE user_uuid = p_user_uuid;
  SELECT entity_id INTO v_entity_id FROM entities WHERE entity_uuid = p_entity_uuid;
  
  -- Insert the access record
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
$$;

-- Create access records for existing users (migrate legacy roles)
INSERT INTO user_entity_access (user_account_uuid, user_account_id, entity_uuid, entity_id, access_level, granted_by_user_uuid)
SELECT 
  ua.user_uuid, 
  ua.user_id, 
  e.entity_uuid, 
  e.entity_id,
  CASE 
    WHEN EXISTS(SELECT 1 FROM user_roles ur WHERE ur.user_uuid = ua.user_uuid AND ur.role = 'super_admin') THEN 'entity_admin'::access_level
    WHEN EXISTS(SELECT 1 FROM user_roles ur WHERE ur.user_uuid = ua.user_uuid AND ur.role = 'admin') THEN 'entity_admin'::access_level
    ELSE 'viewer'::access_level
  END,
  NULL -- No granter for legacy data
FROM user_accounts ua
CROSS JOIN entities e
WHERE e.entity_code = 'DEFAULT_ENTITY'
AND NOT EXISTS (
  SELECT 1 FROM user_entity_access uea 
  WHERE uea.user_account_uuid = ua.user_uuid 
  AND uea.entity_uuid = e.entity_uuid
);